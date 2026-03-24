import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Shield, FileBadge, Ban, ScrollText, LogOut } from 'lucide-react';

function DashboardLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-logo">
          <Shield color="var(--primary)" size={32} />
          Issuer Portal
        </div>
        
        <div className="nav-links" style={{ flex: 1 }}>
          <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <FileBadge size={20} />
            Issue Credential
          </NavLink>
          <NavLink to="/revoke" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Ban size={20} />
            Revocation Panel
          </NavLink>
          <NavLink to="/logs" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <ScrollText size={20} />
            Audit Logs
          </NavLink>
        </div>
        
        <button onClick={handleLogout} className="btn" style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', justifyContent: 'flex-start' }}>
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
      
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardLayout;
