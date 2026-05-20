import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import UserFormModal, { UserFormData } from './UserFormModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Error fetching users');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (user: any) => {
    const { value: role } = await Swal.fire({
      title: 'Cambiar Rol Local',
      input: 'select',
      inputOptions: {
        '': 'Sin Rol (Desactivado)',
        'Admin': 'Administrador',
        'Legales': 'Legales'
      },
      inputValue: user.local_role || '',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#003865',
    });

    if (role !== undefined) {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_URL}/admin/users/${encodeURIComponent(user.email)}/role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ role: role === '' ? null : role, name: user.name })
        });

        if (response.ok) {
          Swal.fire({ icon: 'success', title: 'Rol actualizado', timer: 1500, showConfirmButton: false });
          fetchUsers();
        } else {
          Swal.fire('Error', 'No se pudo actualizar el rol', 'error');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleCreateUser = async (formData: UserFormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        Swal.fire({ icon: 'success', title: 'Usuario creado', timer: 1500, showConfirmButton: false });
        setIsModalOpen(false);
        fetchUsers();
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  if (loading) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-[#00AEEF] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-slate-500 font-medium">Cargando usuarios, por favor espera...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 px-8 pb-12 animate-in fade-in duration-700">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#003865]">Administración de Usuarios</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona los permisos de acceso local a la aplicación.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative">
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
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#00AEEF] hover:bg-[#003865] text-white rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
          >
            <Plus size={18} />
            Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">DNI</th>
                <th className="px-6 py-4">Estado (Local)</th>
                <th className="px-6 py-4">Rol (Local)</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.map((user) => (
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
                  <td className="px-6 py-4 text-[13px] text-slate-600">
                    {user.dni || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                      user.status === 'activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {user.status === 'activo' ? 'Activo' : 'Desactivado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[13px] font-medium text-[#003865]">
                    {user.local_role || 'Sin Rol'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleChangeRole(user)}
                      className="text-xs font-medium text-[#00AEEF] hover:text-[#003865] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors"
                    >
                      Cambiar Rol
                    </button>
                  </td>
                </tr>
              ))}
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

        {/* Pagination Controls */}
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
            <span className="text-xs font-medium text-slate-600">
              Página {currentPage} de {totalPages}
            </span>
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
      />
    </div>
  );
}
