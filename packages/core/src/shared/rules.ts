// Shared rule caps for distilled preference rules. Neutral ground like
// async.ts — generation and delivery both import here, neither owns it.

/** Cap for a distilled global rule: 50 words, 300 chars, whichever binds first. */
export const MAX_RULE_WORDS = 50;
export const MAX_RULE_CHARS = 300;

/** First-50-words-then-300-chars truncation, so over-long returns never bloat the file. */
export function truncateRule(rule: string): string {
  const words = rule.trim().split(/\s+/).filter(Boolean).slice(0, MAX_RULE_WORDS).join(" ");
  return words.slice(0, MAX_RULE_CHARS).trim();
}
