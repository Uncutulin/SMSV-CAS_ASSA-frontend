import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Camera, User, Shield, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Profile() {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        apellido: '',
        dni: '',
        email: '',
        password: '',
        password_confirmation: ''
    });

    useEffect(() => {
        const savedUser = localStorage.getItem('user_data');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
                setFormData({
                    name: parsedUser.name || '',
                    apellido: parsedUser.apellido || '',
                    dni: parsedUser.dni || '',
                    email: parsedUser.email || '',
                    password: '',
                    password_confirmation: ''
                });
                if (parsedUser.avatar_url) {
                    setAvatarPreview(parsedUser.avatar_url);
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
    }, []);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user) return;

        const file = e.target.files[0];

        Swal.fire({
            title: 'Subiendo imagen...',
            text: 'Por favor, espera un momento.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        try {
            const token = localStorage.getItem('auth_token');
            const biToken = localStorage.getItem('bi_token');
            const fd = new FormData();
            fd.append('avatar', file);

            const response = await fetch(`${API_URL}/profile/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-BI-Token': biToken || ''
                },
                body: fd
            });

            if (response.ok) {
                const data = await response.json();
                const updatedUser = { ...user, avatar_url: data.avatar_url };
                localStorage.setItem('user_data', JSON.stringify(updatedUser));
                setUser(updatedUser);
                setAvatarPreview(data.avatar_url);
                Swal.fire({ icon: 'success', title: '¡Foto actualizada!', timer: 1500, showConfirmButton: false });
            } else {
                const err = await response.json();
                Swal.fire('Error', err.message || 'No se pudo subir la imagen.', 'error');
            }
        } catch (error: any) {
            Swal.fire('Error', error.message || 'Error de conexión.', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!formData.name || !formData.apellido || !formData.dni || !formData.email) {
            Swal.fire('Error', 'Por favor complete todos los campos obligatorios', 'error');
            return;
        }
        if (formData.password && formData.password.length < 8) {
            Swal.fire('Error', 'La contraseña debe tener al menos 8 caracteres', 'error');
            return;
        }
        if (formData.password !== formData.password_confirmation) {
            Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            const biToken = localStorage.getItem('bi_token');
            const payload: any = {
                name: formData.name,
                apellido: formData.apellido,
                dni: formData.dni,
                email: formData.email,
            };
            if (formData.password) {
                payload.password = formData.password;
                payload.password_confirmation = formData.password_confirmation;
            }

            const response = await fetch(`${API_URL}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-BI-Token': biToken || ''
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const updatedUser = { ...user, ...payload };
                delete updatedUser.password;
                delete updatedUser.password_confirmation;
                localStorage.setItem('user_data', JSON.stringify(updatedUser));
                setUser(updatedUser);
                setFormData(prev => ({ ...prev, password: '', password_confirmation: '' }));
                Swal.fire({ icon: 'success', title: 'Perfil actualizado', timer: 1500, showConfirmButton: false });
            } else {
                const err = await response.json();
                Swal.fire('Error', err.message || 'No se pudo actualizar el perfil.', 'error');
            }
        } catch (error: any) {
            Swal.fire('Error', error.message || 'Error de conexión.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="pt-24 px-8 pb-12 flex items-center justify-center">
                <p className="text-slate-500">Cargando perfil...</p>
            </div>
        );
    }

    const initials = `${user.name?.charAt(0) || ''}${user.apellido?.charAt(0) || ''}`.toUpperCase();

    return (
        <div className="pt-24 px-8 pb-12 animate-in fade-in duration-700">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[#003865]">Mi Perfil</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Información personal y configuración de cuenta</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Avatar Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-6">
                            <div className="relative group flex-shrink-0">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 bg-[#003865] flex items-center justify-center shadow-md">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-bold text-white">{initials}</span>
                                    )}
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                    <Camera size={22} className="text-white" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                </label>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#003865]">{user.name} {user.apellido}</h2>
                                <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {/* BI Roles */}
                                    {(user.roles || []).map((role: any) => (
                                        <span key={role.id || role.name} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                            <Shield size={11} />
                                            {role.name}
                                        </span>
                                    ))}
                                    {/* Local Role */}
                                    {user.local_role && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#003865]/10 text-[#003865]">
                                            <Shield size={11} />
                                            {user.local_role} (Local)
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Haz clic en la foto para cambiarla</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                            <User size={18} className="text-[#00AEEF]" />
                            Datos Personales
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                                    <input
                                        type="text"
                                        value={formData.apellido}
                                        onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">DNI *</label>
                                    <input
                                        type="text"
                                        value={formData.dni}
                                        onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] text-sm"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-5 mt-2">
                                <h4 className="text-sm font-semibold text-slate-700 mb-4">Cambiar Contraseña <span className="font-normal text-slate-400">(Opcional)</span></h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            autoComplete="new-password"
                                            placeholder="••••••••"
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
                                        <input
                                            type="password"
                                            value={formData.password_confirmation}
                                            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#003865] hover:bg-[#00AEEF] text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            Guardar Cambios
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
