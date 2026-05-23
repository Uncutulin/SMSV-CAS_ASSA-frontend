import React, { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function AceptarCobertura() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [acceptanceDate, setAcceptanceDate] = useState<string>('');
  const [params, setParams] = useState({
    email: '',
    name: '',
    templateid: '',
    attach1: '',
    attach2: '',
    attach3: '',
    attach4: '',
    nombre: '',
    dni: '',
    numero_poliza: '',
    fecha_vigencia: '',
    src_file: '',
    batch_id: ''
  });

  // Prevent duplicate requests during React StrictMode mount
  const requestSent = useRef(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const parsedParams = {
      email: query.get('email') || '',
      name: query.get('name') || '',
      templateid: query.get('templateid') || query.get('template') || '',
      attach1: query.get('attach1') || query.get('adjunto') || '',
      attach2: query.get('attach2') || '',
      attach3: query.get('attach3') || '',
      attach4: query.get('attach4') || '',
      nombre: query.get('nombre') || '',
      dni: query.get('dni') || '',
      numero_poliza: query.get('numero_poliza') || query.get('numero poliza') || query.get('poliza') || '',
      fecha_vigencia: query.get('fecha_vigencia') || query.get('vigencia') || '',
      src_file: query.get('src_file') || query.get('archivo') || '',
      batch_id: query.get('batch_id') || query.get('grupo') || query.get('lote') || ''
    };
    setParams(parsedParams);

    if (!parsedParams.email) {
      setLoading(false);
      setError('Falta el correo electrónico obligatorio en los parámetros de la URL.');
      return;
    }

    if (!requestSent.current) {
      requestSent.current = true;
      submitAcceptance(parsedParams);
    }
  }, []);

  const submitAcceptance = async (dataToSubmit: typeof params) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/AceptarCobertura`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(dataToSubmit)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar la aceptación de cobertura.');
      }

      setAccepted(true);
      if (data.data) {
        setParams(prev => ({
          ...prev,
          nombre: data.data.nombre || prev.nombre,
          name: data.data.nombre || prev.name,
          dni: data.data.dni || prev.dni,
          numero_poliza: data.data.numero_poliza || prev.numero_poliza,
          fecha_vigencia: data.data.fecha_vigencia || prev.fecha_vigencia,
          src_file: data.data.src_file || prev.src_file,
          batch_id: data.data.batch_id || prev.batch_id
        }));
      }
      const dbDate = data.data && data.data.created_at ? data.data.created_at : null;
      const dateToUse = dbDate ? new Date(dbDate) : new Date();
      setAcceptanceDate(dateToUse.toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' }));
    } catch (err: any) {
      console.error('Error registering coverage:', err);
      setError(err.message || 'No se pudo procesar la solicitud automáticamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-between font-sans text-slate-100 relative overflow-hidden">
      {/* Background Decorative Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00AEEF] opacity-10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#003865] opacity-20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header / Brand */}
      <header className="w-full py-6 px-8 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-slate-900/30 z-10">
        <div className="flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 100 100">
            <path d="M 10 30 L 90 10 L 90 25 L 10 45 Z" fill="#00AEEF" opacity="0.4" />
            <path d="M 10 50 L 90 30 L 90 45 L 10 65 Z" fill="#00AEEF" opacity="0.7" />
            <path d="M 10 70 L 90 50 L 90 65 L 10 85 Z" fill="#00AEEF" />
          </svg>
          <div className="flex flex-col justify-center">
            <span className="text-xl font-black text-[#00AEEF] leading-none tracking-tight">CAS-ASSA</span>
            <span className="text-[9px] text-center text-[#00AEEF] uppercase tracking-[0.25em] font-bold mt-0.5">seguros</span>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
          Aceptación Online
        </span>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 z-10">
        {loading ? (
          <div className="w-full max-w-md bg-white/10 border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl p-8 sm:p-10 flex flex-col items-center text-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-[#00AEEF] animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-4 border-white/5 border-b-[#003865] animate-spin [animation-duration:1.5s]"></div>
            </div>
            <h3 className="text-xl font-bold text-white">Procesando Conformidad</h3>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Registrando la aceptación de su cobertura en nuestros sistemas seguros...
            </p>
          </div>
        ) : error ? (
          <div className="w-full max-w-md bg-white/10 border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl p-8 sm:p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">No se pudo procesar</h3>
            <p className="text-sm text-slate-300 mt-2 mb-6 leading-relaxed">
              {error}
            </p>
            <button
              onClick={() => submitAcceptance(params)}
              className="px-6 py-2.5 rounded-lg bg-[#00AEEF] hover:bg-[#0092c7] text-xs font-bold text-white uppercase tracking-wider transition-all"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md bg-white/10 border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl p-8 sm:p-10 flex flex-col items-center text-center">
            {/* Animated Success Checkmark */}
            <div className="w-20 h-20 bg-[#00AEEF]/10 border-2 border-[#00AEEF] rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,174,239,0.3)]">
              <svg className="w-10 h-10 text-[#00AEEF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">¡Cobertura Aceptada!</h2>
            <p className="text-sm text-slate-300 mt-3 max-w-xs">
              Tu conformidad ha sido registrada exitosamente en nuestros sistemas.
            </p>

            {/* Confirmation details */}
            <div className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-4 mt-6 text-left space-y-2">
              <div className="flex justify-between items-start gap-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap">Póliza</span>
                <span className="text-xs font-bold text-white text-right break-all">{params.numero_poliza || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap">Asegurado</span>
                <span className="text-xs font-bold text-white text-right break-words">{params.nombre || params.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap">DNI</span>
                <span className="text-xs font-bold text-white text-right">{params.dni || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap">Email</span>
                <span className="text-xs font-bold text-white text-right break-all">{params.email}</span>
              </div>
              {params.fecha_vigencia && (
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap">Vigencia</span>
                  <span className="text-xs font-bold text-[#00AEEF] text-right break-words">{params.fecha_vigencia}</span>
                </div>
              )}
              {params.src_file && (
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap">Archivo</span>
                  <span className="text-xs font-bold text-white text-right break-all">{params.src_file}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Registrado el</span>
                <span className="text-xs font-bold text-white text-right">{acceptanceDate}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 mt-8 font-medium">
              Puedes cerrar esta ventana de forma segura.
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center border-t border-white/5 text-[10px] text-slate-400 font-medium z-10 bg-slate-950/20 backdrop-blur-sm">
        © {new Date().getFullYear()} CAS-ASSA SEGUROS. Todos los derechos reservados.
      </footer>
    </div>
  );
}
