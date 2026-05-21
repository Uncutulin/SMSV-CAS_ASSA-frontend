import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { Search, Plus, ChevronLeft, ChevronRight, ShieldCheck, X, Download } from 'lucide-react';
import UserFormModal, { UserFormData } from './UserFormModal';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface RoleModalProps {
  user: any;
  localRoles: string[];
  onClose: () => void;
  onSave: (email: string, roles: string[], status: string) => Promise<void> | void;
}

function RoleAssignModal({ user, localRoles, onClose, onSave }: RoleModalProps) {
  const [selected, setSelected] = useState<string[]>(
    Array.isArray(user.local_roles)
      ? user.local_roles
      : (user.local_role ? user.local_role.split(',').map((r: string) => r.trim()).filter(Boolean) : [])
  );
  const [status, setStatus] = useState<string>(user.status || 'desactivado');
  const [saving, setSaving] = useState(false);

  const toggle = (role: string) => {
    setSelected(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(user.email, selected, status);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={saving ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-[#003865]">Asignar Roles Locales</h3>
            <p className="text-sm text-slate-500 mt-0.5">{user.name} {user.apellido} &mdash; {user.email}</p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={18} />
          </button>
        </div>

        {/* Account Status Switcher */}
        <div className="mb-5">
          <p className="text-sm font-medium text-slate-700 mb-2">Estado de la cuenta:</p>
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => !saving && setStatus('activo')}
              disabled={saving}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                status === 'activo'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/50'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              Activo
            </button>
            <button
              type="button"
              onClick={() => !saving && setStatus('desactivado')}
              disabled={saving}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                status === 'desactivado'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/50'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              Desactivado
            </button>
          </div>
        </div>

        <div className="mb-1">
          <p className="text-sm font-medium text-slate-700 mb-3">Seleccioná uno o más roles para este usuario:</p>
          <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            {localRoles.map(role => (
              <label
                key={role}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-all select-none ${
                  selected.includes(role)
                    ? 'border-[#00AEEF] bg-[#00AEEF]/5 text-[#003865]'
                    : 'border-transparent bg-white hover:border-slate-200 text-slate-600'
                } ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(role)}
                  onChange={() => !saving && toggle(role)}
                  disabled={saving}
                  className="form-checkbox h-4 w-4 rounded text-[#00AEEF] border-gray-300 focus:ring-[#00AEEF] disabled:cursor-not-allowed"
                />
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className={selected.includes(role) ? 'text-[#00AEEF]' : 'text-slate-400'} />
                  <span className="text-sm font-semibold">{role}</span>
                </div>
              </label>
            ))}
            {localRoles.length === 0 && (
              <p className="text-sm text-slate-400 py-2 text-center">No hay roles disponibles.</p>
            )}
          </div>
        </div>

        {selected.length === 0 && status === 'activo' && (
          <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 animate-in fade-in duration-200">
            Nota: El usuario quedará activo sin roles asignados (permisos básicos).
          </p>
        )}

        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-[#00AEEF] text-white rounded-lg hover:bg-[#003865] transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed min-w-[140px]"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState<any | null>(null);
  const [localRoles, setLocalRoles] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchLocalRoles();
  }, []);

  const fetchUsers = async (showTableLoading = false) => {
    if (showTableLoading) {
      setTableLoading(true);
    }
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const fetchLocalRoles = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/admin/local-roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLocalRoles(data.map((r: any) => r.name));
      }
    } catch (e) {
      console.error('Error loading local roles:', e);
      setLocalRoles(['Admin', 'Legales', 'Coberturas Aceptadas']);
    }
  };

  const handleImportUsers = async () => {
    setImporting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/admin/users/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        Swal.fire({
          icon: 'success',
          title: 'Importación Completada',
          text: `Se importaron ${data.imported} nuevos usuarios y se actualizaron ${data.updated} usuarios existentes. Todos los nuevos usuarios se importaron desactivados por defecto.`,
          confirmButtonColor: '#00AEEF'
        });
        await fetchUsers(true);
      } else {
        const errorData = await response.json();
        Swal.fire('Error', errorData.message || 'No se pudieron importar los usuarios', 'error');
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Error de conexión con el servidor', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleSaveRoles = async (email: string, roles: string[], status: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/admin/users/${encodeURIComponent(email)}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roles, status })
      });

      if (response.ok) {
        Swal.fire({ icon: 'success', title: 'Cambios guardados', timer: 1500, showConfirmButton: false });
        setRoleModalUser(null);
        await fetchUsers(true);
      } else {
        Swal.fire('Error', 'No se pudieron guardar los cambios del usuario', 'error');
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Error de conexión', 'error');
    }
  };

  const handleCreateUser = async (formData: UserFormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        Swal.fire({ icon: 'success', title: 'Usuario creado', timer: 1500, showConfirmButton: false });
        setIsModalOpen(false);
        await fetchUsers(true);
      } else {
        const errorData = await response.json();
        Swal.fire('Error', errorData.message || 'No se pudo crear el usuario', 'error');
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Error de conexión', 'error');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchStr = searchTerm.toLowerCase();
      const fullName = `${user.name || ''} ${user.apellido || ''}`.toLowerCase();
      return (
        fullName.includes(searchStr) ||
        (user.dni && user.dni.toLowerCase().includes(searchStr)) ||
        (user.email && user.email.toLowerCase().includes(searchStr))
      );
    });
  }, [users, searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  if (loading) {
    return (
      <div className="pt-24 px-4 md:px-8 pb-12 min-h-screen flex flex-col items-center justify-center">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-[#00AEEF] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-slate-500 font-medium">Cargando usuarios, por favor espera...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 px-4 md:px-8 pb-12 animate-in fade-in duration-700">
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#003865]">Administración de Usuarios</h2>
          <p className="text-sm text-slate-500 mt-1">Gestiona los permisos de acceso local a la aplicación.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre, email o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] w-full sm:w-64 text-sm"
            />
          </div>
          <button
            onClick={handleImportUsers}
            disabled={importing || loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition-colors font-medium text-sm whitespace-nowrap disabled:cursor-not-allowed w-full sm:w-auto"
          >
            <Download size={18} className={importing ? 'animate-bounce' : ''} />
            {importing ? 'Importando...' : 'Importar Usuarios'}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#00AEEF] hover:bg-[#003865] text-white rounded-lg transition-colors font-medium text-sm whitespace-nowrap w-full sm:w-auto"
          >
            <Plus size={18} />
            Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative min-h-[200px]">
        {tableLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 transition-all duration-300">
            <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-lg border border-slate-100">
              <svg className="animate-spin h-8 w-8 text-[#00AEEF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-semibold text-[#003865]">Actualizando usuarios...</span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">DNI</th>
                <th className="px-6 py-4">Estado (Local)</th>
                <th className="px-6 py-4">Roles (Local)</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.map((user) => {
                const userRoles: string[] = Array.isArray(user.local_roles)
                  ? user.local_roles
                  : (user.local_role ? user.local_role.split(',').map((r: string) => r.trim()).filter(Boolean) : []);

                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {user.name?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-800 text-[13px]">{user.name} {user.apellido}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-slate-600">{user.dni || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        user.status === 'activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.status === 'activo' ? 'Activo' : 'Desactivado'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {userRoles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {userRoles.map(role => (
                            <span key={role} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#00AEEF]/10 text-[#003865] border border-[#00AEEF]/20">
                              <ShieldCheck size={10} className="text-[#00AEEF]" />
                              {role}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[13px] text-slate-400 italic">Sin Rol</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setRoleModalUser(user)}
                        className="text-xs font-medium text-[#00AEEF] hover:text-[#003865] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors"
                      >
                        Cambiar Roles
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                    No se encontraron usuarios coincidiendo con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="text-xs text-slate-500">
            Mostrando <span className="font-medium text-slate-700">{filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium text-slate-700">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> de <span className="font-medium text-slate-700">{filteredUsers.length}</span> usuarios
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium text-slate-600">Página {currentPage} de {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateUser}
        localRoles={localRoles}
      />

      {roleModalUser && (
        <RoleAssignModal
          user={roleModalUser}
          localRoles={localRoles}
          onClose={() => setRoleModalUser(null)}
          onSave={handleSaveRoles}
        />
      )}
    </div>
  );
}
