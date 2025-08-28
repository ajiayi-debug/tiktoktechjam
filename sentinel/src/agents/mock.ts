import type { AgentConfig, AgentFinding, AgentOutput, Submission } from "../types.js";


function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function id(prefix: string) { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }


export async function runMockAgents(submission: Submission, agents: AgentConfig[]): Promise<AgentOutput[]> {
const outs: AgentOutput[] = [];
await delay(400 + Math.random() * 600);


for (const a of agents) {
if (a.id === "text-leak") {
const findings = [] as AgentOutput["findings"];
if (/[[A-Z]+#/.test(submission.text) || /@/.test(submission.text)) {
findings.push({ id: id("f"), agent: a.id, title: "Possible email linked on data broker site", severity: "high", url: "https://example-broker.tld/profile/abc" });
findings.push({ id: id("f"), agent: a.id, title: "Phone number indexed on classifieds", severity: "medium", url: "https://classifieds.tld/user/xyz" });
}
outs.push({ agent: a.id, findings, stats: { leaks: findings.length } });
}


if (a.id === "reverse-image") {
const matches = submission.media.length ? Math.floor(Math.random() * 4) : 0;
const findings: AgentFinding[] = new Array(matches).fill(0).map((_, i) => ({
  id: id("f"),
  agent: a.id,
  title: `Image match #${i + 1} on forum`,
  severity: (i === 0 ? "high" : "low") as "low" | "medium" | "high",
  url: "https://imageboard.tld/thread/123"
}));
outs.push({ agent: a.id, findings, stats: { matches } });
}


if (a.id === "redaction") {
  const hasMedia = submission.media.length > 0;
  const findings = hasMedia ? [
    {
      id: id("f"),
      agent: a.id,
      title: "Detected car plate in frame",
      severity: "high" as "high" | "low" | "medium",
      description: "Plate: SGP1234A"
    }
  ] : [];
  outs.push({ agent: a.id, findings, stats: { redactions: findings.length } });
}
}
return outs;
}