import { ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const milestones = [
  { title: "Expansión Regional", date: "12 May", color: "bg-green-400" },
  { title: "Revisión de Procesos", date: "15 May", color: "bg-amber-400" },
  { title: "Audit Anual CAS", date: "22 May", color: "bg-blue-400" },
];

export default function MilestoneList() {
  return (
    <div className="bg-[#003865] p-8 rounded-xl text-white shadow-xl flex flex-col h-full relative overflow-hidden">
      <div className="relative z-10">
        <h3 className="text-xl font-bold mb-2">Próximos Hitos</h3>
        <p className="text-blue-100/70 text-sm mb-6">Proyectos clave para el cierre del Q2.</p>
        
        <div className="space-y-4">
          {milestones.map((item, i) => (
            <div 
              key={i}
              className="flex items-center gap-4 bg-white/5 hover:bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/5 transition-colors cursor-pointer group"
            >
              <div className={cn("w-1.5 h-10 rounded-full shrink-0", item.color)} />
              <div className="flex-grow">
                <p className="text-xs font-bold">{item.title}</p>
                <p className="text-[10px] text-blue-100/70">Due Date: {item.date}</p>
              </div>
              <ChevronRight size={16} className="text-blue-100/50 group-hover:text-white transition-colors" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Decorative Blob */}
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
