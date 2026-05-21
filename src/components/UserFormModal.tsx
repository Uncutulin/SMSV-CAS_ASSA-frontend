import React, { useEffect, useState } from 'react';
import Modal from './ui/Modal';
import Swal from 'sweetalert2';
import { ShieldCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface UserFormData {
    name: string;
    apellido: string;
    dni: string;
    email: string;
    roles: string[];        // BI Roles
    local_roles: string[];  // Local CAS-ASSA Roles (from DB)
}

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: UserFormData) => void;
    localRoles?: string[]; // Passed in from parent (already fetched from DB)
}

export default function UserFormModal({ isOpen, onClose, onSubmit, localRoles = [] }: UserFormModalProps) {
    const [biRoles, setBiRoles] = useState<any[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [formData, setFormData] = useState<UserFormData>({
        name: '',
        apellido: '',
        dni: '',
        email: '',
        roles: [],
        local_roles: []
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: '',
                apellido: '',
                dni: '',
                email: '',
                roles: [],
                local_roles: []
            });
            loadBiRoles();
        }
    }, [isOpen]);

    const loadBiRoles = async () => {
        if (biRoles.length > 0) return;
        setLoadingRoles(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/admin/roles`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setBiRoles(data);
            }
        } catch (e) {
            console.error('Error loading BI roles', e);
        } finally {
            setLoadingRoles(false);
        }
    };

    const handleBiRoleChange = (roleName: string) => {
        setFormData(prev => {
            const currentRoles = prev.roles;
            let newRoles: string[];
            if (roleName === 'admin') {
                newRoles = currentRoles.includes('admin') ? [] : ['admin'];
            } else {
                newRoles = currentRoles.includes(roleName)
                    ? currentRoles.filter(r => r !== roleName)
                    : [...currentRoles.filter(r => r !== 'admin'), roleName];
            }
            return { ...prev, roles: newRoles };
        });
    };

    const handleLocalRoleChange = (roleName: string) => {
        setFormData(prev => {
            const current = prev.local_roles;
            const updated = current.includes(roleName)
                ? current.filter(r => r !== roleName)
                : [...current, roleName];
            return { ...prev, local_roles: updated };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.apellido || !formData.dni || !formData.email) {
            Swal.fire('Error', 'Por favor complete todos los campos obligatorios', 'error');
            return;
        }

        if (formData.roles.length === 0) {
            Swal.fire('Error', 'Debe seleccionar al menos un rol de BI', 'error');
            return;
        }

        onSubmit(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Agregar Nuevo Usuario">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
                            placeholder="Nombre"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                        <input
                            type="text"
                            value={formData.apellido}
                            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
                            placeholder="Apellido"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">DNI *</label>
                        <input
                            type="text"
                            value={formData.dni}
                            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
                            placeholder="Documento Nacional"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
                            placeholder="email@ejemplo.com"
                        />
                    </div>
                </div>

                {/* BI Roles */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Roles BI *</label>
                    {loadingRoles ? (
                        <p className="text-sm text-gray-500">Cargando roles...</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-md border border-gray-200 max-h-40 overflow-y-auto">
                            {biRoles.length > 0 ? (
                                biRoles.map((role) => (
                                    <label key={role.id} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-gray-100 rounded">
                                        <input
                                            type="checkbox"
                                            checked={formData.roles.includes(role.name)}
                                            onChange={() => handleBiRoleChange(role.name)}
                                            className="form-checkbox h-4 w-4 text-[#00AEEF] rounded border-gray-300 focus:ring-[#00AEEF]"
                                        />
                                        <span className="text-sm text-gray-700">{role.name}</span>
                                    </label>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 col-span-2">No se encontraron roles disponibles.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Local Roles (from DB) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Roles Locales CAS-ASSA
                    </label>
                    <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        {localRoles.length > 0 ? localRoles.map(role => (
                            <label
                                key={role}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-all select-none ${
                                    formData.local_roles.includes(role)
                                        ? 'border-[#00AEEF] bg-[#00AEEF]/5 text-[#003865]'
                                        : 'border-transparent bg-white hover:border-slate-200 text-slate-600'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.local_roles.includes(role)}
                                    onChange={() => handleLocalRoleChange(role)}
                                    className="form-checkbox h-4 w-4 rounded text-[#00AEEF] border-gray-300 focus:ring-[#00AEEF]"
                                />
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={15} className={formData.local_roles.includes(role) ? 'text-[#00AEEF]' : 'text-slate-400'} />
                                    <span className="text-sm font-semibold">{role}</span>
                                </div>
                            </label>
                        )) : (
                            <p className="text-sm text-slate-400 py-1">
                                Sin roles locales disponibles (Sin Rol = desactivado).
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-[#00AEEF] text-white rounded-md hover:bg-[#003865] transition-colors font-medium"
                    >
                        Registrar Usuario
                    </button>
                </div>
            </form>
        </Modal>
    );
}
