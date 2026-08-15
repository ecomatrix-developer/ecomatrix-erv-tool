import { ErvSimulator } from "@/components/erv-simulator";
import { getProject, getScenarios } from "@/app/actions/projects";
import type { ScenarioInputsPayload } from "@/lib/calc-engine/request";
import type { ScenarioOutputs } from "@/lib/calc-engine/types";

interface SimulatorPageProps {
  searchParams: Promise<{ projectId?: string }>;
}

export default async function SimulatorPage({ searchParams }: SimulatorPageProps) {
  const { projectId } = await searchParams;
  let initialPayloads: ScenarioInputsPayload[] | undefined;
  let initialScenarios: ScenarioOutputs[] | undefined;
  let initialProjectName: string | undefined;

  if (projectId) {
    const projectData = await getProject(projectId);
    if (projectData) {
      initialProjectName = projectData.name;
      const rows = await getScenarios(projectId);
      if (rows && rows.length > 0) {
        initialPayloads = rows.map((r) => r.inputs as ScenarioInputsPayload);
        initialScenarios = rows.map((r) => r.outputs as ScenarioOutputs).filter(Boolean);
      }
    }
  }

  return (
    <ErvSimulator
      initialProjectId={projectId}
      initialProjectName={initialProjectName}
      initialPayloads={initialPayloads}
      initialScenarios={initialScenarios}
    />
  );
}
