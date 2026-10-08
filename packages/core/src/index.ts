// Public engine surface — the ONLY import surface for cli/extension.
// Never deep-import core/* from outside; add new slices here as they land.

export { resolveSha, getCommitPayload, truncateDiff, shapeDiffForJudge, splitDiffSections, MAX_BLOB_BYTES, getFileStatuses, getParentMessage, readFileAtCommit, isIgnoredPath } from "./source/git.js";
export type { FileStatus, DiffSection } from "./source/git.js";
export { JevSignificanceJudge, judgeSignificance } from "./significance/gate.js";
export type { SignificanceInput, SignificanceResult, SignificanceJudge } from "./significance/gate.js";
export { JevInclusionJudge, filterShapedDiff } from "./significance/inclusion.js";
export type { InclusionJudge, FileInclusion, FilteredDiff } from "./significance/inclusion.js";
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
} from "./store.js";
export type { PostdiffConfig, PostdiffUser, PostdiffModels, DraftMeta } from "./store.js";
export { applySetup, pingTypesafeKey, pingProviderKey, pingGroqKey } from "./setup.js";
export type { SetupAnswers, SetupResult } from "./setup.js";
export { PROVIDERS, getProviderSpec, providerEnvKeys } from "./generation/providers.js";
export type { ProviderSpec, ProviderRuntime } from "./generation/providers.js";
export { ensureVoiceFiles, VOICE_FILES } from "./profile/voice.js";
export type { VoiceFile } from "./profile/voice.js";
export {
  resolveVoiceFile,
  readVoiceFile,
  appendVoiceSample,
  overwriteVoiceSample,
  clearVoiceFile,
  SAMPLE_SEPARATOR,
} from "./profile/voice.js";
export type { Platform, Verdict } from "./shared/types.js";
export { REFERENCE_FILES } from "./profile/reference.js";
export type { ReferenceFile } from "./profile/reference.js";
export { PREFERENCE_FILES, MAX_PREFERENCE_RULES } from "./profile/preferences.js";
export type { PreferenceFile } from "./profile/preferences.js";
export {
  resolvePreferenceFile,
  platformPreferenceFile,
  ensurePreferenceFiles,
  readPreferenceFile,
  splitPreferenceRules,
  appendPreferenceRule,
  overwritePreferenceFile,
  clearPreferenceFile,
} from "./profile/preferences.js";
export {
  resolveReferenceFile,
  platformReferenceFile,
  ensureReferenceFiles,
  readReferenceFile,
  appendReferenceExample,
  overwriteReferenceExample,
  clearReferenceFile,
} from "./profile/reference.js";
export { gatherCommitContext, loadOrGatherCommitContext, saveCommitContext, loadCommitContext } from "./source/context.js";
export { cleanText, MAX_FILE_CHARS, MAX_TOTAL_CHARS, CONTEXT_SCHEMA } from "./source/context.js";
export type { CommitContext, ContextFile, OmitReason } from "./source/context.js";
export { SdkGenerator, GroqGenerator, platformDraftFile, MAX_RULE_WORDS, MAX_RULE_CHARS, truncateRule } from "./generation/generator.js";
export type { GenerateInput, DraftResult, Generator, GeneratorOptions } from "./generation/generator.js";
export { generatePipeline } from "./generation/pipeline.js";
export type { PipelineInput, PipelineEvent, PipelineResult } from "./generation/pipeline.js";
export {
  readReviewState,
  initReview,
  recordVerdict,
  hashContent,
  reviewFileName,
  rejectRuleFor,
} from "./delivery/review.js";
export type { ReviewStatus, ReviewVersion, ReviewState, VerdictInput, VerdictOutcome } from "./delivery/review.js";
export { preparePublish } from "./delivery/publish.js";
export type { PublishReady } from "./delivery/publish.js";
export { assemblePrompt } from "./generation/assemble.js";
export { SUMMARY_SCHEMA, SummarySchema, hashSummaryInput, loadSummary, saveSummary, renderSummary } from "./summary/summary.js";
export type { CommitSummary, CachedSummary } from "./summary/summary.js";
export { platformSpec, X_SPEC, LINKEDIN_SPEC, BLOG_SPEC } from "./generation/platforms.js";
export type { PlatformSpec } from "./generation/platforms.js";
