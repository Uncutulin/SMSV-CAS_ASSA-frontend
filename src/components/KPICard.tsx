import { LucideIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend: string;
  trendType: 'positive' | 'negative' | 'neutral';
  description: string;
  delay?: number;
}

export default function KPICard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  trendType, 
  description,
  delay = 0 
}: KPICardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
          <Icon size={20} className="text-slate-600" />
        </div>
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded-full",
          trendType === 'positive' && "text-green-600 bg-green-50",
          trendType === 'negative' && "text-red-600 bg-red-50",
          trendType === 'neutral' && "text-blue-600 bg-blue-50"
        )}>
          {trend}
        </span>
      </div>
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
      <h3 className="text-3xl font-bold mt-1 text-[#003865]">{value}</h3>
      <p className="text-[11px] text-slate-400 mt-2">{description}</p>
    </motion.div>
  );
}
