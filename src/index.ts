// Public engine surface — the ONLY import surface for cli/extension.
// Never deep-import core/* from outside; add new slices here as they land.

export { resolveSha, getCommitPayload, truncateDiff, shapeDiffForJudge, splitDiffSections, MAX_BLOB_BYTES } from "./core/git/index.js";
export { getFileStatuses, getParentMessage, readFileAtCommit, isIgnoredPath } from "./core/git/index.js";
export type { FileStatus, DiffSection } from "./core/git/index.js";
export { JevSignificanceJudge, judgeSignificance, JevInclusionJudge, filterShapedDiff } from "./core/significance/index.js";
export type { SignificanceInput, SignificanceResult, SignificanceJudge, InclusionJudge, FileInclusion, FilteredDiff } from "./core/significance/index.js";
export {
  getTractHome,
  getRepoSlug,
  ensureTractHome,
  loadConfig,
  saveMeta,
  hashDiff,
  DEFAULT_CONFIG,
} from "./core/store/index.js";
export type { TractConfig, DraftMeta } from "./core/store/index.js";
export { ensureVoiceFiles, VOICE_FILES } from "./core/voice/index.js";
export type { VoiceFile } from "./core/voice/index.js";
export {
  resolveVoiceFile,
  readVoiceFile,
  appendVoiceSample,
  overwriteVoiceSample,
  clearVoiceFile,
  SAMPLE_SEPARATOR,
} from "./core/voice/index.js";
export type { Platform, Verdict } from "./shared/types.js";
export { REFERENCE_FILES } from "./core/reference/index.js";
export type { ReferenceFile } from "./core/reference/index.js";
export { PREFERENCE_FILES, MAX_PREFERENCE_RULES } from "./core/preferences/index.js";
export type { PreferenceFile } from "./core/preferences/index.js";
export {
  resolvePreferenceFile,
  platformPreferenceFile,
  ensurePreferenceFiles,
  readPreferenceFile,
  splitPreferenceRules,
  appendPreferenceRule,
  overwritePreferenceFile,
  clearPreferenceFile,
} from "./core/preferences/index.js";
export {
  resolveReferenceFile,
  platformReferenceFile,
  ensureReferenceFiles,
  readReferenceFile,
  appendReferenceExample,
  overwriteReferenceExample,
  clearReferenceFile,
} from "./core/reference/index.js";
export { gatherCommitContext, loadOrGatherCommitContext, saveCommitContext, loadCommitContext } from "./core/context/index.js";
export { cleanText, MAX_FILE_CHARS, MAX_TOTAL_CHARS, CONTEXT_SCHEMA } from "./core/context/index.js";
export type { CommitContext, ContextFile, OmitReason } from "./core/context/index.js";
export { GroqGenerator, platformDraftFile, MAX_RULE_WORDS, MAX_RULE_CHARS, truncateRule } from "./core/generation/index.js";
export type { GenerateInput, DraftResult, Generator, GeneratorOptions } from "./core/generation/index.js";
export {
  readReviewState,
  initReview,
  recordVerdict,
  hashContent,
  reviewFileName,
  rejectRuleFor,
} from "./core/review/index.js";
export type { ReviewStatus, ReviewVersion, ReviewState, VerdictInput, VerdictOutcome } from "./core/review/index.js";
export { assemblePrompt } from "./core/generation/assemble.js";
export { platformSpec, X_SPEC, LINKEDIN_SPEC, BLOG_SPEC } from "./core/generation/platforms.js";
export type { PlatformSpec } from "./core/generation/platforms.js";
