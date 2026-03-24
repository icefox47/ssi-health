import { useState } from "react";
import QRCode from "react-qr-code";
import {
  Syringe,
  ShieldCheck,
  FileText,
  QrCode,
  X,
  CheckCircle,
  Clock,
} from "lucide-react";

const TYPE_ICONS = {
  VaccinationCredential: Syringe,
  EligibilityCredential: ShieldCheck,
};

const TYPE_COLORS = {
  VaccinationCredential: "from-blue-500 to-indigo-600",
  EligibilityCredential: "from-purple-500 to-pink-600",
};

export default function CredentialCard({ credential }) {
  const [showQR, setShowQR] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const credType =
    credential.type?.find((t) => t !== "VerifiableCredential") ||
    "VerifiableCredential";
  const Icon = TYPE_ICONS[credType] || FileText;
  const gradient = TYPE_COLORS[credType] || "from-gray-500 to-gray-600";

  const claims = credential.credentialSubject || {};
  const issuanceDate = credential.issuanceDate
    ? new Date(credential.issuanceDate).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  // Build compact QR payload (entire VC + timestamp)
  const qrPayload = JSON.stringify({
    vc: credential,
    timestamp: new Date().toISOString(),
  });

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradient} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <Icon size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base">{credType.replace(/([A-Z])/g, " $1").trim()}</h3>
              <p className="text-white/70 text-xs">Issued: {issuanceDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
            <CheckCircle size={14} />
            <span className="text-xs font-medium">Signed</span>
          </div>
        </div>
      </div>

      {/* Claims Body */}
      <div className="p-4 space-y-3">
        {Object.entries(claims)
          .filter(([key]) => key !== "id")
          .map(([key, value]) => (
            <div key={key} className="flex justify-between items-center text-sm">
              <span className="text-gray-500 capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </span>
              <span className="font-medium text-gray-800">{String(value)}</span>
            </div>
          ))}

        <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
          <span className="text-gray-500 flex items-center gap-1">
            <Clock size={14} /> Issuer
          </span>
          <span className="font-mono text-xs text-gray-600 truncate max-w-[200px]">
            {credential.issuer}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 p-3 flex gap-2">
        <button
          onClick={() => setShowQR(!showQR)}
          className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl py-2 transition-colors cursor-pointer"
        >
          <QrCode size={16} />
          {showQR ? "Hide QR" : "Show QR"}
        </button>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl py-2 transition-colors cursor-pointer"
        >
          <FileText size={16} />
          {showRaw ? "Hide JSON" : "Raw JSON"}
        </button>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="border-t border-gray-100 p-6 flex flex-col items-center gap-3 bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">Scan to verify this credential</p>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            {typeof QRCode === 'function' ? (
              <QRCode value={qrPayload} size={200} level="M" />
            ) : (
              <QRCode.default value={qrPayload} size={200} level="M" />
            )}
          </div>
          <button
            onClick={() => setShowQR(false)}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer"
          >
            <X size={12} /> Close
          </button>
        </div>
      )}

      {/* Raw JSON */}
      {showRaw && (
        <div className="border-t border-gray-100 p-4 bg-gray-900">
          <pre className="text-xs text-green-400 overflow-x-auto leading-relaxed">
            {JSON.stringify(credential, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
