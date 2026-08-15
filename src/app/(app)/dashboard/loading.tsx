import { BrandLoader } from "@/components/brand-loader";

export default function DashboardLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <BrandLoader size="lg" text="Loading Overview Dashboard" subtext="Aggregating simulation analytics & energy performance..." />
    </div>
  );
}
