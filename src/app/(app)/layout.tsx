import { AppSidebar } from "@/components/app-sidebar";
import { FloatingCalculator } from "@/components/floating-calculator";
import { TrialStatus } from "@/components/trial-status";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <AppSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      <FloatingCalculator />
      <TrialStatus />
    </div>
  );
}
