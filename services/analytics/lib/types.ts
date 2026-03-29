export interface SearchEventLocation {
  country: string;
  region: string;
  city: string;
}

export interface SearchEventOccupation {
  socCode: string;
  title: string;
  titleZh?: string;
}

export interface SearchEventRecord {
  id: string;
  occurredAt: string;
  query: string;
  normalizedQuery: string;
  language: string;
  source: string;
  pageUrl: string;
  referrer: string;
  userAgent: string;
  ip: string;
  location: SearchEventLocation;
  occupation: SearchEventOccupation | null;
}

export interface AnalyticsSchedulerState {
  lastRunAt?: string;
  lastStatus?: "success" | "failure";
  lastError?: string;
}

export interface ReportBarDatum {
  label: string;
  count: number;
}

export interface ReportTrendDatum {
  date: string;
  count: number;
}

export interface AnalyticsReportModel {
  generatedAt: string;
  totalInputCount: number;
  uniqueQueryCount: number;
  topQueries: ReportBarDatum[];
  topResolvedOccupations: ReportBarDatum[];
  countries: ReportBarDatum[];
  regions: ReportBarDatum[];
  cities: ReportBarDatum[];
  trend: ReportTrendDatum[];
  recentWindow: {
    lastThreeDays: number;
    previousThreeDays: number;
    delta: number;
    deltaPercent: number | null;
  };
}

export interface AnalyticsReportArtifacts {
  model: AnalyticsReportModel;
  latestJsonPath: string;
  latestHtmlPath: string;
  timestampedJsonPath: string;
  timestampedHtmlPath: string;
}
