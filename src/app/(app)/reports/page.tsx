import { listProjects } from "@/app/actions/projects";
import { ReportsPanel } from "@/components/reports-panel";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ projectId?: string }>;
}) {
  const params = await searchParams;
  const projects = await listProjects();
  return <ReportsPanel projects={projects} initialProjectId={params?.projectId} />;
}
