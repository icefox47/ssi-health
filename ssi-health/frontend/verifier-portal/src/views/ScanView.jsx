import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { ShieldCheck, ShieldAlert, ShieldX, Clock, RefreshCcw } from 'lucide-react';

const ScanView = () => {
  const [scanResult, setScanResult] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    // Only initialize scanner if there's no result
    if (scanResult) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 300, height: 300 } },
      /* verbose= */ false
    );

    scanner.render(
      async (decodedText) => {
        scanner.clear();
        setScanResult(decodedText);
        await verifyCredential(decodedText);
      },
      (errorMessage) => {
        // ignore scan errors (they happen every frame when no QR is detected)
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [scanResult]);

  const verifyCredential = async (payload) => {
    setIsVerifying(true);
    const startTime = performance.now();
    
    try {
      // Allow for raw JSON string or URL safe b64 if the issuer portal is encoding
      let vc;
      try {
        vc = JSON.parse(payload);
      } catch (e) {
        vc = JSON.parse(atob(payload));
      }

      const res = await axios.post('http://localhost:8000/api/verifier/verify', { vc });
      
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setVerificationData(res.data);
    } catch (error) {
      console.error(error);
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setVerificationData({
        valid: false,
        status: "invalid",
        reason: error.response?.data?.detail || "Credential payload invalid or unreadable.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setVerificationData(null);
  };

  const renderResultIcon = () => {
    if (!verificationData) return null;
    if (verificationData.valid) return <ShieldCheck size={64} className="text-green-500 mx-auto mb-4" />;
    if (verificationData.status === "expired") return <ShieldAlert size={64} className="text-yellow-500 mx-auto mb-4" />;
    return <ShieldX size={64} className="text-red-500 mx-auto mb-4" />; // Revoked or invalid
  };

  return (
    <div className="view-container">
      <h2 className="view-title">Scan Verifiable Credential</h2>
      <p className="view-subtitle">Point the camera at the patient's QR code.</p>

      {!scanResult ? (
        <div className="scanner-container">
          <div id="qr-reader" className="w-full max-w-md mx-auto shadow-md rounded-lg overflow-hidden border border-gray-700"></div>
        </div>
      ) : (
        <div className="result-container animate-fade-in">
          {isVerifying ? (
            <div className="verifying-state">
              <RefreshCcw size={48} className="animate-spin text-blue-500 mx-auto mb-4" />
              <h3>Verifying Cryptographic Signature...</h3>
            </div>
          ) : (
            <div className={`result-card ${verificationData?.valid ? 'border-green-500 bg-green-900/20' : verificationData?.status === 'expired' ? 'border-yellow-500 bg-yellow-900/20' : 'border-red-500 bg-red-900/20'}`}>
              
              {renderResultIcon()}
              
              <h3 className={`text-2xl font-bold mb-2 text-center ${verificationData?.valid ? 'text-green-400' : verificationData?.status === 'expired' ? 'text-yellow-400' : 'text-red-400'}`}>
                {verificationData?.valid ? 'Valid Credential' : 
                 verificationData?.status === 'expired' ? 'Credential Expired' : 'Invalid / Revoked'}
              </h3>
              
              {verificationData?.reason && (
                <p className="text-red-300 text-center mb-4">{verificationData.reason}</p>
              )}

              <div className="metrics-box mb-6 border border-gray-700 bg-gray-800 rounded px-4 py-3 flex justify-between items-center">
                <div className="flex items-center text-gray-300">
                  <Clock size={16} className="mr-2" />
                  <span className="text-sm">Verification Latency</span>
                </div>
                <div className={`font-mono font-bold ${latency < 5000 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {latency} ms
                </div>
              </div>

              {verificationData?.valid && (
                <div className="details-box text-left bg-gray-800 rounded p-4 mb-6">
                  <p className="text-gray-400 text-sm mb-1">Subject DID</p>
                  <p className="font-mono text-xs text-blue-300 mb-3 truncate" title={verificationData.subject}>{verificationData.subject}</p>
                  
                  <p className="text-gray-400 text-sm mb-1">Credential Types</p>
                  <p className="text-sm text-gray-200">{verificationData.type?.join(', ')}</p>
                </div>
              )}

              <button onClick={resetScanner} className="btn-primary w-full">
                Scan Another
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScanView;
