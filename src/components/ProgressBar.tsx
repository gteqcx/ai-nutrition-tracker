export default function ProgressBar({
  label,
  consumed,
  target,
  unit,
  color,
}: {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  const over = consumed > target;
  const left = Math.max(0, target - consumed);

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={over ? "text-red-500" : "text-gray-500 dark:text-gray-400"}>
          {consumed} / {target} {unit}
          {!over && left > 0 && (
            <span className="ml-1 text-gray-400">· ост. {left}</span>
          )}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-red-500" : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
