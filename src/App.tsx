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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const userRoles = Array.isArray(user?.local_roles)
    ? user.local_roles
    : (user?.local_role ? user.local_role.split(',').map((r: string) => r.trim()).filter(Boolean) : []);

  const isAdmin = userRoles.includes('Admin');
  const isLegales = userRoles.includes('Legales');
  const isCoberturas = userRoles.includes('Coberturas Aceptadas');

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
                <Sidebar onLogout={handleLogout} user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                {sidebarOpen && (
                  <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-30 lg:hidden transition-all duration-300"
                    onClick={() => setSidebarOpen(false)}
                  />
                )}
                <main className="flex-grow lg:ml-72 relative min-h-screen w-full">
                  <TopNav user={user} onLogout={handleLogout} onMenuClick={() => setSidebarOpen(true)} />
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/usuarios" element={isAdmin ? <AdminUsers /> : <Navigate to="/dashboard" replace />} />
                    <Route path="/coberturas" element={(isAdmin || isLegales || isCoberturas) ? <CoberturasAceptadas /> : <Navigate to="/dashboard" replace />} />
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

