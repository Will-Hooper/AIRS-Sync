export type Language = "en" | "zh";

export type OccupationSearchMatchType =
  | "exact_alias"
  | "prefix_alias"
  | "contains_alias"
  | "fuzzy_alias"
  | "category_fallback"
  | "no_result";

export type OccupationAliasType =
  | "official"
  | "common"
  | "spoken"
  | "recruitment"
  | "task_based"
  | "abbreviation"
  | "wrong_variant";

export interface OccupationTask {
  name: string;
  nameZh?: string;
  score?: number;
  [key: string]: unknown;
}

export interface EducationOutcomesSummary {
  cipCode: string;
  cipDesc: string;
  programCount: number;
  institutionCount: number;
  median1Y: number | null;
  median2Y: number | null;
}

export interface DatasetSourceUpdatedAt {
  recruitment?: string | null;
  airs?: string | null;
  onet?: string | null;
  collegeScorecard?: string | null;
  analytics?: string | null;
}

export interface DatasetSyncJobStatus {
  ok: boolean;
  updatedAt?: string | null;
  message?: string | null;
}

export interface DatasetSyncStatus {
  overall: "ok" | "warning" | "error";
  mode: "hourly" | "full";
  message?: string | null;
  jobs: {
    recruitment: DatasetSyncJobStatus;
    airs: DatasetSyncJobStatus;
    onet: DatasetSyncJobStatus;
    collegeScorecard: DatasetSyncJobStatus;
    analytics: DatasetSyncJobStatus;
  };
}

export interface JsonRegionMetrics {
  airs?: number;
  replacement?: number;
  augmentation?: number;
  hiring?: number;
  historical?: number;
  postings?: number;
  postingSources?: Record<string, number>;
  [key: string]: unknown;
}

export interface JsonDatasetOccupation {
  socCode: string;
  title: string;
  titleZh?: string;
  definition?: string;
  definitionZh?: string;
  educationOutcomes?: EducationOutcomesSummary;
  majorGroup: string;
  label: string;
  airs?: number;
  replacement?: number;
  augmentation?: number;
  hiring?: number;
  historical?: number;
  postings?: number;
  postingSources?: Record<string, number>;
  summary?: string;
  summaryZh?: string;
  monthlyAirs?: number[];
  evidence?: string[];
  evidenceZh?: string[];
  tasks?: OccupationTask[];
  regions?: Record<string, JsonRegionMetrics>;
  [key: string]: unknown;
}

export interface JsonDatasetSummary {
  avgAirs: number;
  highRiskCount: number;
  occupationCount: number;
}

export interface JsonDataset {
  generatedAt?: string;
  sourceUpdatedAt?: DatasetSourceUpdatedAt;
  datasetVersion?: string;
  syncStatus?: DatasetSyncStatus;
  dates?: string[];
  regions?: string[];
  labels?: string[];
  groups?: string[];
  summary?: JsonDatasetSummary;
  occupations: JsonDatasetOccupation[];
}

export interface OccupationRow extends JsonRegionMetrics {
  socCode: string;
  title: string;
  titleZh?: string;
  definition?: string;
  definitionZh?: string;
  educationOutcomes?: EducationOutcomesSummary;
  majorGroup: string;
  label: string;
  summary: string;
  summaryZh?: string;
  monthlyAirs: number[];
  evidence: string[];
  evidenceZh: string[];
  tasks: OccupationTask[];
  regionMetrics: Record<string, JsonRegionMetrics>;
  searchIndex?: string[];
  x?: number;
  y?: number;
  size?: number;
  zIndex?: number;
  [key: string]: unknown;
}

export interface OccupationSearchAlias {
  alias: string;
  aliasNormalized: string;
  aliasType: OccupationAliasType;
  weight: number;
  source: string;
}

export interface OccupationSearchHit {
  id: string;
  occupation: OccupationRow;
  label: string;
  labelEn?: string;
  normalizedQuery: string;
  matchType: OccupationSearchMatchType;
  score: number;
  matchReason?: string;
  matchedAlias?: string;
  matchedAliasNormalized?: string;
  categoryLv1?: string;
  categoryLv2?: string;
  analysisTemplateId?: string;
  searchPriority: number;
  aliases?: OccupationSearchAlias[];
}

export interface OccupationSearchPayload {
  queryRaw: string;
  queryNormalized: string;
  matchType: OccupationSearchMatchType;
  exactHit: boolean;
  primaryResult: OccupationSearchHit | null;
  alternatives: OccupationSearchHit[];
  suggestions: OccupationSearchHit[];
  popularSearches: OccupationSearchHit[];
  resultCount: number;
  feedbackHint?: string;
}

export interface OccupationQueryParams {
  date?: string;
  region?: string;
  majorGroup?: string;
  label?: string;
  q?: string;
}

export interface SummaryPayload {
  mode: string;
  source: string;
  updatedAt: string;
  generatedAt?: string;
  sourceUpdatedAt?: DatasetSourceUpdatedAt;
  datasetVersion?: string;
  syncStatus?: DatasetSyncStatus;
  avgAirs: number;
  highRiskCount: number;
  occupationCount: number;
  date: string;
}

export interface OccupationListPayload {
  mode: string;
  source: string;
  updatedAt: string;
  generatedAt?: string;
  sourceUpdatedAt?: DatasetSourceUpdatedAt;
  datasetVersion?: string;
  syncStatus?: DatasetSyncStatus;
  date: string;
  dates: string[];
  regions: string[];
  labels: string[];
  groups: string[];
  occupations: OccupationRow[];
}

export interface OccupationDetailPayload {
  mode: string;
  source: string;
  updatedAt: string;
  generatedAt?: string;
  sourceUpdatedAt?: DatasetSourceUpdatedAt;
  datasetVersion?: string;
  syncStatus?: DatasetSyncStatus;
  date: string;
  dates: string[];
  regions: string[];
  occupation: OccupationRow;
}
