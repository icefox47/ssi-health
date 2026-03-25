import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ShieldCheck, UserCheck } from 'lucide-react';
import ScanView from './views/ScanView';
import ZkpView from './views/ZkpView';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header">
          <div className="header-brand">
            <h1 className="header-title">SSI Health Verifier</h1>
          </div>
          <nav className="header-nav">
            <Link to="/" className="nav-link">
              <ShieldCheck size={20} />
              <span>Verify VC</span>
            </Link>
            <Link to="/zkp" className="nav-link">
              <UserCheck size={20} />
              <span>Selective Disclosure</span>
            </Link>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<ScanView />} />
            <Route path="/zkp" element={<ZkpView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
