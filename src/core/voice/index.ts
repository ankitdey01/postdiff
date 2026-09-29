// Voice profile files (global ~/.postdiff/voice/). V1: static files only; learning is V2.
// fs logic lives in ../samplefile; this module preserves the public voice API.

import {
  SAMPLE_SEPARATOR,
  ensureSampleFiles,
  readSampleFile,
  appendSampleEntry,
  overwriteSampleEntry,
  clearSampleFile,
} from "../samplefile/index.js";

export { SAMPLE_SEPARATOR };

export const VOICE_FILES = ["voice.md", "x.md", "linkedin.md", "blog.md"] as const;
export type VoiceFile = (typeof VOICE_FILES)[number];

/** CLI platform flag -> voice file. */
const VOICE_FLAG_MAP: Record<string, VoiceFile> = {
  "--blog": "blog.md",
  "--x": "x.md",
  "--linkedin": "linkedin.md",
  "--voice": "voice.md",
};

export function resolveVoiceFile(flag: string | undefined): VoiceFile | null {
  if (!flag) return null;
  return VOICE_FLAG_MAP[flag] ?? null;
}

/** Pre-creates the 4 voice files (empty) so `remove` can clear and `view` can read. */
export async function ensureVoiceFiles(voiceDir: string): Promise<void> {
  await ensureSampleFiles(voiceDir, VOICE_FILES);
}

export async function readVoiceFile(voiceDir: string, file: VoiceFile): Promise<string> {
  return readSampleFile(voiceDir, file);
}

/** Appends a sample. No min length — only empty strings rejected. Exact dupes skipped. */
export async function appendVoiceSample(voiceDir: string, file: VoiceFile, sample: string): Promise<"appended" | "duplicate"> {
  return appendSampleEntry(voiceDir, file, sample, "Nothing to add — sample is empty.");
}

/** Overwrites unconditionally — no confirm (locked). */
export async function overwriteVoiceSample(voiceDir: string, file: VoiceFile, sample: string): Promise<void> {
  return overwriteSampleEntry(voiceDir, file, sample, "Nothing to write — sample is empty.");
}

/** Clears the file (never deletes — pre-created skeleton stays). */
export async function clearVoiceFile(voiceDir: string, file: VoiceFile): Promise<void> {
  return clearSampleFile(voiceDir, file);
}
