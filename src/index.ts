// Public engine surface — the ONLY import surface for cli/extension.
// Never deep-import core/* from outside; add new slices here as they land.

export { resolveSha, getCommitPayload, truncateDiff, shapeDiffForJudge, splitDiffSections, MAX_BLOB_BYTES, getFileStatuses, getParentMessage, readFileAtCommit, isIgnoredPath } from "./core/source/git.js";
export type { FileStatus, DiffSection } from "./core/source/git.js";
export { JevSignificanceJudge, judgeSignificance } from "./core/significance/gate.js";
export type { SignificanceInput, SignificanceResult, SignificanceJudge } from "./core/significance/gate.js";
export { JevInclusionJudge, filterShapedDiff } from "./core/significance/inclusion.js";
export type { InclusionJudge, FileInclusion, FilteredDiff } from "./core/significance/inclusion.js";
export {
  getPostdiffHome,
  getConfigPath,
  getEnvPath,
  getRepoSlug,
  ensurePostdiffHome,
  loadConfig,
  saveMeta,
  hashDiff,
  DEFAULT_CONFIG,
  CONFIG_VERSION,
} from "./core/store.js";
export type { PostdiffConfig, PostdiffUser, PostdiffModels, DraftMeta } from "./core/store.js";
export { applySetup, pingTypesafeKey, pingProviderKey, pingGroqKey } from "./core/setup.js";
export type { SetupAnswers, SetupResult } from "./core/setup.js";
export { PROVIDERS, getProviderSpec, providerEnvKeys } from "./core/generation/providers.js";
export type { ProviderSpec, ProviderRuntime } from "./core/generation/providers.js";
export { ensureVoiceFiles, VOICE_FILES } from "./core/profile/voice.js";
export type { VoiceFile } from "./core/profile/voice.js";
export {
  resolveVoiceFile,
  readVoiceFile,
  appendVoiceSample,
  overwriteVoiceSample,
  clearVoiceFile,
  SAMPLE_SEPARATOR,
} from "./core/profile/voice.js";
export type { Platform, Verdict } from "./shared/types.js";
export { REFERENCE_FILES } from "./core/profile/reference.js";
export type { ReferenceFile } from "./core/profile/reference.js";
export { PREFERENCE_FILES, MAX_PREFERENCE_RULES } from "./core/profile/preferences.js";
export type { PreferenceFile } from "./core/profile/preferences.js";
export {
  resolvePreferenceFile,
  platformPreferenceFile,
  ensurePreferenceFiles,
  readPreferenceFile,
  splitPreferenceRules,
  appendPreferenceRule,
  overwritePreferenceFile,
  clearPreferenceFile,
} from "./core/profile/preferences.js";
export {
  resolveReferenceFile,
  platformReferenceFile,
  ensureReferenceFiles,
  readReferenceFile,
  appendReferenceExample,
  overwriteReferenceExample,
  clearReferenceFile,
} from "./core/profile/reference.js";
export { gatherCommitContext, loadOrGatherCommitContext, saveCommitContext, loadCommitContext } from "./core/source/context.js";
export { cleanText, MAX_FILE_CHARS, MAX_TOTAL_CHARS, CONTEXT_SCHEMA } from "./core/source/context.js";
export type { CommitContext, ContextFile, OmitReason } from "./core/source/context.js";
export { SdkGenerator, GroqGenerator, platformDraftFile, MAX_RULE_WORDS, MAX_RULE_CHARS, truncateRule } from "./core/generation/generator.js";
export type { GenerateInput, DraftResult, Generator, GeneratorOptions } from "./core/generation/generator.js";
export { generatePipeline } from "./core/generation/pipeline.js";
export type { PipelineInput, PipelineEvent, PipelineResult } from "./core/generation/pipeline.js";
export {
  readReviewState,
  initReview,
  recordVerdict,
  hashContent,
  reviewFileName,
  rejectRuleFor,
} from "./core/delivery/review.js";
export type { ReviewStatus, ReviewVersion, ReviewState, VerdictInput, VerdictOutcome } from "./core/delivery/review.js";
export { preparePublish } from "./core/delivery/publish.js";
export type { PublishReady } from "./core/delivery/publish.js";
export { assemblePrompt } from "./core/generation/assemble.js";
export { SUMMARY_SCHEMA, MIN_SUMMARY_CHARS, SummarySchema, hashSummaryInput, loadSummary, saveSummary, renderSummary } from "./core/summary/summary.js";
export type { CommitSummary, CachedSummary } from "./core/summary/summary.js";export { platformSpec, X_SPEC, LINKEDIN_SPEC, BLOG_SPEC } from "./core/generation/platforms.js";
export type { PlatformSpec } from "./core/generation/platforms.js";
