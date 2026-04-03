interface OccupationBreakdownCardProps {
  title: string;
  items: Array<{
    key: string;
    label: string;
    value: number;
    valueText: string;
  }>;
}

export function OccupationBreakdownCard({ title, items }: OccupationBreakdownCardProps) {
  return (
    <div data-h5-numbered-box className="h5-numbered space-y-3 rounded-[28px] border border-white/8 bg-black/10 px-4 py-4">
      <p className="h5-kicker">{title}</p>
      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item.key} data-h5-numbered-box className="h5-numbered rounded-[24px] border border-white/10 bg-black/15 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-white/68">{item.label}</span>
              <span className="text-sm font-medium text-white">{item.valueText}</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#9ae8d4] to-[#84c6ff]"
                style={{ width: `${Math.max(4, item.value * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
