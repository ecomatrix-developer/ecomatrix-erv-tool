"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ParameterBoxTone =
  | "slate"
  | "amber"
  | "violet"
  | "cyan"
  | "sky"
  | "rose"
  | "blue"
  | "teal"
  | "emerald"
  | "lime"
  | "indigo";

const TONE_HEADER: Record<ParameterBoxTone, string> = {
  slate: "from-slate-600 to-slate-500",
  amber: "from-amber-500 to-orange-500",
  violet: "from-violet-600 to-purple-500",
  cyan: "from-cyan-600 to-sky-500",
  sky: "from-sky-600 to-blue-500",
  rose: "from-rose-600 to-red-500",
  blue: "from-blue-600 to-indigo-500",
  teal: "from-teal-600 to-emerald-500",
  emerald: "from-emerald-600 to-green-500",
  lime: "from-lime-600 to-green-500",
  indigo: "from-indigo-600 to-violet-500",
};

const TONE_RING: Record<ParameterBoxTone, string> = {
  slate: "hover:shadow-slate-500/15",
  amber: "hover:shadow-amber-500/20",
  violet: "hover:shadow-violet-500/20",
  cyan: "hover:shadow-cyan-500/20",
  sky: "hover:shadow-sky-500/20",
  rose: "hover:shadow-rose-500/20",
  blue: "hover:shadow-blue-500/20",
  teal: "hover:shadow-teal-500/20",
  emerald: "hover:shadow-emerald-500/20",
  lime: "hover:shadow-lime-500/20",
  indigo: "hover:shadow-indigo-500/20",
};

export type ParameterBoxHighlight = "active" | "dim";

interface ParameterBoxProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  area: string;
  className?: string;
  children: ReactNode;
  delay?: number;
  tone?: ParameterBoxTone;
  /** Set while a table row is being edited: "active" pops the box toward the
   *  viewer in 3D to mark it as one of the editable columns, "dim" recedes and
   *  greys out every box that row-editing doesn't touch. */
  highlight?: ParameterBoxHighlight;
}

/**
 * A compact "parameter box" styled after the original app's diagram-anchored boxes:
 * small footprint, colored header strip, placed via a named CSS grid-area so the
 * surrounding <DiagramLayout> can position it relative to the ERV flow diagram.
 */
export function ParameterBox({
  icon: Icon,
  title,
  area,
  className,
  children,
  delay = 0,
  tone = "slate",
  highlight,
}: ParameterBoxProps) {
  return (
    <div
      style={{
        gridArea: area,
        animationDelay: `${delay}ms`,
        perspective: highlight === "active" ? "800px" : undefined,
      }}
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both",
        "flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm",
        "transition-all duration-300 ease-out",
        highlight === undefined && cn("border-border/60 hover:-translate-y-0.5 hover:shadow-lg", TONE_RING[tone]),
        highlight === "active" &&
          "z-10 scale-[1.04] border-primary/50 shadow-2xl shadow-primary/20 [transform:translateZ(0)]",
        highlight === "dim" && "scale-[0.99] border-border/40 opacity-40 saturate-50",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 bg-gradient-to-r px-3 py-2 text-white",
          TONE_HEADER[tone],
        )}
      >
        <Icon className="size-3.5 shrink-0" />
        <h3 className="truncate text-xs font-semibold tracking-wide">{title}</h3>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-3">{children}</div>
    </div>
  );
}

export function MiniField({
  label,
  children,
  dim,
}: {
  label: string;
  children: ReactNode;
  /** Greys out just this field when its box is "active" but this particular
   *  field isn't one of the columns the table lets you edit. */
  dim?: boolean;
}) {
  return (
    <label className={cn("block space-y-0.5 transition-opacity duration-300", dim && "opacity-35")}>
      <span className="block text-[0.7rem] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
