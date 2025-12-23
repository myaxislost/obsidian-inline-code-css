export type PrefixItem = { prefix: string; clsName: string };

export type InlineCodeMatch = {
  prefix: string;
  clsNames: string[];
  value: string;
};

export function split(
  input: string
): { left: string; right: string } | null {
  const idx = input.indexOf(":");
  if (idx === -1) return null;

  return {
    left: input.slice(0, idx),
    right: input.slice(idx + 1),
  };
}

export function buildPrefixList(map: string[]): PrefixItem[] {
  const out: PrefixItem[] = [];

  for (const v of map) {
    if (typeof v !== "string") continue;

    const trimmed = v.trim();
    if (!trimmed) continue;

    const parts = split(trimmed);
    if (!parts) continue;

    const pfx = parts.left.trim();
    const cls = parts.right.trim();

    if (!pfx || !cls) continue;

    out.push({ prefix: `${pfx}:`, clsName: cls });
  }

  return out;
}

export function matchPrefix(raw: string, list: PrefixItem[]): InlineCodeMatch | null {
  if (typeof raw !== "string") return null;

  const t = raw.trim();
  if (!t) return null;

  const parts = split(t);
  if (!parts) return null;

  const left = parts.left.trim();
  const right = parts.right.trim();
  if (!left || !right) return null;

  const prefixKey = `${left}:`;
  if (prefixKey === ":") return null;

  const clsNames: string[] = [];
  for (const { prefix, clsName } of list) {
    if (prefixKey === prefix) clsNames.push(clsName);
  }

  if (clsNames.length === 0) return null;

  return { prefix: left, clsNames, value: right };
}

export function isValidEntry(v: unknown): v is string {
  if (typeof v !== "string") return false;

  const trimmed = v.trim();
  if (!trimmed) return false;

  const parts = split(trimmed);
  if (!parts) return false;

  const pfx = parts.left.trim();
  const cls = parts.right.trim();

  return pfx.length > 0 && cls.length > 0;
}

export function normalize(list: unknown): string[] {
  if (!Array.isArray(list)) return [];

  const out: string[] = [];
  for (const v of list) {
    if (!isValidEntry(v)) continue;

    const parts = split(v.trim());
    if (!parts) continue;

    out.push(`${parts.left.trim()}:${parts.right.trim()}`);
  }

  return out;
}
