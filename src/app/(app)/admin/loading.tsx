import { BrandLoader } from "@/components/brand-loader";

export default function AdminLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-900">
      <BrandLoader size="lg" text="Loading Admin Portal" subtext="Verifying system credentials and database weather logs..." />
    </div>
  );
}
