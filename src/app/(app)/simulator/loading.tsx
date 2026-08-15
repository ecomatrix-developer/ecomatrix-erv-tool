import { BrandLoader } from "@/components/brand-loader";

export default function SimulatorLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-100">
      <BrandLoader size="lg" text="Loading ERV Simulator" subtext="Initializing 8,760-hour thermodynamic engine & parameters..." />
    </div>
  );
}
