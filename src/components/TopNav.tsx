import React, { useState } from 'react';
import { Search, Bell, HelpCircle, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TopNav({ user, onLogout }: { user?: any, onLogout?: () => void }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const userName = user ? `${user.name} ${user.apellido || ''}`.trim() : 'Admin User';
  const userRole = user?.local_role === 'Legales' ? 'Legales' : (user?.local_role === 'Admin' ? 'Administrador' : 'Usuario');
  const avatarUrl = user?.avatar_url;
  const userEmail = user?.email || '';

  return (
    <header className="fixed top-0 right-0 z-30 w-[calc(100%-288px)] h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <span className="text-slate-400 select-none">/</span>
        <span className="text-sm font-medium text-[#003865]">Gerencia General</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search resources..."
            className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-xs w-64 focus:ring-2 focus:ring-[#00AEEF] transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-4 text-slate-500">
          <button className="hover:text-[#003865] transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="hover:text-[#003865] transition-colors">
            <HelpCircle size={20} />
          </button>
        </div>

        <div className="h-8 w-px bg-slate-200 mx-2" />

        <div className="relative">
          <div 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="text-right">
              <p className="text-xs font-bold text-[#003865] group-hover:text-[#00AEEF] capitalize">{userName.toLowerCase()}</p>
              <p className="text-[10px] text-slate-500 uppercase">{userRole}</p>
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-200 transition-colors overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <User size={18} />
              )}
            </div>
          </div>
          
          {userMenuOpen && (
            <>
              {/* Overlay invisible para cerrar el menú al hacer clic fuera */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setUserMenuOpen(false)}
              ></div>
              
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-100 bg-slate-50/50 rounded-t-lg">
                  <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{userEmail}</p>
                </div>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-50 flex items-center transition-colors"
                >
                  <User size={16} className="mr-3 text-gray-400" />
                  Mi Perfil
                </button>

                <div className="border-t border-gray-100">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center transition-colors"
                  >
                    <LogOut size={16} className="mr-3 text-red-500" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
