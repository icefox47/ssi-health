import React, { useState } from 'react';
import axios from 'axios';
import { UserCheck, Upload, FileJson, Clock, CheckCircle, XCircle } from 'lucide-react';

const getApiBase = () => {
  const host = window.location.hostname;
  const port = window.location.protocol === 'https:' ? '8001' : '8000';
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${host}:${port}`;
};

const ZkpView = () => {
  const [proofText, setProofText] = useState('');
  const [signalsText, setSignalsText] = useState('["1"]'); // Default prototype signal
  const [verificationData, setVerificationData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationData(null);
    const startTime = performance.now();

    try {
      const payload = {
        proof: proofText ? JSON.parse(proofText) : {},
        publicSignals: signalsText ? JSON.parse(signalsText) : [],
        verificationKey: {}
      };

      const res = await axios.post(`${getApiBase()}/api/verifier/verify-zkp`, payload);
      const endTime = performance.now();
      
      setVerificationData({
        ...res.data,
        latency: Math.round(endTime - startTime)
      });
    } catch (error) {
      console.error(error);
      const endTime = performance.now();
      setVerificationData({
        valid: false,
        status: "invalid",
        reason: error.response?.data?.detail || "Invalid proof format.",
        latency: Math.round(endTime - startTime)
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const loadDemoProof = () => {
    setProofText(JSON.stringify({ "pi_a": ["123", "456", "1"] }, null, 2));
    setSignalsText(JSON.stringify(["1"], null, 2));
  };

  return (
    <div className="view-container">
      <h2 className="view-title">ZKP Selective Disclosure</h2>
      <p className="view-subtitle mb-6 text-gray-400">Verify a Zero-Knowledge Proof (e.g. "Age &gt; 18") without revealing the underlying raw data.</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="input-section bg-gray-800 p-5 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium flex items-center"><FileJson size={18} className="mr-2" /> Input Proof</h3>
            <button onClick={loadDemoProof} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded">Load Demo</button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Proof JSON</label>
            <textarea 
              className="w-full bg-gray-900 border border-gray-700 rounded p-3 font-mono text-xs text-gray-300 h-32 focus:outline-none focus:border-blue-500"
              placeholder='{"pi_a": ...}'
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Public Signals JSON</label>
            <textarea 
              className="w-full bg-gray-900 border border-gray-700 rounded p-3 font-mono text-xs text-gray-300 h-16 focus:outline-none focus:border-blue-500"
              placeholder='["1"]'
              value={signalsText}
              onChange={(e) => setSignalsText(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">For demo: ["1"] = Valid over-18 proof</p>
          </div>

          <button 
            onClick={handleVerify}
            disabled={isVerifying}
            className={`w-full py-2 rounded font-medium flex justify-center items-center transition-colors ${isVerifying ? 'bg-blue-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
          >
            {isVerifying ? 'Verifying ZKP...' : 'Verify Proof'}
          </button>
        </div>

        <div className="result-section flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg border border-gray-700 min-h-[300px]">
          {!verificationData ? (
            <div className="text-center text-gray-500">
              <Upload size={48} className="mx-auto mb-3 opacity-50" />
              <p>Submit a proof to see the verification result.</p>
            </div>
          ) : (
            <div className={`w-full p-6 text-center rounded-lg border transition-all ${verificationData.valid ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'}`}>
              {verificationData.valid ? (
                <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle size={64} className="text-red-500 mx-auto mb-4" />
              )}
              
              <h3 className={`text-xl font-bold mb-2 ${verificationData.valid ? 'text-green-400' : 'text-red-400'}`}>
                {verificationData.valid ? 'Proof Valid' : 'Proof Invalid'}
              </h3>
              
              {verificationData.reason && (
                <p className="text-red-300 text-sm mb-4">{verificationData.reason}</p>
              )}

              <div className="metrics-box mt-4 bg-gray-900 rounded p-3 flex justify-between items-center text-sm border border-gray-700">
                <span className="flex items-center text-gray-400"><Clock size={14} className="mr-1" /> Latency</span>
                <span className={`font-mono font-bold ${verificationData.latency < 5000 ? 'text-green-400' : 'text-yellow-400'}`}>{verificationData.latency} ms</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZkpView;
