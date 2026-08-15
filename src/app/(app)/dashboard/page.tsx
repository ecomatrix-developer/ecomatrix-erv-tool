import { getAllProjectsWithScenarios } from "@/app/actions/projects";
import { OverviewDashboard } from "@/components/overview-dashboard";

export default async function DashboardPage() {
  const projects = await getAllProjectsWithScenarios();
  return <OverviewDashboard projects={projects} />;
}
