import { redirect, notFound } from "next/navigation";
import { getProject } from "@/app/actions/projects";

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  redirect(`/reports?projectId=${projectId}`);
}
