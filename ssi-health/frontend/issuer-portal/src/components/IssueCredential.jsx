import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import api from '../api';
import { FileBadge, QrCode } from 'lucide-react';

const SCHEMAS = {
  VaccinationCredential: [
    { name: 'vaccineType', label: 'Vaccine Type', type: 'text', placeholder: 'e.g. mRNA-1273' },
    { name: 'date', label: 'Date Administered', type: 'date' },
    { name: 'batchNo', label: 'Batch Number', type: 'text', placeholder: 'e.g. AB1234' }
  ],
  EligibilityCredential: [
    { name: 'eligibility_score', label: 'Eligibility Score', type: 'number', placeholder: '0-100' },
    { name: 'valid_until', label: 'Valid Until', type: 'date' }
  ],
  DischargeSummary: [
    { name: 'discharge_date', label: 'Discharge Date', type: 'date' },
    { name: 'diagnosis', label: 'Diagnosis', type: 'text', placeholder: 'e.g. Viral Infection' },
    { name: 'doctor_name', label: 'Doctor Name', type: 'text', placeholder: 'Dr. Smith' }
  ]
};

function IssueCredential() {
  const [credType, setCredType] = useState('VaccinationCredential');
  const [subjectDid, setSubjectDid] = useState('');
  const [claims, setClaims] = useState({});
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleClaimChange = (name, value) => {
    setClaims(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        subject_did: subjectDid,
        credential_type: credType,
        claims: claims
      };
      await api.post('/issue', payload);
      setSuccess('Credential issued successfully!');
      setSubjectDid('');
      setClaims({});
    } catch (err) {
      setError('Failed to issue credential.');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (result, error) => {
    if (result) {
      // Wallet generates DID string directly
      const scannedText = result?.text || result;
      setSubjectDid(scannedText);
      setScanning(false);
    }
  };

  return (
    <div>
      <h2><FileBadge style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Issue Credential</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Fill out the template to cryptographically sign and issue a Verifiable Credential to a patient.</p>

      {success && <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(16,185,129,0.2)' }}>{success}</div>}
      {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}

      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px' }}>
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label className="form-label">Credential Type</label>
            <select className="form-select" value={credType} onChange={e => {
              setCredType(e.target.value);
              setClaims({});
            }}>
              {Object.keys(SCHEMAS).map(type => (
                <option key={type} value={type}>{type.replace(/([A-Z])/g, ' $1').trim()}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Patient Subject DID</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                value={subjectDid} 
                onChange={e => setSubjectDid(e.target.value)}
                placeholder="did:key:z6Mk..."
                required 
              />
              <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setScanning(!scanning)}>
                <QrCode size={20} />
                {scanning ? 'Cancel' : 'Scan'}
              </button>
            </div>
            
            {scanning && (
              <div style={{ marginTop: '1rem', border: '2px dashed var(--primary)', borderRadius: '8px', overflow: 'hidden' }}>
                <QrReader 
                  onResult={handleScan}
                  constraints={{ facingMode: 'environment' }} 
                  style={{ width: '100%' }} 
                />
              </div>
            )}
          </div>

          <div style={{ margin: '2rem 0', height: '1px', background: 'var(--border-color)' }}></div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Credential Claims</h3>

          {SCHEMAS[credType].map(field => (
            <div className="form-group" key={field.name}>
              <label className="form-label">{field.label}</label>
              <input 
                type={field.type} 
                className="form-input" 
                value={claims[field.name] || ''} 
                onChange={e => handleClaimChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required 
              />
            </div>
          ))}

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Issuing...' : 'Issue & Sign Credential'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default IssueCredential;
