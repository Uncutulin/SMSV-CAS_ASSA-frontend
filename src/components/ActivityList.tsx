import { User, FileText } from 'lucide-react';

const activities = [
  { 
    user: "Ricardo Montiel", 
    action: "Actualizó el presupuesto de Gerencia Comercial", 
    time: "Hace 2 horas",
    type: 'user'
  },
  { 
    user: "Elena Vasquez", 
    action: "Aprobó nueva contratación para Operaciones", 
    time: "Hace 5 horas",
    type: 'user'
  },
  { 
    user: "Reporte Q1 Consolidado", 
    action: "Generado automáticamente por el sistema", 
    time: "Ayer, 18:45",
    type: 'report'
  }
];

export default function ActivityList() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-[#003865]">Actividad de Directorio</h3>
        <button className="text-sm font-bold text-[#003865] hover:text-[#00AEEF] transition-colors">View All</button>
      </div>
      
      <div className="divide-y divide-slate-100 font-inter">
        {activities.map((activity, i) => (
          <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              {activity.type === 'user' ? (
                <div className="w-10 h-10 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-500">
                  <User size={20} />
                </div>
              ) : (
                <div className="w-10 h-10 bg-[#00AEEF]/10 text-[#00AEEF] rounded-lg flex items-center justify-center">
                  <FileText size={20} />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-[#003865] leading-none mb-1">{activity.user}</p>
                <p className="text-xs text-slate-500">{activity.action}</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-4">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
