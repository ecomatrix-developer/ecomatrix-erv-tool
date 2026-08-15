import { getSession } from "@/lib/session";
import { SettingsPanel } from "@/components/settings-panel";

export default async function SettingsPage() {
  const session = await getSession();

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-50">
      <SettingsPanel userEmail={session?.email ?? ""} />
    </div>
  );
}
