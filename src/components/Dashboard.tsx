import { 
  Users, 
  TrendingUp, 
  Wallet, 
  Star, 
  Calendar, 
  Download,
  Plus
} from 'lucide-react';
import KPICard from './KPICard';
import PerformanceChart from './PerformanceChart';
import MilestoneList from './MilestoneList';
import ActivityList from './ActivityList';
import { motion } from 'motion/react';

export default function Dashboard() {
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
            Last 30 Days
          </button>
          <button className="px-4 py-2 bg-[#00AEEF] text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[#00AEEF]/80 transition-all active:scale-95 shadow-lg shadow-[#00AEEF]/20">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard 
          icon={Users}
          label="Total Headcount"
          value="1,284"
          trend="+12%"
          trendType="positive"
          description="Active personnel across all regions"
          delay={0.1}
        />
        <KPICard 
          icon={TrendingUp}
          label="Eficiencia Operativa"
          value="94.8%"
          trend="+4.2%"
          trendType="positive"
          description="Average across departmental flows"
          delay={0.2}
        />
        <KPICard 
          icon={Wallet}
          label="Presupuesto Ejecutado"
          value="$4.2M"
          trend="-2.1%"
          trendType="negative"
          description="Current fiscal quarter spending"
          delay={0.3}
        />
        <KPICard 
          icon={Star}
          label="NPS Interno"
          value="82"
          trend="Optimal"
          trendType="neutral"
          description="Employee satisfaction index"
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

      {/* Activity */}
      <ActivityList />

      {/* FAB */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-[#00AEEF] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 hover:bg-[#00AEEF]/80 transition-all group z-50">
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}
