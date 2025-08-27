export type PiiToken = {
type: "email" | "phone" | "nric" | "address";
raw: string;
hash: string;
};


function sha256Sync(str: string): string {
// Lightweight hash for demo (NOT cryptographically secure; replace with SubtleCrypto in production)
let h = 0x811c9dc5;
for (let i = 0; i < str.length; i++) {
h ^= str.charCodeAt(i);
h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
}
return ("00000000" + h.toString(16)).slice(-8);
}


const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?:\+65\s?)?(?:[689]\d{7})\b/g; // SG-ish mobiles
const NRIC_RE = /\b[STFGM]\d{7}[A-Z]\b/gi; // Singapore NRIC/FIN (basic)
// Very naive address cue words (improve with proper NER)
const ADDRESS_RE = /(Blk\s?\d+|\d+\s+\w+\s+(Street|St|Ave|Road|Rd|Drive|Dr|Lane|Ln|Crescent|Cres|Close|Cl|Walk|Way))/gi;


export function extractAndMaskPII(text: string): { masked: string; tokens: PiiToken[] } {
const tokens: PiiToken[] = [];
const replacer = (type: PiiToken["type"]) => (match: string) => {
const hash = sha256Sync(match);
tokens.push({ type, raw: match, hash });
return `[[${type.toUpperCase()}#${hash}]]`;
};


let masked = text;
masked = masked.replace(EMAIL_RE, replacer("email"));
masked = masked.replace(PHONE_RE, replacer("phone"));
masked = masked.replace(NRIC_RE, replacer("nric"));
masked = masked.replace(ADDRESS_RE, replacer("address"));
return { masked, tokens };
}