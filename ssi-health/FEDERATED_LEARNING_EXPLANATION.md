# Federated Learning Integration - SSI Health

This document explains the Federated Learning (FL) framework integrated into the **SSI Health** project to enable decentralized health analytics while preserving patient privacy.

---

## 1. Why Federated Learning in Digital Health?

Traditional health data analytics require consolidating sensitive patient records (e.g., vaccine doses, eligibility criteria) into a central warehouse. This central consolidation creates security risks, compliance hurdles (HIPAA, GDPR), and data ownership concerns.

**Federated Learning (FL)** addresses this problem by moving the model training to the local devices (wallets) where data resides. Instead of uploading raw medical records, client devices:
1.  Train a model locally on their own local dataset.
2.  Transmit only the resulting model weights and intercepts to a central aggregator.
3.  The central aggregator averages these weights to construct a global model.
4.  No raw data ever leaves the local device.

```
                  FEDERATED LEARNING WORKFLOW
                  
     1. Push Global Model      ┌───────────────┐
     ┌────────────────────────>│ FL Aggregator │<────────────────────────┐
     │                         │  (FedAvg API) │                         │
     │   3. Submit Weights     └───────────────┘    3. Submit Weights    │
     │   ┌───────────────────────────▲───────────────────────────┐       │
     │   │                           │                           │       │
     ▼   │                           │                           │       ▼
  ┌──────────────┐            ┌──────────────┐            ┌──────────────┐
  │   Client 1   │            │   Client 2   │            │   Client N   │
  │ Local Data 1 │            │ Local Data 2 │            │ Local Data N │
  └──────────────┘            └──────────────┘            └──────────────┘
   2. Local SGD                2. Local SGD                2. Local SGD
```

---

## 2. Mathematical Formulations

The FL system uses a linear classifier for binary classification (predicting whether a patient is vaccinated based on Age and Eligibility Score).

### A. Local Model Optimization (Stochastic Gradient Descent)
Each client $i$ runs an `SGDClassifier` using **binary cross-entropy loss (logistic regression)**.
For a local training batch with $M$ samples, let $X_i \in \mathbb{R}^{M \times D}$ be the features (Age, Eligibility Score), and $y_i \in \{0, 1\}^M$ be the targets.

The local optimization function is:
$$\min_{w, b} \mathcal{L}(w, b) = -\frac{1}{M} \sum_{j=1}^{M} \left[ y_i^{(j)} \log(p_i^{(j)}) + (1 - y_i^{(j)}) \log(1 - p_i^{(j)}) \right]$$

Where:
*   $p_i^{(j)} = \sigma(w \cdot X_i^{(j)} + b)$ is the predicted probability.
*   $\sigma(z) = \frac{1}{1 + e^{-z}}$ is the sigmoid activation function.

In each training round, the client updates weights ($w_i$) and intercepts ($b_i$) using a constant learning rate $\eta$:
$$w_i \leftarrow w_i - \eta \nabla_{w} \mathcal{L}(w_i, b_i)$$
$$b_i \leftarrow b_i - \eta \nabla_{b} \mathcal{L}(w_i, b_i)$$

### B. Local Differential Privacy (Gaussian Noise Injection)
To mathematically guarantee that the transmitted parameters do not expose patient details via membership inference, the client applies the **Gaussian Mechanism** prior to upload.

Let $\sigma_{dp}$ be the noise multiplier (set via `NOISE_MULTIPLIER = 0.01`). The noisy parameters are generated as:
$$w_{noisy} = w_i + e_w, \quad \text{where } e_w \sim \mathcal{N}(0, \sigma_{dp}^2 \cdot I)$$
$$b_{noisy} = b_i + e_b, \quad \text{where } e_b \sim \mathcal{N}(0, \sigma_{dp}^2)$$

*   Adding this noise provides an $(\epsilon, \delta)$-differential privacy boundary, protecting the individual training samples from reconstruction.

### C. Federated Averaging (FedAvg)
Once the FL aggregator receives updates from $N$ clients ($N \ge 5$), it aggregates the parameters. Since the simulation distributes client datasets equally, the server performs a simple average:
$$W_{global} = \frac{1}{N} \sum_{i=1}^{N} w_{noisy}^{(i)}$$
$$B_{global} = \frac{1}{N} \sum_{i=1}^{N} b_{noisy}^{(i)}$$

The averaged global weights and intercepts are stored as the new base model for the next round.

---

## 3. Communication Protocol

Each round of training in the simulation follows these steps:

1.  **Retrieve State**: The simulation script fetches the current global weights and intercepts from `/api/fl/status`.
2.  **Train Locally**: Clients initialize their local classifier weights with the retrieved global model parameters and run one epoch of training (`partial_fit`) on their local dataset partitions.
3.  **Apply Noise**: The client injects Gaussian noise to the weights and bias.
4.  **Submit Update**: The client POSTs the noisy parameters, local loss, and partition data size to `/api/fl/update`.
5.  **Aggregate**: The server queues the update. Once the threshold is met, it runs `FedAvg` to update the global parameters, increments the round counter, and clears the queue.

---

## 4. Performance & Communication Overhead

*   **Convergence**: By collecting model updates over multiple rounds, the global model's loss decreases (converges), achieving similar accuracy to centralized training.
*   **Bandwidth Estimation**: The communication overhead per client update is tracked by the server to monitor network usage. The rough byte count is calculated as:
    $$\text{Overhead (Bytes)} = (\text{Number of Weights}) \times 8 \text{ bytes} + (\text{Number of Intercepts}) \times 8 \text{ bytes} + 64 \text{ bytes (Metadata)}$$
*   In the provided simulation ($D=2$ features), each update requires approximately **88 bytes** of payload data. This lightweight payload makes it well-suited for mobile applications (like digital wallets) running over mobile networks.
