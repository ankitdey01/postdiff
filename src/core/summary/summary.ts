// Engine: cached detailed change brief. Built once per sha from the filtered
// diff + commit message + README; every platform draft renders from this brief
// and never sees the raw diff. Secrets never read here.

import { createHash } from "node:crypto";
import { join } from "node:path";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { z } from "zod";

/** Schema tag on summary.json: bump when the brief shape changes. */
export const SUMMARY_SCHEMA = 1;

export const SummarySchema = z.object({
  overview: z.string().describe("2-4 sentences: what this commit does, end to end."),
  why: z.string().describe("Motivation / problem solved, as evidenced in message + diff. 'unknown' when not evidenced — never invented."),
  scope: z.string().describe("One of: feat, fix, perf, refactor, docs, chore, test, build, ci."),
  logicalGroups: z
    .array(z.object({ title: z.string(), files: z.array(z.string()), description: z.string() }))
    .describe("Cohesive change groups and how they connect to each other."),
  fileHighlights: z
    .array(z.object({ path: z.string(), status: z.string(), change: z.string(), whyItMatters: z.string() }))
    .describe("Per-file what-changed plus why that file matters to the whole."),
  userImpact: z.string().describe("What changes for the user/dev. Concrete, no marketing."),
  storyHooks: z.array(z.string()).describe("3-5 candidate interesting angles a post could lead with."),
  notIncluded: z.array(z.string()).describe("Files/sections deliberately excluded as noise, one-line reason each."),
  uncertainties: z.array(z.string()).describe("Anything ambiguous in the diff, stated plainly."),
});

export type CommitSummary = z.infer<typeof SummarySchema>;

export interface CachedSummary {
  schema: number;
  sha: string;
  createdAt: string;
  model: string;
  inputHash: string;
  summary: CommitSummary;
}

/** Hash over the summarizer inputs: rebuilds only when these change (or --fresh). */
export function hashSummaryInput(parts: { diff: string; commitMessage: string; readme: string | null }): string {
  return createHash("sha1")
    .update(parts.diff)
    .update("\n---msg---\n")
    .update(parts.commitMessage)
    .update("\n---readme---\n")
    .update(parts.readme ?? "")
    .digest("hex")
    .slice(0, 12);
}

function summaryPath(home: string, slug: string, sha: string): string {
  return join(home, "repos", slug, sha, "summary.json");
}

export async function loadSummary(home: string, slug: string, sha: string): Promise<CachedSummary | null> {
  try {
    const raw = await readFile(summaryPath(home, slug, sha), "utf8");
    const cached = JSON.parse(raw) as CachedSummary;
    if (cached.schema !== SUMMARY_SCHEMA) return null;
    if (!cached.summary || cached.sha !== sha) return null;
    return cached;
  } catch {
    return null;
  }
}

export async function saveSummary(home: string, slug: string, cached: CachedSummary): Promise<string> {
  const path = summaryPath(home, slug, cached.sha);
  await mkdir(join(home, "repos", slug, cached.sha), { recursive: true });
  await writeFile(path, JSON.stringify(cached, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
  await chmod(path, 0o600); // mode above applies at creation only — tighten existing files too
  return path;
}

/** Deterministic render of the brief for the writer prompt. */
export function renderSummary(s: CommitSummary): string {
  const groups = s.logicalGroups.map((g) => `- ${g.title} [${g.files.join(", ")}]: ${g.description}`).join("\n") || "(none)";
  const files = s.fileHighlights.map((f) => `- ${f.status} ${f.path}: ${f.change} (why it matters: ${f.whyItMatters})`).join("\n") || "(none)";
  const hooks = s.storyHooks.map((h, i) => `${i + 1}. ${h}`).join("\n") || "(none)";
  const excluded = s.notIncluded.length > 0 ? s.notIncluded.map((n) => `- ${n}`).join("\n") : "(none)";
  const unknown = s.uncertainties.length > 0 ? s.uncertainties.map((u) => `- ${u}`).join("\n") : "(none)";
  return [
    `Overview: ${s.overview}`,
    `Why: ${s.why}`,
    `Scope: ${s.scope}`,
    "",
    "Logical groups (connected changes):",
    groups,
    "",
    "File highlights:",
    files,
    "",
    `User impact: ${s.userImpact}`,
    "",
    "Story hooks:",
    hooks,
    "",
    "Deliberately excluded:",
    excluded,
    "",
    "Uncertainties:",
    unknown,
  ].join("\n");
}
