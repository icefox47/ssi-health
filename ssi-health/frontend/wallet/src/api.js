const getApiBase = () => {
  const host = window.location.hostname;
  const port = window.location.protocol === 'https:' ? '8001' : '8000';
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${host}:${port}`;
};

const API_BASE = `${getApiBase()}/api`;

export const api = {
  async generateDID() {
    const res = await fetch(`${API_BASE}/issuer/generate-did`);
    if (!res.ok) throw new Error("Failed to generate DID");
    return res.json();
  },

  async getIssuerDID() {
    const res = await fetch(`${API_BASE}/issuer/did`);
    if (!res.ok) throw new Error("Failed to fetch issuer DID");
    return res.json();
  },

  async issueCredential(subjectDid, credentialType, claims) {
    const res = await fetch(`${API_BASE}/issuer/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject_did: subjectDid,
        credential_type: credentialType,
        claims,
      }),
    });
    if (!res.ok) throw new Error("Failed to issue credential");
    return res.json();
  },

  async fetchMyCredentials(did) {
    const res = await fetch(`${API_BASE}/issuer/wallet/credentials/${encodeURIComponent(did)}`);
    if (!res.ok) throw new Error("Failed to fetch wallet credentials");
    return res.json();
  },

  async verifyCredential(vc) {
    const res = await fetch(`${API_BASE}/verifier/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vc }),
    });
    if (!res.ok) throw new Error("Failed to verify credential");
    return res.json();
  },
};
