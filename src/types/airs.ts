export type Language = "en" | "zh";

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
  avgAirs: number;
  highRiskCount: number;
  occupationCount: number;
  date: string;
}

export interface OccupationListPayload {
  mode: string;
  source: string;
  updatedAt: string;
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
  date: string;
  dates: string[];
  regions: string[];
  occupation: OccupationRow;
}
