import { BrandLoader } from "@/components/brand-loader";

export default function HistoryLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <BrandLoader size="lg" text="Loading Past Simulation History" subtext="Fetching saved ERV project runs..." />
    </div>
  );
}
