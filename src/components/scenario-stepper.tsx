import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScenarioStepperProps {
  labels: string[];
  currentIndex: number;
}

const BLUE = "#1E4FD8";

export function ScenarioStepper({ labels, currentIndex }: ScenarioStepperProps) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {labels.map((label, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <li key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors",
                isDone && "border-[#1E4FD8]/30 bg-[#1E4FD8]/5 text-[#1E4FD8]",
                isCurrent && "border-transparent text-white",
                !isDone && !isCurrent && "border-slate-200 text-slate-400",
              )}
              style={isCurrent ? { backgroundColor: BLUE } : undefined}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-xs font-medium",
                  isDone && "bg-[#1E4FD8]/15 text-[#1E4FD8]",
                  isCurrent && "bg-white/20",
                  !isDone && !isCurrent && "bg-slate-100 text-slate-400",
                )}
              >
                {isDone ? <Check className="size-3" /> : i + 1}
              </span>
              {label}
            </div>
            {i < labels.length - 1 && <div className="h-px w-4 bg-slate-200" />}
          </li>
        );
      })}
    </ol>
  );
}
