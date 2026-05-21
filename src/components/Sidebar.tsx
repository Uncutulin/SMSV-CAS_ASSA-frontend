import React from 'react';
import {
  BarChart3,
  Users,
  ShieldCheck,
  LayoutDashboard,
  Building2,
  ChevronDown,
  Settings,
  LogOut,
  Plus,
  BarChart,
  Settings2,
  Wallet,
  Calculator,
  Landmark
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';

const SidebarItem = ({
  icon: Icon,
  label,
  active = false,
  expandable = false,
  onClick,
  children
}: {
  icon: any,
  label: string,
  active?: boolean,
  expandable?: boolean,
  onClick?: () => void,
  children?: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="w-full">
      <button
        onClick={() => {
          if (expandable) setIsOpen(!isOpen);
          if (onClick) onClick();
        }}
        className={cn(
          "w-full flex items-center justify-between px-6 py-3 transition-colors",
          active ? "bg-[#002244] text-white border-l-4 border-[#00AEEF]" : "text-blue-100/70 hover:text-white hover:bg-[#002244]/50"
        )}
      >
        <div className="flex items-center gap-4">
          <Icon size={20} />
          <span className="text-[13px] font-medium tracking-wide">{label}</span>
        </div>
        {expandable && (
          <ChevronDown
            size={16}
            className={cn("transition-transform", isOpen ? "rotate-0" : "-rotate-90")}
          />
        )}
      </button>
      {expandable && isOpen && (
        <div className="pl-14 space-y-1 py-1">
          {children}
        </div>
      )}
    </div>
  );
};

export default function Sidebar({ onLogout, user }: { onLogout?: () => void, user?: any }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  return (
    <aside className="fixed left-0 top-0 h-screen w-72 z-40 bg-[#003865] border-r border-[#002244] shadow-2xl flex flex-col py-8">
      {/* Brand */}
      <div className="px-6 mb-10 flex items-center gap-3">
        <svg width="40" height="40" viewBox="0 0 100 100" className="flex-shrink-0">
          <path d="M 10 30 L 90 10 L 90 25 L 10 45 Z" fill="#00AEEF" opacity="0.4" />
          <path d="M 10 50 L 90 30 L 90 45 L 10 65 Z" fill="#00AEEF" opacity="0.7" />
          <path d="M 10 70 L 90 50 L 90 65 L 10 85 Z" fill="#00AEEF" />
        </svg>
        <div className="flex flex-col justify-center mt-1">
          <span className="text-xl font-black text-[#00AEEF] leading-none tracking-tight">CAS-ASSA</span>
          <span className="text-[9px] text-center text-[#00AEEF] uppercase tracking-[0.25em] font-bold mt-1">seguros</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-grow overflow-y-auto overflow-x-hidden pb-10 custom-scrollbar">
        <div className="px-6 mb-4">
          <span className="text-[10px] font-bold text-[#00AEEF]/80 uppercase tracking-widest">Módulos</span>
        </div>

        <SidebarItem 
          icon={LayoutDashboard} 
          label="Dashboard" 
          active={currentPath === '/dashboard'} 
          onClick={() => navigate('/dashboard')} 
        />

        {(user?.local_role === 'Admin' || user?.local_role === 'Legales') && (
          <SidebarItem 
            icon={ShieldCheck} 
            label="Coberturas Aceptadas" 
            active={currentPath === '/coberturas'} 
            onClick={() => navigate('/coberturas')} 
          />
        )}

        <div className="mt-8 px-6 mb-4">
          <span className="text-[10px] font-bold text-[#00AEEF]/80 uppercase tracking-widest">Sistema</span>
        </div>
        
        {user?.local_role === 'Admin' && (
          <SidebarItem 
            icon={Users} 
            label="Administración" 
            expandable
          >
            <div className="space-y-3 py-2">
              <div 
                onClick={() => navigate('/usuarios')} 
                className={cn(
                  "flex items-center gap-3 cursor-pointer transition-colors",
                  currentPath === '/usuarios' ? "text-white font-semibold" : "text-blue-100/70 hover:text-white"
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full", currentPath === '/usuarios' ? "bg-[#00AEEF]" : "bg-[#00AEEF]/60")} />
                <span className="text-[12px]">Usuarios</span>
              </div>
            </div>
          </SidebarItem>
        )}
      </nav>

      {/* Footer */}
      <div className="px-6 pt-4 border-t border-[#002244]">
        {/*
        <button className="w-full py-3 bg-[#00AEEF] text-white rounded-md font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 hover:bg-[#00AEEF]/80">
          <Plus size={14} />
          Nuevo Departamento
        </button>
        */}
        <button onClick={onLogout} className="w-full text-blue-100/70 hover:text-white flex items-center py-3 mt-4 transition-all gap-4">
          <LogOut size={20} />
          <span className="text-[13px]">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
