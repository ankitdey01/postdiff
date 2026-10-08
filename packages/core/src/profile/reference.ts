// Reference examples: the author's real posts per platform. Generation studies
// them and writes a similar variation for the new commit. V1: static files only.
// fs logic lives in ./samplefile; this module preserves the public reference API.

import { SAMPLE_SEPARATOR } from "./voice.js";
import {
  ensureSampleFiles,
  readSampleFile,
  appendSampleEntry,
  overwriteSampleEntry,
  clearSampleFile,
} from "./samplefile.js";

export { SAMPLE_SEPARATOR };

export const REFERENCE_FILES = ["x.md", "linkedin.md", "blog.md"] as const;
export type ReferenceFile = (typeof REFERENCE_FILES)[number];

/** Platform id -> its reference file (`blog` -> `blog.md`). */
export function platformReferenceFile(platform: "blog" | "x" | "linkedin"): ReferenceFile {
  return `${platform}.md` as ReferenceFile;
}

/** CLI platform flag -> reference file. */
const REFERENCE_FLAG_MAP: Record<string, ReferenceFile> = {
  "--blog": "blog.md",
  "--x": "x.md",
  "--linkedin": "linkedin.md",
};

export function resolveReferenceFile(flag: string | undefined): ReferenceFile | null {
  if (!flag) return null;
  return REFERENCE_FLAG_MAP[flag] ?? null;
}

/** Pre-creates the 3 reference files (empty) so `remove` can clear and `view` can read. */
export async function ensureReferenceFiles(referenceDir: string): Promise<void> {
  await ensureSampleFiles(referenceDir, REFERENCE_FILES);
}

export async function readReferenceFile(referenceDir: string, file: ReferenceFile): Promise<string> {
  return readSampleFile(referenceDir, file);
}

/** Appends an example. No min length — only empty strings rejected. Exact dupes skipped. */
export async function appendReferenceExample(
  referenceDir: string,
  file: ReferenceFile,
  example: string
): Promise<"appended" | "duplicate"> {
  return appendSampleEntry(referenceDir, file, example, "Nothing to add — example is empty.");
}

/** Overwrites unconditionally — no confirm (same rule as voice). */
export async function overwriteReferenceExample(referenceDir: string, file: ReferenceFile, example: string): Promise<void> {
  return overwriteSampleEntry(referenceDir, file, example, "Nothing to write — example is empty.");
}

/** Clears the file (never deletes — pre-created skeleton stays). */
export async function clearReferenceFile(referenceDir: string, file: ReferenceFile): Promise<void> {
  return clearSampleFile(referenceDir, file);
}
