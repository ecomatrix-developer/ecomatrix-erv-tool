import { listProjects } from "@/app/actions/projects";
import { HistoryPanel } from "@/components/history-panel";

export default async function HistoryPage() {
  const projects = await listProjects();
  return <HistoryPanel initialProjects={projects} />;
}
