import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Wallet, 
  Star, 
  Calendar, 
  Download,
  Plus,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KPICard from './KPICard';
import PerformanceChart from './PerformanceChart';
import MilestoneList from './MilestoneList';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [coberturas, setCoberturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoberturas();
  }, []);

  const fetchCoberturas = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/admin/coberturas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCoberturas(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching dashboard coberturas:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 px-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#003865] tracking-tight">Resumen Ejecutivo</h2>
          <p className="text-slate-500 mt-1">Monitoreo de desempeño y KPIs para Gerencia General.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <Calendar size={16} />
            Últimos 30 Días
          </button>
          <button 
            onClick={() => navigate('/coberturas')}
            className="px-4 py-2 bg-[#00AEEF] text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[#00AEEF]/80 transition-all active:scale-95 shadow-lg shadow-[#00AEEF]/20"
          >
            <ShieldCheck size={16} />
            Ver Coberturas
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard 
          icon={ShieldCheck}
          label="Coberturas Aceptadas"
          value={loading ? '...' : coberturas.length.toString()}
          trend={loading ? '' : `+${coberturas.length}`}
          trendType="positive"
          description="Total de conformidades online"
          delay={0.1}
        />
        <KPICard 
          icon={Users}
          label="Total Headcount"
          value="1,284"
          trend="+12%"
          trendType="positive"
          description="Personal activo en el grupo"
          delay={0.2}
        />
        <KPICard 
          icon={TrendingUp}
          label="Eficiencia Operativa"
          value="94.8%"
          trend="+4.2%"
          trendType="positive"
          description="Promedio en flujos departamentales"
          delay={0.3}
        />
        <KPICard 
          icon={Wallet}
          label="Presupuesto Ejecutado"
          value="$4.2M"
          trend="-2.1%"
          trendType="negative"
          description="Gasto del trimestre fiscal actual"
          delay={0.4}
        />
      </div>

      {/* Charts & Highlights */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <PerformanceChart />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <MilestoneList />
        </div>
      </div>

      {/* Actividad de Coberturas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#003865]">Últimas Coberturas Confirmadas</h3>
          <button 
            onClick={() => navigate('/coberturas')}
            className="text-sm font-bold text-[#003865] hover:text-[#00AEEF] transition-colors"
          >
            Ver Todas
          </button>
        </div>
        
        <div className="divide-y divide-slate-100 font-inter">
          {loading ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              Cargando actividad...
            </div>
          ) : coberturas.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              No hay registros de coberturas aceptadas aún.
            </div>
          ) : (
            coberturas.slice(0, 5).map((cobertura) => (
              <div key={cobertura.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#00AEEF]/10 text-[#00AEEF] rounded-lg flex items-center justify-center font-bold">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#003865] leading-none mb-1.5">
                      {cobertura.nombre || cobertura.name || 'Asegurado'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Póliza: <span className="font-semibold text-slate-700">{cobertura.numero_poliza || 'N/A'}</span> | DNI: {cobertura.dni || 'N/A'} | Email: {cobertura.email}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-4">
                  {new Date(cobertura.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FAB */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-[#00AEEF] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 hover:bg-[#00AEEF]/80 transition-all group z-50">
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}
