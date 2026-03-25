import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import IssueCredential from './components/IssueCredential';
import RevocationPanel from './components/RevocationPanel';
import AuditLogs from './components/AuditLogs';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

function App() {
  const [token, setToken] = useState(localStorage.getItem('issuer_token'));
  
  const login = (newToken) => {
    localStorage.setItem('issuer_token', newToken);
    setToken(newToken);
  };
  
  const logout = () => {
    localStorage.removeItem('issuer_token');
    setToken(null);
  };

  const isAuthenticated = () => {
    if (!token) return false;
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        logout();
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated }}>
      <Router>
        <Routes>
          <Route path="/login" element={!isAuthenticated() ? <Login /> : <Navigate to="/" replace />} />
          
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<IssueCredential />} />
            <Route path="revoke" element={<RevocationPanel />} />
            <Route path="logs" element={<AuditLogs />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
          </Route>
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
