import { 
  BarChart, 
  ResponsiveContainer, 
  Bar, 
  XAxis, 
  Tooltip, 
  Cell
} from 'recharts';

const data = [
  { name: 'JAN', actual: 65, target: 80 },
  { name: 'FEB', actual: 72, target: 80 },
  { name: 'MAR', actual: 88, target: 80 },
  { name: 'APR', actual: 75, target: 80 },
  { name: 'MAY', actual: 92, target: 80 },
  { name: 'JUN', actual: 82, target: 80 },
];

export default function PerformanceChart() {
  return (
    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col min-h-[400px]">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-xl font-semibold text-[#003865]">Gráfico de Rendimiento</h3>
          <p className="text-sm text-slate-500">Comparativa mensual de cumplimiento de objetivos</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#00AEEF]"></span>
            <span className="text-xs font-medium text-slate-600">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md border-2 border-dashed border-slate-300"></span>
            <span className="text-xs font-medium text-slate-600">Target</span>
          </div>
        </div>
      </div>

      <div className="flex-grow w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
              dy={15}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#003865] text-white p-3 rounded-lg shadow-xl border border-[#002244] text-xs">
                      <p className="font-bold mb-1">{data.name}</p>
                      <p className="text-slate-400">Actual: <span className="text-white">{data.actual}%</span></p>
                      <p className="text-slate-400">Target: <span className="text-white">{data.target}%</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Reference Line for Target represented as dashes above bars */}
            <Bar dataKey="actual" radius={[6, 6, 0, 0]} barSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#00AEEF" />
              ))}
            </Bar>
            {/* Using a second invisible Bar just to show the target line in tooltip or we can use custom shape */}
            <Bar dataKey="target" hide />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
