import type { AgentOutput, DangerScore } from "../types.js";


export function computeDanger(outputs: AgentOutput[]): DangerScore {
let score = 0;
const reasons: string[] = [];


for (const out of outputs) {
for (const f of out.findings) {
const inc = f.severity === "high" ? 20 : f.severity === "medium" ? 10 : 5;
score += inc;
reasons.push(`${out.agent}: ${f.title} (${f.severity})`);
}
}


// Soft caps & normalization
score = Math.min(100, Math.round(score));


// Heuristic boosts
const reverse = outputs.find((o) => o.agent === "reverse-image");
if (reverse && (reverse.stats?.matches ?? 0) > 3) {
score = Math.min(100, score + 10);
reasons.push("Multiple reverse-image matches detected");
}


return { value: score, reasons };
}