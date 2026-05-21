/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import AdminUsers from './components/AdminUsers';
import Profile from './components/Profile';
import AceptarCobertura from './components/AceptarCobertura';
import CoberturasAceptadas from './components/CoberturasAceptadas';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
    window.location.href = '/dashboard';
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('bi_token');
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
  };

  const userDataString = localStorage.getItem('user_data');
  const user = userDataString ? JSON.parse(userDataString) : null;

  return (
    <Router>
      <Routes>
        {/* Ruta pública */}
        <Route path="/AceptarCobertura" element={<AceptarCobertura />} />

        {/* Rutas protegidas */}
        <Route
          path="/*"
          element={
            !isAuthenticated ? (
              <Login onLogin={handleLogin} />
            ) : (
              <div className="min-h-screen bg-slate-50 flex">
                <Sidebar onLogout={handleLogout} user={user} />
                <main className="flex-grow ml-72 relative">
                  <TopNav user={user} onLogout={handleLogout} />
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/usuarios" element={user?.local_role === 'Admin' ? <AdminUsers /> : <Navigate to="/dashboard" replace />} />
                    <Route path="/coberturas" element={<CoberturasAceptadas />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </div>
            )
          }
        />
      </Routes>
    </Router>
  );
}

