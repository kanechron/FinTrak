import ProgressBar from "../common/ProgressBar";
import { formatAmount } from "../../utils/format";

interface Props {
  label: string;
  value: number;
  max: number;
  subtext: string;
}

export default function ProgressWidget({ label, value, max, subtext }: Props) {
  // Cap at 100 so the label never shows > 100% when spending exceeds the budget
  const pct = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className="border border-gray-800 rounded-xl p-5 space-y-3 flex-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-xs text-gray-500">{pct}%</p>
      </div>
      <p className="text-2xl font-semibold">{formatAmount(value)}</p>
      <ProgressBar value={value} max={max} />
      <p className="text-xs text-gray-500">{subtext}</p>
    </div>
  );
}
