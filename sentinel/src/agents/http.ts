import type { AgentConfig, AgentOutput, Submission } from "../types.ts";
import { extractAndMaskPII } from "../lib/pii.ts";


async function postJSON<T>(url: string, body: unknown, apiKey?: string): Promise<T> {
const res = await fetch(url, {
method: "POST",
headers: {
"Content-Type": "application/json",
...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
},
body: JSON.stringify(body),
});
if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
return res.json();
}


export async function runHttpAgents(submission: Submission, agents: AgentConfig[]): Promise<AgentOutput[]> {
const outputs: AgentOutput[] = [];


// Pre-process text for Agent 1
const { masked, tokens } = extractAndMaskPII(submission.text);


for (const a of agents) {
if (!a.baseUrl) throw new Error(`Agent ${a.name} has no baseUrl configured.`);


if (a.id === "text-leak") {
const out = await postJSON<AgentOutput>(`${a.baseUrl}/scan-text`, {
text: masked,
tokens, // hashed anchors for server-side joins
}, a.apiKey);
outputs.push(out);
}


if (a.id === "reverse-image") {
// Send all images/videos as presigned URLs or base64 (demo sends names only)
const mediaNames = submission.media.map((m) => m.file.name);
const out = await postJSON<AgentOutput>(`${a.baseUrl}/reverse-search`, { mediaNames }, a.apiKey);
outputs.push(out);
}


if (a.id === "redaction") {
const mediaNames = submission.media.map((m) => m.file.name);
const out = await postJSON<AgentOutput>(`${a.baseUrl}/redaction-scan`, { mediaNames }, a.apiKey);
outputs.push(out);
}
}


return outputs;
}