function Pill({ label, className }: { label: string; className: string }) {
  return (
    <div
      className={`flex h-11 items-center justify-center rounded-full px-5 text-xs font-semibold tracking-wide text-white shadow-sm ${className}`}
    >
      {label}
    </div>
  );
}

/**
 * Static reproduction of the original ERV airflow diagram (preheat -> ERV ->
 * post-heating -> post-cooling -> humidification -> supply, plus the exhaust
 * return loop) as HTML/CSS rather than the old raster PNG, so it scales cleanly
 * and sits centered beneath the input card grid like the reference dashboard.
 */
export function StaticFlowDiagram() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <svg viewBox="0 0 900 200" className="w-full" role="img" aria-label="ERV airflow diagram">
        <defs>
          <marker id="sfd-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#0F172A" />
          </marker>
          <marker id="sfd-arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#DC2626" />
          </marker>
        </defs>

        {/* supply path */}
        <line x1="20" y1="90" x2="60" y2="90" stroke="#0F172A" strokeWidth="2" markerEnd="url(#sfd-arrow)" />
        <line x1="200" y1="90" x2="240" y2="90" stroke="#0F172A" strokeWidth="2" markerEnd="url(#sfd-arrow)" />
        <line x1="330" y1="60" x2="330" y2="45" stroke="#0F172A" strokeWidth="2" />
        <line x1="330" y1="45" x2="380" y2="45" stroke="#0F172A" strokeWidth="2" markerEnd="url(#sfd-arrow)" />
        <line x1="480" y1="45" x2="520" y2="45" stroke="#0F172A" strokeWidth="2" markerEnd="url(#sfd-arrow)" />
        <line x1="640" y1="45" x2="680" y2="45" stroke="#0F172A" strokeWidth="2" markerEnd="url(#sfd-arrow)" />
        <line x1="800" y1="45" x2="860" y2="45" stroke="#0F172A" strokeWidth="2" markerEnd="url(#sfd-arrow)" />

        {/* exhaust return */}
        <path
          d="M 300 115 L 300 150 L 20 150 L 20 125"
          fill="none"
          stroke="#0F172A"
          strokeWidth="2"
          markerEnd="url(#sfd-arrow-red)"
        />
        <path d="M 20 125 L 20 150" fill="none" stroke="#0F172A" strokeWidth="2" />

        <foreignObject x="20" y="65" width="10" height="10">
          <div className="size-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-emerald-500" />
        </foreignObject>
        <foreignObject x="0" y="140" width="10" height="10">
          <div className="size-0 border-y-[6px] border-r-[10px] border-y-transparent border-r-red-500" />
        </foreignObject>

        <foreignObject x="60" y="65" width="140" height="50">
          <Pill label="PREHEAT" className="w-full bg-gradient-to-r from-amber-500 to-orange-500" />
        </foreignObject>
        <foreignObject x="240" y="55" width="90" height="70">
          <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-rose-500 text-xs font-bold text-white shadow-sm">
            ERV
          </div>
        </foreignObject>
        <foreignObject x="380" y="20" width="100" height="50">
          <Pill label="POST HEATING" className="w-full bg-gradient-to-r from-amber-400 to-amber-500" />
        </foreignObject>
        <foreignObject x="520" y="20" width="120" height="50">
          <Pill label="POST COOLING" className="w-full bg-gradient-to-r from-sky-500 to-blue-500" />
        </foreignObject>
        <foreignObject x="680" y="20" width="120" height="50">
          <Pill label="HUMIDIFICATION" className="w-full bg-gradient-to-r from-teal-500 to-emerald-500" />
        </foreignObject>
        <foreignObject x="860" y="25" width="40" height="40">
          <div className="flex h-9 items-center justify-center rounded-md border-2 border-emerald-500 px-2 text-[0.6rem] font-bold text-emerald-600">
            SUPPLY
          </div>
        </foreignObject>

        <foreignObject x="270" y="115" width="30" height="30">
          <div className="flex size-full items-center justify-center rounded-full border-2 border-slate-300 text-slate-400">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12h4l2-4 4 8 2-4h4" />
            </svg>
          </div>
        </foreignObject>
        <foreignObject x="-20" y="150" width="70" height="30">
          <div className="flex h-8 items-center justify-center rounded-md border-2 border-red-500 px-2 text-[0.6rem] font-bold text-red-500">
            EXHAUST
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}
