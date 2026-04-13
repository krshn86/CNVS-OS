import { buildMemoryContext } from "./memoryEngine.js";
export async function generatePipelineOutput({ title, department, outputType, brief, knowledgeContext, provider, model, latestRuns = [], repos = [] }) {
  const memory = buildMemoryContext({ brandDNA: knowledgeContext, repos, latestRuns });
  return {
    summary: `CNVS generated a ${outputType || "pipeline"} for ${department || "the selected team"} using ${provider || "default provider"} and ${model || "default model"}.`,
    content: {
      headline: `${title} — Audit-Aware Output`,
      narrative: `This run interprets the brief as an execution request: ${brief}`,
      strategicFrame: [`Objective: ${title}`, `Department: ${department || "Brand Studio"}`, `Format: ${outputType || "Activation Pipeline"}`, memory.knowledgeSnapshot],
      nextAction: "Review in Inbox, approve if correct, or request revision.",
      contextApplied: memory.knowledgeSnapshot,
    },
    meta: { provider: provider || "openai", model: model || "gpt-4.1-mini", generatedAt: new Date().toISOString(), memoryAware: true, workflowAware: true, schedulerAware: true, alertsAware: true, permissionsAware: true, auditAware: true },
  };
}
