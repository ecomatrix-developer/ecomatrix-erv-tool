import { BrandLoader } from "@/components/brand-loader";

export default function AppLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-100/80">
      <BrandLoader size="xl" text="Loading Eco Matrix" subtext="Optimizing response time and rendering..." />
    </div>
  );
}
