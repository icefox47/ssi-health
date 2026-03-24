import React, { useState, useEffect } from "react";
import DIDSetup from "./components/DIDSetup";
import WalletHome from "./components/WalletHome";
import { loadVault, hasVault } from "./crypto";
import { Wallet, Shield } from "lucide-react";
import "./App.css";

const WALLET_PASSWORD = "ssi-demo-password";

function App() {
  const [vault, setVault] = useState(null);
  const [tab, setTab] = useState("identity");

  useEffect(() => {
    if (hasVault()) {
      const loaded = loadVault(WALLET_PASSWORD);
      if (loaded) setVault(loaded);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 rounded-xl p-2">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">SSI Wallet</h1>
              <p className="text-xs text-gray-400">Privacy-Preserving Health ID</p>
            </div>
          </div>
          {vault?.did && (
            <div className="bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full">
              ● Connected
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {!vault?.did ? (
          <DIDSetup vault={vault} setVault={setVault} />
        ) : (
          <>
            {/* Tab Bar */}
            <div className="flex bg-white rounded-xl p-1 shadow-sm mb-6">
              <button
                onClick={() => setTab("identity")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  tab === "identity"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Shield size={16} />
                Identity
              </button>
              <button
                onClick={() => setTab("credentials")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  tab === "credentials"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Wallet size={16} />
                Credentials
              </button>
            </div>

            {tab === "identity" ? (
              <DIDSetup vault={vault} setVault={setVault} />
            ) : (
              <WalletHome vault={vault} setVault={setVault} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-300 py-6">
        SSI Health · Phase 1 Prototype · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default App;
