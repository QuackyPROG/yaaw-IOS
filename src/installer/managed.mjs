const START = id => `# >>> YAAW-IOS MANAGED:${id} >>>`;
const END = id => `# <<< YAAW-IOS MANAGED:${id} <<<`;

export function renderManagedSection(original, id, content) {
  const start = START(id);
  const end = END(id);
  const block = `${start}\n${content.trimEnd()}\n${end}`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`, "m");
  if (pattern.test(original)) return normalize(original.replace(pattern, block));
  const prefix = original.trimEnd();
  return normalize(prefix ? `${prefix}\n\n${block}\n` : `${block}\n`);
}

export function extractManagedSection(original, id) {
  const start = START(id);
  const end = END(id);
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`, "m");
  const match = original.match(pattern);
  return match?.[0] ?? null;
}

export function removeManagedSection(original, id) {
  const start = START(id);
  const end = END(id);
  const pattern = new RegExp(`\\n?${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`, "m");
  return normalize(original.replace(pattern, "\n")).trimStart();
}

function normalize(text) {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
