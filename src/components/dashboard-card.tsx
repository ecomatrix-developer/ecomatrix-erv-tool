import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DashboardCardHighlight = "active" | "dim";

/**
 * A solid-blue-header card matching the reference dashboard: compact uppercase header
 * banner in brand blue, white body, thin gray border. Accepts an optional `area` for
 * CSS grid-area placement when used inside a grid-template-areas layout.
 *
 * `highlight` drives the row-edit-mode visual: "active" pops the card toward the
 * viewer in 3D (scale + lift + shadow) to mark it as containing a field the results
 * table can also edit; "dim" recedes and greys out cards the table doesn't touch at
 * all.
 */
export function DashboardCard({
  title,
  children,
  className,
  area,
  highlight,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  area?: string;
  highlight?: DashboardCardHighlight;
}) {
  return (
    <div
      style={{
        gridArea: area,
        perspective: highlight === "active" ? "700px" : undefined,
      }}
      className={cn(
        "flex h-full flex-col rounded-md border bg-white shadow-sm transition-all duration-300 ease-out",
        highlight === undefined && "border-slate-300",
        highlight === "active" &&
          "z-10 border-[#5b73e8] ring-2 ring-[#5b73e8]/40 shadow-xl shadow-[#5b73e8]/20 -translate-y-1 [transform:translateZ(8px)]",
        highlight === "dim" && "border-slate-200 opacity-40 saturate-50 scale-[0.99]",
        className,
      )}
    >
      <div className="bg-[#5b73e8] px-2.5 py-1 rounded-t-[5px]">
        <h3 className="text-[11px] font-bold tracking-wide text-white uppercase">{title}</h3>
      </div>
      <div className="flex-1 space-y-1.5 p-2 text-xs">{children}</div>
    </div>
  );
}
