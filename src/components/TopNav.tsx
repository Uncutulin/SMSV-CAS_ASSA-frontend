import { Search, Bell, HelpCircle, User } from 'lucide-react';

export default function TopNav() {
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

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right">
            <p className="text-xs font-bold text-[#003865] group-hover:text-[#00AEEF]">Admin User</p>
            <p className="text-[10px] text-slate-500">HR Director</p>
          </div>
          <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-200 transition-colors">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}
