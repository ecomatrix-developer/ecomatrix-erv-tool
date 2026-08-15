import { BrandLoader } from "@/components/brand-loader";

export default function ReportsLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <BrandLoader size="lg" text="Loading Reports & Exports" subtext="Preparing PDF report generation engine..." />
    </div>
  );
}
