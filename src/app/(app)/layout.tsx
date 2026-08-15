import { AppSidebar } from "@/components/app-sidebar";
import { FloatingCalculator } from "@/components/floating-calculator";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar />
      <main className="min-w-0 flex-1">{children}</main>
      <FloatingCalculator />
    </div>
  );
}
