function normalizeText(value = "") { return value.toLowerCase().replace(/\s+/g, " ").trim(); }
export function buildMemoryContext({ brandDNA = "", repos = [], latestRuns = [] }) {
  const repoSummary = repos.length ? `Connected repositories: ${repos.join(", ")}` : "No repositories connected yet.";
  const recentRunSummary = latestRuns.length ? latestRuns.slice(0, 5).map((run, index) => `${index + 1}. ${run.title} (${run.department})`).join(" | ") : "No recent runs available.";
  return { knowledgeSnapshot: [brandDNA || "No brand DNA saved.", repoSummary, recentRunSummary].join("\n\n"), searchableTerms: normalizeText([brandDNA, repoSummary, recentRunSummary].join(" ")) };
}
export function rankMemoryMatches(query = "", records = []) {
  const q = normalizeText(query);
  return records.map((record) => {
    const hay = normalizeText(`${record.title || ""} ${record.department || ""} ${record.brief || ""} ${record.output_summary || ""}`);
    const score = q && hay.includes(q) ? 1 : 0;
    return { ...record, score };
  }).filter((record) => record.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);
}
