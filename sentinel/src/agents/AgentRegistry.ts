import type { AgentConfig, AgentId, AgentOutput, Submission, AgentTransportMode } from "../types";
import { runMockAgents } from "./mock.ts";
import { runHttpAgents } from "./http.ts";


export class AgentRegistry {
private configs: Record<AgentId, AgentConfig> = {
"text-leak": { id: "text-leak", name: "Agent 1 – Text Leak Scanner", enabled: true },
"reverse-image": { id: "reverse-image", name: "Agent 2 – Reverse Image Search", enabled: true },
redaction: { id: "redaction", name: "Agent 3 – Redaction & Warning", enabled: true },
};


constructor() {
// Load from localStorage if present
try {
const raw = localStorage.getItem("sentinel.agentConfigs");
if (raw) {
const saved = JSON.parse(raw) as AgentConfig[];
for (const c of saved) this.configs[c.id] = { ...this.configs[c.id], ...c };
}
} catch {}
}


list(): AgentConfig[] { return Object.values(this.configs); }


update(cfg: AgentConfig) {
this.configs[cfg.id] = cfg;
localStorage.setItem("sentinel.agentConfigs", JSON.stringify(this.list()));
}


async runAll(submission: Submission, mode: AgentTransportMode): Promise<AgentOutput[]> {
const enabled = this.list().filter((c) => c.enabled);
if (mode === "mock") return runMockAgents(submission, enabled);
return runHttpAgents(submission, enabled);
}
}