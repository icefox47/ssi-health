import requests
import json
import base58

print("Testing Backend APIs")
# 1. Health
print("1. Health:")
print(requests.get("http://localhost:8000/health").json())

# 2. Generate DID
print("\n2. Generate DID:")
res = requests.get("http://localhost:8000/api/issuer/generate-did")
did_data = res.json()
print("Generated DID:", did_data["did"])

# 3. Login and Issue VC
print("\n3. Login and Issue VC:")
login_res = requests.post(
    "http://localhost:8000/api/issuer/login",
    data={"username": "admin", "password": "password123"}
)
token_data = login_res.json()
if "access_token" not in token_data:
    print("Login failed:", token_data)
    exit(1)
token = token_data["access_token"]
headers = {"Authorization": f"Bearer {token}"}

issue_req = {
    "subject_did": did_data["did"],
    "credential_type": "VaccinationCredential",
    "claims": {"vaccine": "Pfizer", "doses": 2}
}
res = requests.post("http://localhost:8000/api/issuer/issue", json=issue_req, headers=headers)
vc = res.json()
print("Issued VC:", json.dumps(vc, indent=2))

# 4. Verify VC
print("\n4. Verify VC:")
verify_req = {"vc": vc}
res = requests.post("http://localhost:8000/api/verifier/verify", json=verify_req)
print("Verification Result:", res.json())

