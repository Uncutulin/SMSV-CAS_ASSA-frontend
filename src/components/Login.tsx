import React, { useState } from 'react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validar las credenciales requeridas
    if (email === 'admin' && password === 'admin') {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans">
      {/* Left Section */}
      <div className="hidden lg:flex w-[55%] bg-[#003865] items-center justify-center flex-col relative overflow-hidden">
        {/* Simple representation of the S logo */}
        <div className="flex flex-col items-center z-10">
          <svg width="180" height="180" viewBox="0 0 100 100" className="mb-2">
            <path d="M 10 30 L 90 10 L 90 25 L 10 45 Z" fill="#00AEEF" opacity="0.4" />
            <path d="M 10 50 L 90 30 L 90 45 L 10 65 Z" fill="#00AEEF" opacity="0.7" />
            <path d="M 10 70 L 90 50 L 90 65 L 10 85 Z" fill="#00AEEF" />
          </svg>
          <h1 className="text-7xl font-black text-[#00AEEF] tracking-tighter leading-none mb-1">CAS-ASSA</h1>
          <p className="text-2xl text-[#00AEEF] uppercase tracking-[0.35em] font-bold">seguros</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-full lg:w-[45%] bg-[#EEF2FF] flex items-center justify-center relative">
        <div className="bg-white rounded-xl shadow-lg p-10 w-[400px] flex flex-col items-center">
          {/* Small Logo */}
          <div className="flex items-center gap-3 mb-4">
            <svg width="40" height="40" viewBox="0 0 100 100">
              <path d="M 10 30 L 90 10 L 90 25 L 10 45 Z" fill="#00AEEF" opacity="0.4" />
              <path d="M 10 50 L 90 30 L 90 45 L 10 65 Z" fill="#00AEEF" opacity="0.7" />
              <path d="M 10 70 L 90 50 L 90 65 L 10 85 Z" fill="#00AEEF" />
            </svg>
            <div className="flex flex-col justify-center">
              <span className="text-2xl font-black text-[#00AEEF] leading-none tracking-tight">CAS-ASSA</span>
              <span className="text-[10px] text-center text-[#00AEEF] uppercase tracking-[0.25em] font-bold mt-1">seguros</span>
            </div>
          </div>

          <h2 className="text-slate-500 text-[13px] mb-8 font-medium">Inicia sesión en tu cuenta</h2>

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <div>
              <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(false); }}
                className={`w-full px-4 py-2.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#003865] focus:border-[#003865] transition-all placeholder:text-slate-400 ${error ? 'border-red-500' : 'border-slate-200'}`}
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                className={`w-full px-4 py-2.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#003865] focus:border-[#003865] transition-all placeholder:text-slate-400 ${error ? 'border-red-500' : 'border-slate-200'}`}
              />
            </div>
            {error && <p className="text-red-500 text-[13px] text-center">Credenciales incorrectas (Usa admin / admin)</p>}

            <button
              type="submit"
              className="w-full bg-[#003865] hover:bg-[#002244] text-white py-2.5 rounded-md text-[13px] font-semibold transition-colors mt-2"
            >
              Siguiente
            </button>
          </form>
        </div>

        <div className="absolute bottom-6 right-6 text-[11px] text-slate-400 font-medium">
          © 2026 CAS-ASSA
        </div>
      </div>
    </div>
  );
}
