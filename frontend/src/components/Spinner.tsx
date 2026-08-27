import { Loader2 } from "lucide-react";

interface SpinnerProps {
  label?: string;
  className?: string;
}

export function Spinner({ label = "Loading...", className = "" }: SpinnerProps) {
  return (
    <div className={`flex items-center gap-2 text-sm text-ink-500 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
