export const TRANSITIONS = Object.freeze({
  DRAFT: ["READY", "BLOCKED", "CANCELLED"],
  READY: ["IMPLEMENTING", "DRAFT", "BLOCKED", "CANCELLED"],
  IMPLEMENTING: ["REVIEW", "BLOCKED"],
  REVIEW: ["PASS", "REPAIR", "REPLAN", "BLOCKED"],
  REPAIR: ["IMPLEMENTING", "BLOCKED"],
  REPLAN: ["DRAFT", "BLOCKED"],
  BLOCKED: ["DRAFT", "READY", "IMPLEMENTING", "REVIEW", "CANCELLED"],
  PASS: [],
  CANCELLED: []
});

export function canTransition(from, to) {
  return Boolean(TRANSITIONS[from]?.includes(to));
}

export function assertTransition(from, to) {
  if (!canTransition(from, to)) throw new Error(`Illegal lifecycle transition: ${from} -> ${to}`);
}
