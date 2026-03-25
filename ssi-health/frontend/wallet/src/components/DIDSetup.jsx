import { useState } from "react";
import { api } from "../api";
import { saveVault, loadVault } from "../crypto";
import { KeyRound, FileText, CheckCircle, Copy, QrCode, ShieldCheck, ShieldAlert } from "lucide-react";
import QRCode from "react-qr-code";

const WALLET_PASSWORD = "ssi-demo-password"; // In production, prompt user

export default function DIDSetup({ vault, setVault }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDoc, setShowDoc] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await api.generateDID();
      const newVault = {
        did: data.did,
        keypair: {
          privateKeyBase64: data.privateKeyBase64,
          publicKeyBase64: data.publicKeyBase64,
        },
        didDocument: data.didDocument,
        credentials: [],
        fl_consent: false
      };
      saveVault(newVault, WALLET_PASSWORD);
      setVault(newVault);
    } catch (err) {
      console.error("DID generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyDID = () => {
    navigator.clipboard.writeText(vault?.did || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleConsent = () => {
    const newVault = { ...vault, fl_consent: !vault.fl_consent };
    saveVault(newVault, WALLET_PASSWORD);
    setVault(newVault);
  };

  if (vault?.did) {
    return (
      <div className="space-y-4">
        {/* Identity Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 rounded-full p-2">
              <KeyRound size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Your Decentralized Identity</h2>
              <p className="text-emerald-100 text-sm">Self-Sovereign · Ed25519</p>
            </div>
          </div>

          <div className="bg-black/20 rounded-xl p-3 mb-3">
            <p className="text-xs text-emerald-200 mb-1 font-medium">DID Identifier</p>
            <p className="text-sm font-mono break-all leading-relaxed">{vault.did}</p>
            
            {showQR && (
              <div className="mt-4 bg-white p-3 inline-block rounded-xl shadow-inner mx-auto w-full text-center flex justify-center">
                {typeof QRCode === 'function' ? (
                  <QRCode value={vault.did} size={140} />
                ) : (
                  <QRCode.default value={vault.did} size={140} />
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-4 py-2 text-sm font-medium cursor-pointer"
            >
              <QrCode size={16} />
              {showQR ? "Hide QR" : "Show QR"}
            </button>
            
            <button
              onClick={copyDID}
              className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-4 py-2 text-sm font-medium cursor-pointer"
            >
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy DID"}
            </button>
          </div>
        </div>

        {/* FL Consent Toggle */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="pt-1">
            {vault.fl_consent ? (
              <ShieldCheck size={24} className="text-emerald-500" />
            ) : (
              <ShieldAlert size={24} className="text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-800 mb-1">Health Analytics Participation</h3>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Help research by donating encrypted model updates. <strong>No raw data ever leaves your device</strong>, and Differential Privacy mathematically guarantees your anonymity.
            </p>
            <button
              onClick={toggleConsent}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                vault.fl_consent 
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {vault.fl_consent ? "Participating in Analytics" : "Opt-in to Analytics"}
            </button>
          </div>
        </div>

        {/* DID Document Toggle */}
        <button
          onClick={() => setShowDoc(!showDoc)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <FileText size={16} />
          {showDoc ? "Hide" : "Show"} DID Document
        </button>

        {showDoc && (
          <div className="bg-gray-900 text-green-400 rounded-xl p-4 overflow-x-auto">
            <pre className="text-xs leading-relaxed">
              {JSON.stringify(vault.didDocument, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
        <KeyRound size={36} className="text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Create Your Identity</h2>
      <p className="text-gray-500 mb-8 max-w-sm mx-auto">
        Generate a cryptographic decentralized identifier (DID) to start receiving
        and managing your health credentials.
      </p>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-md cursor-pointer"
      >
        {loading ? "Generating…" : "Generate DID"}
      </button>
    </div>
  );
}
