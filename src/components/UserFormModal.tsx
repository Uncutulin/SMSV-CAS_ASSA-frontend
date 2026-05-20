import React, { useEffect, useState } from 'react';
import Modal from './ui/Modal';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface UserFormData {
    name: string;
    apellido: string;
    dni: string;
    email: string;
    roles: string[]; // BI Roles
    local_role: string; // Local Role (Admin, Legales, etc)
}

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: UserFormData) => void;
}

export default function UserFormModal({ isOpen, onClose, onSubmit }: UserFormModalProps) {
    const [roles, setRoles] = useState<any[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [formData, setFormData] = useState<UserFormData>({
        name: '',
        apellido: '',
        dni: '',
        email: '',
        roles: [],
        local_role: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: '',
                apellido: '',
                dni: '',
                email: '',
                roles: [],
                local_role: ''
            });
            loadRoles();
        }
    }, [isOpen]);

    const loadRoles = async () => {
        if (roles.length > 0) return;
        setLoadingRoles(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/admin/roles`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setRoles(data);
            }
        } catch (e) {
            console.error('Error loading BI roles', e);
        } finally {
            setLoadingRoles(false);
        }
    };

    const handleRoleChange = (roleName: string) => {
        setFormData(prev => {
            const currentRoles = prev.roles;
            let newRoles: string[];

            if (roleName === 'admin') {
                if (currentRoles.includes('admin')) {
                    newRoles = [];
                } else {
                    newRoles = ['admin'];
                }
            } else {
                if (currentRoles.includes(roleName)) {
                    newRoles = currentRoles.filter(r => r !== roleName);
                } else {
                    newRoles = [...currentRoles.filter(r => r !== 'admin'), roleName];
                }
            }
            return { ...prev, roles: newRoles };
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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Agregar Nuevo Usuario"
        >
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

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Roles BI *</label>
                    {loadingRoles ? (
                        <p className="text-sm text-gray-500">Cargando roles...</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-md border border-gray-200 max-h-40 overflow-y-auto">
                            {roles.length > 0 ? (
                                roles.map((role) => (
                                    <label key={role.id} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-gray-100 rounded">
                                        <input
                                            type="checkbox"
                                            checked={formData.roles.includes(role.name)}
                                            onChange={() => handleRoleChange(role.name)}
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

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol Local (CAS-ASSA)</label>
                    <select
                        value={formData.local_role}
                        onChange={(e) => setFormData({ ...formData, local_role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00AEEF] bg-white"
                    >
                        <option value="">Sin Rol (Desactivado)</option>
                        <option value="Admin">Administrador</option>
                        <option value="Legales">Legales</option>
                    </select>
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
