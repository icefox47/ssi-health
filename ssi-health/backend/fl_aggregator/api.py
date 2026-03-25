from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np

router = APIRouter()

# In-memory storage for the FL prototype
MIN_CLIENTS_PER_ROUND = 5

class FLState:
    def __init__(self):
        self.current_round = 1
        self.global_weights = []   # e.g., coef_
        self.global_intercept = [] # e.g., intercept_
        
        self.pending_updates = []
        
        self.loss_history = []     # List of loss floats per round
        self.overhead_history = [] # List of bytes communicated per round
        
        # State tracking the model's structure
        self.features_len = 0
        
state = FLState()

class WeightUpdate(BaseModel):
    client_id: str
    weights: List[float]
    intercept: List[float]
    loss: float
    data_size: int

def estimate_bytes(update: WeightUpdate) -> int:
    return len(update.weights) * 8 + len(update.intercept) * 8 + 64 # rough byte count

@router.post("/update")
def receive_update(update: WeightUpdate):
    """
    Receives local model updates from simulation devices.
    Once MIN_CLIENTS_PER_ROUND updates are received, performs FedAvg.
    """
    state.pending_updates.append(update)
    
    # Check if we should aggregate
    if len(state.pending_updates) >= MIN_CLIENTS_PER_ROUND:
        _perform_fedavg()
        
    return {"status": "ok", "message": f"Update received. Pending: {len(state.pending_updates)}/{MIN_CLIENTS_PER_ROUND}"}

def _perform_fedavg():
    # Gather weights and intercepts
    all_w = np.array([u.weights for u in state.pending_updates])
    all_b = np.array([u.intercept for u in state.pending_updates])
    
    # Simple average
    avg_w = np.mean(all_w, axis=0).tolist()
    avg_b = np.mean(all_b, axis=0).tolist()
    
    # Average loss reported from these clients
    avg_loss = float(np.mean([u.loss for u in state.pending_updates]))
    
    # Accumulate communication overhead for this round
    round_bytes = sum(estimate_bytes(u) for u in state.pending_updates)
    
    # Update global model
    state.global_weights = avg_w
    state.global_intercept = avg_b
    state.loss_history.append({"round": state.current_round, "loss": avg_loss})
    state.overhead_history.append({"round": state.current_round, "bytes": round_bytes})
    
    state.current_round += 1
    state.pending_updates = [] # clear for next round

@router.get("/status")
def get_fl_status():
    """
    Returns the latest global model metrics for the Analytics Dashboard.
    """
    return {
        "current_round": state.current_round,
        "global_weights": state.global_weights,
        "global_intercept": state.global_intercept,
        "pending_updates": len(state.pending_updates),
        "loss_history": state.loss_history,
        "overhead_history": state.overhead_history,
        "min_clients": MIN_CLIENTS_PER_ROUND
    }

@router.post("/reset")
def reset_fl_state():
    """Reset simulation state."""
    global state
    state = FLState()
    return {"status": "reset"}
