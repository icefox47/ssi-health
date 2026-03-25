from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from issuer.issuer_api import router as issuer_router
from verifier.verifier_api import router as verifier_router
from fl_aggregator.api import router as fl_router
from common.db import init_db

app = FastAPI(title="SSI Health API - Phase 2", version="2.0.0")

# Enable CORS for frontend wallet + issuer portal
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(issuer_router, prefix="/api/issuer", tags=["Issuer"])
app.include_router(verifier_router, prefix="/api/verifier", tags=["Verifier"])
app.include_router(fl_router, prefix="/api/fl", tags=["Federated Learning"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
