import React, { useState, useEffect } from 'react';
import api from '../api';
import { Ban, Activity, CheckCircle, XCircle } from 'lucide-react';

function RevocationPanel() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const res = await api.get('/credentials');
      setCredentials(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (vc_id) => {
    if (!window.confirm("Are you sure you want to revoke this credential? This cannot be undone.")) return;
    try {
      await api.post(`/revoke/${vc_id}`);
      fetchCredentials(); // refresh
    } catch (err) {
      alert("Failed to revoke credential.");
    }
  };

  return (
    <div>
      <h2><Ban style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Revocation Panel</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Manage active credentials and revoke them if necessary.</p>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
          <Activity className="animate-pulse" /> Fetching credentials...
        </div>
      ) : (
        <div className="glass-panel table-container">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Subject DID</th>
                <th>Date Issued</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {credentials.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No credentials issued yet.</td>
                </tr>
              ) : credentials.map(cred => (
                <tr key={cred.vc_id}>
                  <td style={{ fontWeight: 500 }}>{cred.credential_type}</td>
                  <td>
                    <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cred.subject_did}>
                      {cred.subject_did}
                    </div>
                  </td>
                  <td>{new Date(cred.issuance_date).toLocaleDateString()}</td>
                  <td>
                    {cred.status === 'valid' ? (
                      <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={16} /> Valid</span>
                    ) : (
                      <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><XCircle size={16} /> Revoked</span>
                    )}
                  </td>
                  <td>
                    {cred.status === 'valid' && (
                      <button onClick={() => handleRevoke(cred.vc_id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RevocationPanel;
