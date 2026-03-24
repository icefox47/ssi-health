import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timezone

# We create the DB in the current working directory, which will be backend/
DATABASE_URL = "sqlite:///./issuer_data.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class IssuedCredential(Base):
    __tablename__ = "issued_credentials"
    vc_id = Column(String, primary_key=True, index=True)
    subject_did = Column(String, index=True)
    credential_type = Column(String)
    status = Column(String, default="valid") # 'valid' or 'revoked'
    vc_payload = Column(JSON)
    issuance_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String) # 'ISSUE', 'REVOKE'
    details = Column(JSON)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
