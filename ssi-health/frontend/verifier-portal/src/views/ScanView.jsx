import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { ShieldCheck, ShieldAlert, ShieldX, Clock, RefreshCcw } from 'lucide-react';

const getApiBase = () => {
  const host = window.location.hostname;
  const port = window.location.protocol === 'https:' ? '8001' : '8000';
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${host}:${port}`;
};

const ScanView = () => {
  const [scanResult, setScanResult] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    // Only initialize scanner if there's no result and scanner div exists
    if (scanResult) return;
    const el = document.getElementById("qr-reader");
    if (!el) return;

    let scanner;
    try {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 300, height: 300 }, supportedScanTypes: [0] }, // 0: Camera only
        /* verbose= */ false
      );

      scanner.render(
        async (decodedText) => {
          if (scanner) {
            scanner.clear().catch(e => console.log("Scanner clear ignore:", e));
          }
          setScanResult(decodedText);
          await verifyCredential(decodedText);
        },
        (errorMessage) => {
          // ignore scan errors
          }
      );
    } catch (e) {
      console.error("Scanner init error:", e);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.log("Scanner cleanup ignore:", e));
      }
    };
  }, [scanResult]);

  const verifyCredential = async (payload) => {
    setIsVerifying(true);
    const startTime = performance.now();
    
    try {
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(payload);
      } catch (e) {
        parsedPayload = JSON.parse(atob(payload));
      }

      // The wallet wraps the VC in { vc: {}, timestamp: "" } for QR codes
      const vcToVerify = parsedPayload.vc || parsedPayload;

      const res = await axios.post(`${getApiBase()}/api/verifier/verify`, { vc: vcToVerify });
      
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setVerificationData(res.data);
    } catch (error) {
      console.error(error);
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      
      let errorMsg = "Credential payload invalid or unreadable.";
      if (error?.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (Array.isArray(detail)) {
          errorMsg = detail.map(e => e.msg || 'Invalid format').join(", ");
        } else {
          errorMsg = JSON.stringify(detail);
        }
      } else if (error?.message) {
        errorMsg = error.message;
      }

      setVerificationData({
        valid: false,
        status: "invalid",
        reason: String(errorMsg),
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

      <div className="scanner-container" style={{ display: scanResult ? 'none' : 'block' }}>
        <div id="qr-reader" className="w-full max-w-md mx-auto shadow-md rounded-lg overflow-hidden border border-gray-700 bg-gray-900"></div>
      </div>

      {scanResult && (
        <div className="result-container animate-fade-in mt-4">
          {isVerifying ? (
            <div className="verifying-state text-center py-12 bg-gray-800 rounded-lg">
              <RefreshCcw size={48} className="animate-spin text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl text-gray-300">Verifying Cryptographic Signature...</h3>
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
                  <p className="font-mono text-xs text-blue-300 mb-3 truncate" title={verificationData.subject}>{verificationData.subject || "Unknown"}</p>
                  
                  <p className="text-gray-400 text-sm mb-1">Credential Types</p>
                  <p className="text-sm text-gray-200">{Array.isArray(verificationData.type) ? verificationData.type.join(', ') : (verificationData.type?.toString() || "Unknown")}</p>
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
