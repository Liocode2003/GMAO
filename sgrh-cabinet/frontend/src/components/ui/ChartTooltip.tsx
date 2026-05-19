interface TooltipPayload { name: string; value: number | string; color?: string; }

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  unit?: string;
  formatter?: (v: number | string) => string;
}

export default function ChartTooltip({ active, payload, label, unit = '', formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm min-w-[140px]">
      {label && <p className="text-gray-500 text-xs font-medium mb-2">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color || '#6366f1' }} />
            <span className="text-gray-600">{p.name}</span>
          </div>
          <span className="font-semibold text-gray-800">
            {formatter ? formatter(p.value) : p.value}{unit}
          </span>
        </div>
      ))}
    </div>
  );
}
