import requests
import numpy as np
import time
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import log_loss
import argparse

API_URL = "http://localhost:8000/api/fl"
NOISE_MULTIPLIER = 0.01  # Differential privacy noise scale

def generate_synthetic_data(num_samples=1000):
    """
    Generates synthetic health data representing individual DIDs.
    Features: [Age (normalized), Eligibility_Score (normalized)]
    Target: 1 if vaccinated, 0 otherwise
    """
    np.random.seed(42)
    # Age from 18 to 80, normalized 0 to 1
    age = np.random.uniform(18, 80, num_samples) / 100.0
    # Score based on preconditions (0 to 1)
    score = np.random.uniform(0, 1, num_samples)
    
    X = np.column_stack((age, score))
    
    # Probability of vaccination based on age and score
    # Older and higher score -> higher probability
    logits = -3.0 + 4.0 * age + 2.0 * score 
    probs = 1 / (1 + np.exp(-logits))
    
    y = np.random.binomial(1, probs)
    return X, y

def simulate_client_training(client_id, X_local, y_local, global_weights, global_intercept):
    """
    Trains locally for one epoch, applies DP noise, and returns updates.
    """
    clf = SGDClassifier(loss='log_loss', max_iter=1, tol=None, learning_rate='constant', eta0=0.1, random_state=client_id)
    
    # Initial weights
    classes = np.array([0, 1])
    if len(global_weights) > 0:
        clf.coef_ = np.array([global_weights])
        clf.intercept_ = np.array(global_intercept)
        clf.classes_ = classes
    
    # Train
    clf.partial_fit(X_local, y_local, classes=classes)
    
    # Compute local loss
    y_pred_prob = clf.predict_proba(X_local)
    loss = log_loss(y_local, y_pred_prob)
    
    # Add Differential Privacy Noise
    noise_w = np.random.normal(0, NOISE_MULTIPLIER, clf.coef_.shape)
    noise_b = np.random.normal(0, NOISE_MULTIPLIER, clf.intercept_.shape)
    
    noisy_coef = clf.coef_ + noise_w
    noisy_intercept = clf.intercept_ + noise_b
    
    # Prepare payload
    payload = {
        "client_id": f"device_{client_id}",
        "weights": noisy_coef[0].tolist(),
        "intercept": noisy_intercept.tolist(),
        "loss": float(loss),
        "data_size": len(X_local)
    }
    
    return payload

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--clients", type=int, default=5, help="Number of simulated devices")
    parser.add_argument("--rounds", type=int, default=10, help="Number of FL rounds entirely")
    args = parser.parse_args()
    
    X, y = generate_synthetic_data(1000)
    
    # Ensure server is reset
    try:
        requests.post(f"{API_URL}/reset")
        print("Server reset.")
    except Exception as e:
        print("Failed to reach server. Is backend running?", e)
        return

    # Split data among clients
    indices = np.array_split(np.arange(1000), args.clients)
    
    current_round = 1
    
    for r in range(args.rounds):
        print(f"\n--- Starting FL Round {r+1} ---")
        
        # Get global model
        res = requests.get(f"{API_URL}/status").json()
        global_weights = res.get("global_weights", [])
        global_intercept = res.get("global_intercept", [])
        server_round = res.get("current_round", 1)
        
        if server_round > current_round:
            current_round = server_round
        
        for i in range(args.clients):
            X_local = X[indices[i]]
            y_local = y[indices[i]]
            
            payload = simulate_client_training(i, X_local, y_local, global_weights, global_intercept)
            
            # Send to aggregator
            resp = requests.post(f"{API_URL}/update", json=payload)
            print(f"Client {i} submitted: {resp.json().get('message')}")
            time.sleep(0.2) # simulate network latency
            
        # Give server time to aggr
        time.sleep(1)
            
if __name__ == "__main__":
    main()
