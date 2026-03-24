import { useState, useEffect } from "react";
import { api } from "../api";
import { saveVault } from "../crypto";
import CredentialCard from "./CredentialCard";
import { ShieldPlus, PackagePlus, Inbox } from "lucide-react";

const WALLET_PASSWORD = "ssi-demo-password";

// Demo credential templates for Phase 1
const DEMO_TEMPLATES = [
  {
    label: "Vaccination Record",
    type: "VaccinationCredential",
    claims: {
      vaccineType: "Covishield",
      doseNumber: "2",
      batchNumber: "ABV5765",
      vaccinationDate: "2024-03-15",
      facility: "AIIMS Delhi",
    },
  },
  {
    label: "Eligibility Proof",
    type: "EligibilityCredential",
    claims: {
      scheme: "Ayushman Bharat",
      eligible: "true",
      category: "SECC-2011",
      validUntil: "2025-12-31",
    },
  },
];

export default function WalletHome({ vault, setVault }) {
  const [issuing, setIssuing] = useState(null);

  useEffect(() => {
    if (vault?.did) {
      api.fetchMyCredentials(vault.did)
        .then(creds => {
          if (creds && creds.length > 0) {
            // Merge with existing, avoiding duplicates based on vc id
            const existingIds = new Set((vault.credentials || []).map(c => c.id));
            const newCreds = creds.filter(c => !existingIds.has(c.id));
            if (newCreds.length > 0) {
              const updated = {
                ...vault,
                credentials: [...(vault.credentials || []), ...newCreds]
              };
              saveVault(updated, WALLET_PASSWORD);
              setVault(updated);
            }
          }
        })
        .catch(console.error);
    }
  }, [vault?.did]);

  const handleIssue = async (template) => {
    if (!vault?.did) return;
    setIssuing(template.type);
    try {
      const vc = await api.issueCredential(
        vault.did,
        template.type,
        template.claims
      );
      const updated = {
        ...vault,
        credentials: [...(vault.credentials || []), vc],
      };
      saveVault(updated, WALLET_PASSWORD);
      setVault(updated);
    } catch (err) {
      console.error("Issuance failed:", err);
    } finally {
      setIssuing(null);
    }
  };

  const credentials = vault?.credentials || [];

  return (
    <div className="space-y-6">
      {/* Quick Issue Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <PackagePlus size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-700 text-sm">Request Credential (Demo)</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {DEMO_TEMPLATES.map((t) => (
            <button
              key={t.type}
              onClick={() => handleIssue(t)}
              disabled={issuing !== null}
              className="bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-md rounded-xl p-4 text-left transition-all disabled:opacity-50 cursor-pointer"
            >
              <ShieldPlus
                size={20}
                className={
                  issuing === t.type ? "text-emerald-400 animate-pulse" : "text-emerald-600"
                }
              />
              <p className="text-sm font-medium text-gray-800 mt-2">{t.label}</p>
              <p className="text-xs text-gray-400 mt-1">
                {issuing === t.type ? "Issuing…" : "Tap to issue"}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Credentials List */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldPlus size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-700 text-sm">
            Your Credentials ({credentials.length})
          </h3>
        </div>

        {credentials.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
            <Inbox size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No credentials yet</p>
            <p className="text-gray-300 text-xs mt-1">
              Use the buttons above to request demo credentials
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {credentials.map((vc, idx) => (
              <CredentialCard key={vc.id || idx} credential={vc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
