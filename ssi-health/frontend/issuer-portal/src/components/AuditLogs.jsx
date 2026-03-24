import React, { useState, useEffect } from 'react';
import api from '../api';
import { ScrollText, Activity } from 'lucide-react';

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit-logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2><ScrollText style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />System Audit Logs</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Chronological record of all issuance and revocation events.</p>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
          <Activity className="animate-pulse" /> Loading logs...
        </div>
      ) : (
        <div className="glass-panel table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No audit logs found.</td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${log.action === 'ISSUE' ? 'badge-success' : 'badge-danger'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <pre style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
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

export default AuditLogs;
