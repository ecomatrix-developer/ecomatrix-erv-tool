"use client";

import { Check, Flame, Fan, Sun, Snowflake, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

export type FlowNodeId = "preheat" | "erv" | "heating" | "cooling" | "humidification";

export const FLOW_NODES: { id: FlowNodeId; label: string; icon: typeof Flame }[] = [
  { id: "preheat", label: "Preheat", icon: Flame },
  { id: "erv", label: "ERV", icon: Fan },
  { id: "heating", label: "Post Heating", icon: Sun },
  { id: "cooling", label: "Post Cooling", icon: Snowflake },
  { id: "humidification", label: "Humidification", icon: Droplets },
];

interface FlowCanvasProps {
  activeNode: FlowNodeId;
  completedNodes: Set<FlowNodeId>;
  onSelectNode: (id: FlowNodeId) => void;
}

const BLUE = "#1E4FD8";

function NodeBox({
  id,
  label,
  icon: Icon,
  x,
  active,
  done,
  onSelect,
}: {
  id: FlowNodeId;
  label: string;
  icon: typeof Flame;
  x: number;
  active: boolean;
  done: boolean;
  onSelect: (id: FlowNodeId) => void;
}) {
  return (
    <foreignObject x={x} y={70} width={132} height={72}>
      <button
        type="button"
        onClick={() => onSelect(id)}
        className={cn(
          "group flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl border-2 transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          active && "scale-105 border-transparent text-white shadow-lg",
          !active && done && "border-[#1E4FD8]/40 bg-[#1E4FD8]/5 text-[#1E4FD8] hover:border-[#1E4FD8]/70 hover:bg-[#1E4FD8]/10",
          !active && !done && "border-dashed border-slate-300 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-600",
        )}
        style={active ? { backgroundColor: BLUE, boxShadow: "0 8px 24px -8px rgba(30,79,216,0.5)" } : undefined}
      >
        <div className="relative">
          <Icon className="size-5" />
          {done && !active && (
            <span className="absolute -top-1.5 -right-2 flex size-3.5 items-center justify-center rounded-full bg-[#1E4FD8] text-white">
              <Check className="size-2.5" strokeWidth={3} />
            </span>
          )}
        </div>
        <span className="text-[0.7rem] font-medium">{label}</span>
      </button>
    </foreignObject>
  );
}

/**
 * Static engineering-style flow diagram: Preheat -> ERV -> Post Heating -> Post
 * Cooling -> Humidification -> Supply, with an Exhaust return loop, mirroring the
 * real airflow path. Each node is a clickable button that drives which stage's
 * input card shows in the inspector panel; filled blue means its inputs are
 * complete, dashed gray means still pending, and the current selection scales up
 * and fills solid blue.
 */
export function FlowCanvas({ activeNode, completedNodes, onSelectNode }: FlowCanvasProps) {
  const positions: Record<FlowNodeId, number> = {
    preheat: 20,
    erv: 168,
    heating: 316,
    cooling: 464,
    humidification: 612,
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <svg viewBox="0 0 800 220" className="w-full" role="img" aria-label="ERV airflow diagram">
        {/* Supply path arrows */}
        <line x1="0" y1="106" x2="20" y2="106" stroke="#94A3B8" strokeWidth="2" markerEnd="url(#arrow)" />
        <line x1="152" y1="106" x2="168" y2="106" stroke="#94A3B8" strokeWidth="2" markerEnd="url(#arrow)" />
        <line x1="300" y1="106" x2="316" y2="106" stroke="#94A3B8" strokeWidth="2" markerEnd="url(#arrow)" />
        <line x1="448" y1="106" x2="464" y2="106" stroke="#94A3B8" strokeWidth="2" markerEnd="url(#arrow)" />
        <line x1="596" y1="106" x2="612" y2="106" stroke="#94A3B8" strokeWidth="2" markerEnd="url(#arrow)" />
        <line x1="744" y1="106" x2="780" y2="106" stroke="#94A3B8" strokeWidth="2" markerEnd="url(#arrow)" />

        {/* Exhaust return loop, beneath the supply row */}
        <path
          d="M 780 106 L 780 176 L 20 176 L 20 142"
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="2"
          strokeDasharray="5 4"
          markerEnd="url(#arrow-gray)"
        />

        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#94A3B8" />
          </marker>
          <marker id="arrow-gray" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#CBD5E1" />
          </marker>
        </defs>

        <text x="0" y="18" className="fill-slate-400 text-[11px] font-medium">
          SUPPLY AIR
        </text>
        <text x="0" y="196" className="fill-slate-300 text-[11px] font-medium">
          EXHAUST AIR
        </text>

        {FLOW_NODES.map((node) => (
          <NodeBox
            key={node.id}
            id={node.id}
            label={node.label}
            icon={node.icon}
            x={positions[node.id]}
            active={activeNode === node.id}
            done={completedNodes.has(node.id)}
            onSelect={onSelectNode}
          />
        ))}
      </svg>
    </div>
  );
}
