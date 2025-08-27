export type AgentId = "text-leak" | "reverse-image" | "redaction";


export type UploadedMedia = {
id: string;
file: File;
kind: "image" | "video";
previewUrl: string;
};


export type Submission = {
text: string;
media: UploadedMedia[];
};


export type AgentFinding = {
id: string;
agent: AgentId;
title: string;
severity: "low" | "medium" | "high";
description?: string;
url?: string;
extra?: Record<string, unknown>;
};


export type AgentOutput = {
agent: AgentId;
findings: AgentFinding[];
stats?: Record<string, number>;
};


export type DangerScore = {
value: number; // 0 - 100
reasons: string[];
};


export type AgentTransportMode = "mock" | "http";


export type AgentConfig = {
id: AgentId;
name: string;
baseUrl?: string; // for http transport
apiKey?: string;
enabled: boolean;
};