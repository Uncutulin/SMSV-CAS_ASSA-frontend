import React, { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import {
  login,
  twoFactorChallenge,
  enableTwoFactor,
  getTwoFactorQrCode,
  getTwoFactorSecretKey,
  confirmTwoFactor,
  forgotPassword
} from '../services/authService';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isPastingRef = useRef(false);

  const [tempSetupToken, setTempSetupToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [qrCodeSvg, setQrCodeSvg] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      const nav = window.navigator;
      const screen = window.screen;
      const fingerprint = btoa(nav.userAgent + nav.language + screen.width + screen.height).substring(0, 32);
      deviceId = fingerprint;
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) return;

    setLoading(true);
    setError('');

    try {
      const deviceId = getDeviceId();
      const data = await login(credentials, deviceId);

      if (data.two_factor) {
        setTempSetupToken(data.access_token);
        setStep(2);
      } else if (data.requires_2fa_setup) {
        setTempSetupToken(data.access_token);
        setStep(3);
        setup2FAForNewUser(data.access_token);
      } else if (data.user) {
        localStorage.setItem('user_data', JSON.stringify(data.user));
        if (data.access_token) {
          localStorage.setItem('bi_token', data.access_token);
        }
        if (data.local_access_token) {
          localStorage.setItem('auth_token', data.local_access_token);
        }
        onLogin();
      }
    } catch (error: any) {
      setError(error.message || 'Error al intentar contactar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const { value: email } = await Swal.fire({
      title: 'Recuperar Contraseña',
      input: 'email',
      inputLabel: 'Ingresa tu correo electrónico',
      inputPlaceholder: 'tu@email.com',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#003865',
      inputValidator: (value) => {
        if (!value) {
          return '¡Por favor ingresa tu email!';
        }
      }
    });

    if (email) {
      setLoading(true);
      try {
        await forgotPassword(email);
        Swal.fire({
          icon: 'success',
          title: '¡Email enviado!',
          text: 'Se ha enviado una nueva contraseña a tu correo electrónico.',
          confirmButtonColor: '#003865',
        });
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'No se pudo procesar la solicitud.',
          confirmButtonColor: '#003865',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const setup2FAForNewUser = async (token: string) => {
    try {
      await enableTwoFactor(token);

      const [qrData, secretData] = await Promise.all([
        getTwoFactorQrCode(token).catch(err => {
          console.error('Error fetching QR', err);
          return { svg: null };
        }),
        getTwoFactorSecretKey(token).catch(err => {
          console.error('Error fetching secret key', err);
          return { secretKey: null };
        })
      ]);

      if (qrData.svg && secretData.secretKey) {
        setQrCodeSvg(qrData.svg);
        setSecretKey(secretData.secretKey);
      } else {
        if (qrData.svg) setQrCodeSvg(qrData.svg);
        if (secretData.secretKey) setSecretKey(secretData.secretKey);
      }
    } catch (e) {
      console.error('Error en configuración de 2FA', e);
    }
  };

  const handleConfirm2FA = async (e?: React.FormEvent, codeOverride?: string[]) => {
    if (e) e.preventDefault();
    const fullCode = codeOverride ? codeOverride.join('') : code.join('');
    if (fullCode.length < 6) {
      setError('Por favor, ingrese los 6 dígitos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const deviceId = getDeviceId();
      const data = await confirmTwoFactor(fullCode, tempSetupToken, deviceId);

      if (data.user) {
        localStorage.setItem('user_data', JSON.stringify(data.user));
        if (data.access_token) {
          localStorage.setItem('bi_token', data.access_token);
        }
        if (data.local_access_token) {
          localStorage.setItem('auth_token', data.local_access_token);
        }
      }

      setTempSetupToken('');
      setCode(['', '', '', '', '', '']);

      Swal.fire({
        icon: 'success',
        title: '¡Configuración exitosa!',
        text: 'El segundo factor de autenticación ha sido configurado y has iniciado sesión correctamente.',
        confirmButtonColor: '#003865',
        timer: 2000,
        showConfirmButton: false
      });

      setTimeout(() => {
        onLogin();
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Error al verificar el código. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const triggerAutoSubmit = (codeArray: string[]) => {
    const fullCode = codeArray.join('');
    if (fullCode.length === 6) {
      setTimeout(() => {
        if (step === 2) {
          handleSubmit(undefined, codeArray);
        } else if (step === 3) {
          handleConfirm2FA(undefined, codeArray);
        }
      }, 50);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    isPastingRef.current = true;
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      if (i < pastedData.length) {
        newCode[i] = pastedData[i];
      }
    }
    setCode(newCode);

    const focusIndex = Math.min(pastedData.length - 1, 5);
    setTimeout(() => {
      inputRefs.current[focusIndex]?.focus();
    }, 0);

    if (pastedData.length === 6) {
      triggerAutoSubmit(newCode);
    }

    setTimeout(() => {
      isPastingRef.current = false;
    }, 100);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (isPastingRef.current) return;
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) {
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
      return;
    }

    if (cleanValue.length > 1) {
      if (cleanValue.length >= 6 || (index === 0 && cleanValue.length >= 5)) {
        const pastedCode = cleanValue.slice(0, 6).split('');
        const newCode = [...code];
        pastedCode.forEach((char, i) => {
          if (index + i < 6) newCode[index + i] = char;
        });
        setCode(newCode);
        const nextIndex = Math.min(index + pastedCode.length - 1, 5);
        setTimeout(() => {
          inputRefs.current[nextIndex]?.focus();
        }, 0);
        triggerAutoSubmit(newCode);
        return;
      } else {
        const lastChar = cleanValue.slice(-1);
        const newCode = [...code];
        newCode[index] = lastChar;
        setCode(newCode);
        if (index < 5) {
          inputRefs.current[index + 1]?.focus();
        }
        triggerAutoSubmit(newCode);
        return;
      }
    }

    const newCode = [...code];
    newCode[index] = cleanValue;
    setCode(newCode);

    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    triggerAutoSubmit(newCode);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent, codeOverride?: string[]) => {
    if (e) e.preventDefault();
    const fullCode = codeOverride ? codeOverride.join('') : code.join('');
    if (fullCode.length < 6) {
      setError('Por favor, ingrese los 6 dígitos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const deviceId = getDeviceId();
      const data = await twoFactorChallenge(fullCode, tempSetupToken, deviceId);

      if (data.user) {
        localStorage.setItem('user_data', JSON.stringify(data.user));
        if (data.access_token) {
          localStorage.setItem('bi_token', data.access_token);
        }
        if (data.local_access_token) {
          localStorage.setItem('auth_token', data.local_access_token);
        }
      }
      onLogin();
    } catch (error: any) {
      setError(error.message || 'No se pudo verificar el código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex font-sans bg-slate-50 relative overflow-hidden">
      
      {step === 1 ? (
        <>
          <div className="hidden lg:flex w-[55%] bg-[#003865] items-center justify-center flex-col relative overflow-hidden">
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

          <div className="w-full lg:w-[45%] bg-[#EEF2FF] flex items-center justify-center relative">
            <div className="bg-white rounded-xl shadow-lg p-8 sm:p-10 w-full max-w-[400px] mx-4 sm:mx-0 flex flex-col items-center">
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

              <form onSubmit={handleNextStep} className="w-full space-y-5">
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={credentials.email}
                    onChange={(e) => { setCredentials({...credentials, email: e.target.value}); setError(''); }}
                    className={`w-full px-4 py-2.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#003865] focus:border-[#003865] transition-all placeholder:text-slate-400 ${error ? 'border-red-500' : 'border-slate-200'}`}
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={credentials.password}
                    onChange={(e) => { setCredentials({...credentials, password: e.target.value}); setError(''); }}
                    className={`w-full px-4 py-2.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#003865] focus:border-[#003865] transition-all placeholder:text-slate-400 ${error ? 'border-red-500' : 'border-slate-200'}`}
                    required
                  />
                </div>
                {error && <p className="text-red-500 text-[13px] text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-[#003865] hover:bg-[#002244] text-white py-2.5 rounded-md text-[13px] font-semibold transition-colors mt-2 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Conectando...
                    </>
                  ) : (
                    'Siguiente'
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-slate-500 hover:text-[#003865] transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </form>
            </div>
            <div className="absolute bottom-6 right-6 text-[11px] text-slate-400 font-medium">
              © {new Date().getFullYear()} CAS-ASSA
            </div>
          </div>
        </>
      ) : step === 2 ? (
        <div className="flex-1 flex flex-col justify-center items-center px-4 z-10 w-full backdrop-blur-md">
          <form className="w-full max-w-[450px] space-y-6 bg-white rounded-xl shadow-2xl p-10" onSubmit={handleSubmit}>
            <div className="text-center border-b border-slate-100 pb-5">
              <h2 className="text-xl font-bold text-[#003865]">Autenticación de Dos Factores</h2>
              <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
                Ingresa el código de 6 dígitos de tu aplicación de autenticación para continuar.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 my-8">
              {code.slice(0, 6).map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 text-slate-800 rounded-md border border-slate-200 focus:ring-2 focus:ring-[#00AEEF] outline-none transition-all"
                />
              ))}
            </div>

            {error && (
              <div className="mt-2 p-3 bg-red-50 text-center text-[13px] border-l-2 border-red-500 text-red-600 rounded-md font-medium">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 text-[13px] font-bold rounded-md text-white bg-[#003865] hover:bg-[#002244] focus:outline-none transition-colors disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Verificar e Ingresar'}
              </button>
            </div>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-medium text-slate-500 hover:text-[#00AEEF] transition-colors"
              >
                Volver al inicio
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center items-center px-4 z-10 w-full backdrop-blur-md">
          <form className="w-full max-w-[500px] space-y-6 bg-white rounded-xl shadow-2xl p-10" onSubmit={handleConfirm2FA}>
            <div className="text-center border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-[#003865]">Configuración de Seguridad</h2>
              <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
                Para proteger tu cuenta, es obligatorio configurar el segundo factor de autenticación (2FA).
              </p>
            </div>

            <div className="flex flex-col items-center justify-center my-4 space-y-4">
              {qrCodeSvg ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl" dangerouslySetInnerHTML={{ __html: qrCodeSvg }} />
                  {secretKey && (
                    <div className="w-full max-w-[280px]">
                      <p className="text-[11px] text-slate-400 mb-2 font-medium text-center">¿No puedes escanear el código QR?</p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(secretKey);
                          Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: 'Clave copiada',
                            showConfirmButton: false,
                            timer: 2000
                          });
                        }}
                        className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-4 py-2.5 text-xs font-mono text-slate-700 transition-colors shadow-sm cursor-pointer"
                      >
                        <span className="truncate mr-2 font-bold tracking-wider">{secretKey}</span>
                        <span className="text-[#00AEEF]">Copiar</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-48 h-48 bg-slate-50 animate-pulse rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium">
                  Generando QR...
                </div>
              )}
              <p className="text-[12px] text-slate-500 text-center max-w-sm leading-relaxed">
                Escanea el código con Google Authenticator o Authy e ingresa el código generado abajo.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
              {code.slice(0, 6).map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 text-slate-800 rounded-md border border-slate-200 focus:ring-2 focus:ring-[#00AEEF] outline-none transition-all"
                />
              ))}
            </div>

            {error && (
              <div className="mt-2 p-3 bg-red-50 text-center text-[13px] border-l-2 border-red-500 text-red-600 rounded-md font-medium">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || !qrCodeSvg}
                className="w-full flex justify-center py-3 px-4 text-[13px] font-bold rounded-md text-white bg-[#003865] hover:bg-[#002244] focus:outline-none transition-colors disabled:opacity-50"
              >
                {loading ? 'Confirmando...' : 'Confirmar y Continuar'}
              </button>
            </div>
            
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                Volver al inicio
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
