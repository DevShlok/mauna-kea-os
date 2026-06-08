interface FunnelStage {
  label: string;
  count: number;
  color: string;
}

interface FunnelChartProps {
  data: FunnelStage[];
  total: number;
}

export function FunnelChart({ data, total }: FunnelChartProps) {
  return (
    <div className="flex flex-col gap-3">
      {data.map((stage, idx) => {
        const pct = Math.round((stage.count / total) * 100);
        return (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-24 text-right text-xs font-bold text-gray-400 uppercase tracking-wide shrink-0">
              {stage.label}
            </div>
            <div className="flex-1 h-8 bg-gray-100 rounded-r-md overflow-hidden">
              <div
                className="h-full rounded-r-md flex items-center px-3 transition-all duration-700"
                style={{ width: pct + '%', backgroundColor: stage.color }}
              >
                <span className="text-white font-bold text-sm">{stage.count}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
