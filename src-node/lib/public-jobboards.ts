import {
  getNumberArg,
  getStringArg,
  normalizeText,
  parseCliArgs,
  readJsonFile,
  testTextTerms,
  writeJsonFile,
  writeStep
} from "./common";
import { findDetailedSocOccupation, findOnetOccupation, toDetailedSocCode, type OnetData } from "./onet";

export interface PublicJobBoardSourceConfig {
  provider: "greenhouse" | "lever" | "ashby" | "smartrecruiters" | "workable";
  key: string;
  organization: string;
  label?: string;
  kind?: "company" | "university" | "job_board";
  enabled?: boolean;
  usOnly?: boolean;
}

export interface PublicJobBoardsConfigFile {
  source: string;
  locationScope: string;
  minMatchScore: number;
  sources: PublicJobBoardSourceConfig[];
}

export interface PublicJobBoardsHistoryDailyPoint {
  date: string;
  count: number;
  sources?: Record<string, number>;
}

export interface PublicJobBoardsHistoryOccupationEntry {
  socCode: string;
  title: string;
  majorGroup: string;
  daily: PublicJobBoardsHistoryDailyPoint[];
}

export interface PublicJobBoardsHistoryFile {
  source: string;
  lastRun: string;
  locationScope: string;
  minMatchScore: number;
  activeSources: Array<{
    label: string;
    provider: string;
    key: string;
    organization: string;
    kind: string;
  }>;
  occupations: PublicJobBoardsHistoryOccupationEntry[];
}

export interface PublicJobBoardsOccupationSeed {
  socCode: string;
  title: string;
  majorGroup: string;
}

export interface PublicJobBoardsProviderOptions {
  configPath: string;
  historyPath: string;
  timeoutSeconds: number;
  retryCount: number;
  retryDelaySeconds: number;
  minMatchScore: number;
  useExistingHistoryOnly: boolean;
}

interface PublicBoardPosting {
  title: string;
  location: string;
  country: string;
  sourceLabel: string;
}

interface GreenhouseJobsResponse {
  jobs?: Array<{
    title?: string;
    location?: { name?: string };
  }>;
  meta?: { total?: number };
}

interface LeverPosting {
  text?: string;
  country?: string;
  categories?: {
    location?: string;
    allLocations?: string[];
  };
}

interface AshbyJobsResponse {
  jobs?: Array<{
    title?: string;
    location?: string;
    address?: {
      postalAddress?: {
        addressCountry?: string;
        addressRegion?: string;
        addressLocality?: string;
      };
    };
  }>;
}

interface SmartRecruitersJobsResponse {
  totalFound?: number;
  offset?: number;
  limit?: number;
  content?: Array<{
    name?: string;
    location?: {
      city?: string;
      region?: string;
      country?: string;
      fullLocation?: string;
    };
  }>;
}

interface WorkableJobsResponse {
  jobs?: Array<{
    title?: string;
    full_title?: string;
    location?: {
      country?: string;
      country_code?: string;
      city?: string;
      region?: string;
      location_str?: string;
    };
  }>;
}

const US_STATE_NAMES = [
  "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut", "delaware",
  "district of columbia", "florida", "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa",
  "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts", "michigan", "minnesota",
  "mississippi", "missouri", "montana", "nebraska", "nevada", "new hampshire", "new jersey",
  "new mexico", "new york", "north carolina", "north dakota", "ohio", "oklahoma", "oregon",
  "pennsylvania", "rhode island", "south carolina", "south dakota", "tennessee", "texas", "utah",
  "vermont", "virginia", "washington", "west virginia", "wisconsin", "wyoming"
];

const US_STATE_ABBREVIATIONS = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM",
  "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA",
  "WV", "WI", "WY"
];

const TITLE_EXCLUDE_TERMS = [
  "intern",
  "internship",
  "co-op",
  "co op",
  "fellow",
  "fellowship",
  "campus ambassador",
  "student worker",
  "student assistant",
  "volunteer"
];

function toIsoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getDefaultConfig(): PublicJobBoardsConfigFile {
  return {
    source: "Public job boards (Greenhouse + Lever + Ashby + SmartRecruiters)",
    locationScope: "US",
    minMatchScore: 0.44,
    sources: [
      { provider: "greenhouse", key: "stripe", organization: "Stripe", kind: "company", enabled: true, usOnly: true },
      { provider: "greenhouse", key: "datadog", organization: "Datadog", kind: "company", enabled: true, usOnly: true },
      { provider: "greenhouse", key: "coinbase", organization: "Coinbase", kind: "company", enabled: true, usOnly: true },
      { provider: "lever", key: "palantir", organization: "Palantir", kind: "company", enabled: true, usOnly: true },
      { provider: "lever", key: "uaustin", organization: "University of Austin", kind: "university", enabled: true, usOnly: true },
      { provider: "ashby", key: "openai", organization: "OpenAI", kind: "company", enabled: true, usOnly: true },
      { provider: "ashby", key: "notion", organization: "Notion", kind: "company", enabled: true, usOnly: true },
      { provider: "ashby", key: "ramp", organization: "Ramp", kind: "company", enabled: true, usOnly: true },
      { provider: "ashby", key: "cursor", organization: "Cursor", kind: "company", enabled: true, usOnly: true },
      { provider: "ashby", key: "perplexity", organization: "Perplexity", kind: "company", enabled: true, usOnly: true },
      { provider: "ashby", key: "mercor", organization: "Mercor", kind: "company", enabled: true, usOnly: true },
      { provider: "ashby", key: "supabase", organization: "Supabase", kind: "company", enabled: true, usOnly: true },
      { provider: "smartrecruiters", key: "Visa", organization: "Visa", kind: "company", enabled: true, usOnly: true },
      { provider: "smartrecruiters", key: "smartrecruiters", organization: "SmartRecruiters", kind: "company", enabled: true, usOnly: true },
      { provider: "smartrecruiters", key: "LVMH", organization: "LVMH", kind: "company", enabled: true, usOnly: true }
    ]
  };
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getSourceLabel(source: PublicJobBoardSourceConfig) {
  return source.label || source.organization;
}

function isLikelyUsLocation(location: string, country = "") {
  const normalizedCountry = normalizeText(country);
  if (normalizedCountry) {
    if (["us", "usa", "united states", "united states of america"].includes(normalizedCountry)) {
      return true;
    }
    return false;
  }

  const raw = String(location || "");
  const normalized = normalizeText(raw);
  if (!normalized) {
    return false;
  }

  if (
    normalized.includes("united states") ||
    normalized.includes("united states of america") ||
    normalized.includes("usa") ||
    normalized.includes("u s")
  ) {
    return true;
  }

  if (US_STATE_NAMES.some((name) => normalized.includes(name))) {
    return true;
  }

  return US_STATE_ABBREVIATIONS.some((code) => {
    const pattern = new RegExp(`(^|[\\s,\\-/])${code}($|[\\s,\\-/])`, "i");
    return pattern.test(raw);
  });
}

function shouldExcludePosting(title: string) {
  return testTextTerms(normalizeText(title), TITLE_EXCLUDE_TERMS);
}

function getLatestKnownSourceCounts(
  entry: PublicJobBoardsHistoryOccupationEntry | undefined,
  sourceLabel: string
) {
  if (!entry?.daily?.length) return 0;
  const latest = [...entry.daily]
    .sort((left, right) => left.date.localeCompare(right.date))
    .at(-1);
  return Number(latest?.sources?.[sourceLabel] || 0);
}

async function fetchJsonWithRetries<T>(url: string, options: PublicJobBoardsProviderOptions): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= options.retryCount; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        },
        signal: AbortSignal.timeout(options.timeoutSeconds * 1000)
      });

      if (!response.ok) {
        throw new Error(`Request failed ${response.status}: ${url}`);
      }

      return await response.json() as T;
    } catch (error) {
      lastError = error;
      if (attempt >= options.retryCount) {
        break;
      }
      await sleep(options.retryDelaySeconds * attempt * 1000);
    }
  }

  throw lastError;
}

async function fetchGreenhousePostings(
  source: PublicJobBoardSourceConfig,
  options: PublicJobBoardsProviderOptions
): Promise<PublicBoardPosting[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(source.key)}/jobs?content=false`;
  const payload = await fetchJsonWithRetries<GreenhouseJobsResponse>(url, options);
  const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];

  return jobs
    .map((job) => ({
      title: String(job?.title || "").trim(),
      location: String(job?.location?.name || "").trim(),
      country: "",
      sourceLabel: getSourceLabel(source)
    }))
    .filter((job) => job.title);
}

async function fetchLeverPostings(
  source: PublicJobBoardSourceConfig,
  options: PublicJobBoardsProviderOptions
): Promise<PublicBoardPosting[]> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(source.key)}?mode=json`;
  const payload = await fetchJsonWithRetries<LeverPosting[]>(url, options);
  const jobs = Array.isArray(payload) ? payload : [];

  return jobs
    .map((job) => ({
      title: String(job?.text || "").trim(),
      location: String(job?.categories?.location || job?.categories?.allLocations?.[0] || "").trim(),
      country: String(job?.country || "").trim(),
      sourceLabel: getSourceLabel(source)
    }))
    .filter((job) => job.title);
}

async function fetchAshbyPostings(
  source: PublicJobBoardSourceConfig,
  options: PublicJobBoardsProviderOptions
): Promise<PublicBoardPosting[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(source.key)}`;
  const payload = await fetchJsonWithRetries<AshbyJobsResponse>(url, options);
  const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];

  return jobs
    .map((job) => {
      const locality = String(job?.address?.postalAddress?.addressLocality || "").trim();
      const region = String(job?.address?.postalAddress?.addressRegion || "").trim();
      const country = String(job?.address?.postalAddress?.addressCountry || "").trim();
      const fallbackLocation = String(job?.location || "").trim();
      const location = [locality, region, country].filter(Boolean).join(", ") || fallbackLocation;

      return {
        title: String(job?.title || "").trim(),
        location,
        country,
        sourceLabel: getSourceLabel(source)
      };
    })
    .filter((job) => job.title);
}

async function fetchSmartRecruitersPostings(
  source: PublicJobBoardSourceConfig,
  options: PublicJobBoardsProviderOptions
): Promise<PublicBoardPosting[]> {
  const limit = 100;
  let offset = 0;
  let totalFound = Number.POSITIVE_INFINITY;
  const results: PublicBoardPosting[] = [];

  while (offset < totalFound) {
    const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(source.key)}/postings?limit=${limit}&offset=${offset}`;
    const payload = await fetchJsonWithRetries<SmartRecruitersJobsResponse>(url, options);
    const jobs = Array.isArray(payload?.content) ? payload.content : [];

    for (const job of jobs) {
      const location = String(
        job?.location?.fullLocation ||
        [job?.location?.city, job?.location?.region, job?.location?.country].filter(Boolean).join(", ")
      ).trim();

      results.push({
        title: String(job?.name || "").trim(),
        location,
        country: String(job?.location?.country || "").trim(),
        sourceLabel: getSourceLabel(source)
      });
    }

    totalFound = Number(payload?.totalFound || jobs.length || 0);
    if (!jobs.length) {
      break;
    }
    offset += jobs.length;
    if (jobs.length < limit) {
      break;
    }
  }

  return results.filter((job) => job.title);
}

async function fetchWorkablePostings(
  source: PublicJobBoardSourceConfig,
  options: PublicJobBoardsProviderOptions
): Promise<PublicBoardPosting[]> {
  const url = `https://www.workable.com/api/accounts/${encodeURIComponent(source.key)}?details=true`;
  const payload = await fetchJsonWithRetries<WorkableJobsResponse>(url, options);
  const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];

  return jobs
    .map((job) => ({
      title: String(job?.title || job?.full_title || "").trim(),
      location: String(
        job?.location?.location_str ||
        [job?.location?.city, job?.location?.region, job?.location?.country].filter(Boolean).join(", ")
      ).trim(),
      country: String(job?.location?.country_code || job?.location?.country || "").trim(),
      sourceLabel: getSourceLabel(source)
    }))
    .filter((job) => job.title);
}

async function fetchSourcePostings(
  source: PublicJobBoardSourceConfig,
  options: PublicJobBoardsProviderOptions
) {
  if (source.provider === "greenhouse") {
    return fetchGreenhousePostings(source, options);
  }
  if (source.provider === "lever") {
    return fetchLeverPostings(source, options);
  }
  if (source.provider === "ashby") {
    return fetchAshbyPostings(source, options);
  }
  if (source.provider === "smartrecruiters") {
    return fetchSmartRecruitersPostings(source, options);
  }
  return fetchWorkablePostings(source, options);
}

async function ensureConfig(configPath: string) {
  let config = await readJsonFile<PublicJobBoardsConfigFile>(configPath);
  if (!config?.sources?.length) {
    config = getDefaultConfig();
    await writeJsonFile(configPath, config);
  }
  return config;
}

function mapPostingToSocCode(
  title: string,
  onet: OnetData,
  allowedCodes: Set<string>,
  minMatchScore: number
) {
  const detailedMatch = findDetailedSocOccupation(onet, title);
  if (detailedMatch?.occupation?.code && allowedCodes.has(detailedMatch.occupation.code) && detailedMatch.score >= minMatchScore) {
    return detailedMatch.occupation.code;
  }

  const fallbackMatch = findOnetOccupation(onet, title);
  const detailedCode = toDetailedSocCode(fallbackMatch?.occupation?.code || "");
  if (detailedCode && allowedCodes.has(detailedCode) && Number(fallbackMatch?.score || 0) >= minMatchScore) {
    return detailedCode;
  }

  return "";
}

export function getPublicJobBoardsProviderOptions(
  historyPath: string,
  configPath: string,
  useExistingHistoryOnly: boolean
) {
  const args = parseCliArgs(process.argv.slice(2));
  return {
    configPath:
      getStringArg(args, "publicJobBoardsConfigPath", "publicjobboardsconfigpath") ||
      configPath,
    historyPath:
      getStringArg(args, "publicJobBoardsHistoryPath", "publicjobboardshistorypath") ||
      historyPath,
    timeoutSeconds: getNumberArg(args, ["publicJobBoardsTimeoutSeconds", "publicjobboardstimeoutseconds"], 30),
    retryCount: getNumberArg(args, ["publicJobBoardsRetryCount", "publicjobboardsretrycount"], 3),
    retryDelaySeconds: getNumberArg(args, ["publicJobBoardsRetryDelaySeconds", "publicjobboardsretrydelayseconds"], 2),
    minMatchScore: getNumberArg(args, ["publicJobBoardsMinMatchScore", "publicjobboardsminmatchscore"], 0.44),
    useExistingHistoryOnly
  } satisfies PublicJobBoardsProviderOptions;
}

export async function rebuildPublicJobBoardsHistory(
  occupations: PublicJobBoardsOccupationSeed[],
  onet: OnetData,
  options: PublicJobBoardsProviderOptions
) {
  const config = await ensureConfig(options.configPath);
  const existing = await readJsonFile<PublicJobBoardsHistoryFile>(options.historyPath);

  if (options.useExistingHistoryOnly) {
    return existing;
  }

  const enabledSources = (config.sources || []).filter((source) => source.enabled !== false && source.key && source.organization);
  if (!enabledSources.length) {
    writeStep("Public job boards source skipped (no enabled board sources)");
    return existing;
  }

  const today = toIsoDate();
  const seedHistory: PublicJobBoardsHistoryFile = existing || {
    source: config.source || "Public job boards (Greenhouse + Lever + Ashby + SmartRecruiters)",
    lastRun: today,
    locationScope: config.locationScope || "US",
    minMatchScore: Number(config.minMatchScore || options.minMatchScore || 0.44),
    activeSources: [],
    occupations: []
  };

  const existingIndex = new Map<string, PublicJobBoardsHistoryOccupationEntry>();
  for (const entry of seedHistory.occupations || []) {
    existingIndex.set(entry.socCode, {
      socCode: entry.socCode,
      title: entry.title,
      majorGroup: entry.majorGroup,
      daily: Array.isArray(entry.daily) ? entry.daily : []
    });
  }

  const occupationIndex = new Map(occupations.map((entry) => [entry.socCode, entry]));
  const allowedCodes = new Set(occupations.map((entry) => entry.socCode));
  const countsBySoc = new Map<string, Record<string, number>>();
  const effectiveMinMatchScore = Number(config.minMatchScore || options.minMatchScore || 0.44);

  writeStep(`Loading public job boards for ${enabledSources.length} configured sources`);

  for (const source of enabledSources) {
    const sourceLabel = getSourceLabel(source);
    try {
      const postings = await fetchSourcePostings(source, options);
      writeStep(`Public board ${source.organization}: fetched ${postings.length} open postings`);

      for (const posting of postings) {
        if (source.usOnly !== false && !isLikelyUsLocation(posting.location, posting.country)) {
          continue;
        }

        if (shouldExcludePosting(posting.title)) {
          continue;
        }

        const socCode = mapPostingToSocCode(posting.title, onet, allowedCodes, effectiveMinMatchScore);
        if (!socCode) {
          continue;
        }

        countsBySoc.set(socCode, countsBySoc.get(socCode) || {});
        const sourceCounts = countsBySoc.get(socCode)!;
        sourceCounts[sourceLabel] = (sourceCounts[sourceLabel] || 0) + 1;
      }
    } catch (error) {
      console.warn(
        `Public board warning for ${source.organization}: ${
          error instanceof Error ? error.message : String(error)
        }. Falling back to previous source counts.`
      );

      for (const occupation of occupations) {
        const fallback = getLatestKnownSourceCounts(existingIndex.get(occupation.socCode), sourceLabel);
        if (!fallback) continue;
        countsBySoc.set(occupation.socCode, countsBySoc.get(occupation.socCode) || {});
        const sourceCounts = countsBySoc.get(occupation.socCode)!;
        sourceCounts[sourceLabel] = (sourceCounts[sourceLabel] || 0) + fallback;
      }
    }
  }

  const codesToPersist = new Set<string>([
    ...existingIndex.keys(),
    ...countsBySoc.keys()
  ]);

  for (const socCode of codesToPersist) {
    const occupation = occupationIndex.get(socCode);
    const existingEntry = existingIndex.get(socCode) || {
      socCode,
      title: occupation?.title || socCode,
      majorGroup: occupation?.majorGroup || "Other",
      daily: []
    };

    if (occupation) {
      existingEntry.title = occupation.title;
      existingEntry.majorGroup = occupation.majorGroup;
    }

    const sources = { ...(countsBySoc.get(socCode) || {}) };
    const count = Object.values(sources).reduce((sum, value) => sum + Number(value || 0), 0);
    existingEntry.daily = (existingEntry.daily || []).filter((point) => point.date !== today);
    if (count > 0) {
      existingEntry.daily.push({
        date: today,
        count,
        sources
      });
    }
    existingIndex.set(socCode, existingEntry);
  }

  seedHistory.source = config.source || "Public job boards (Greenhouse + Lever + Ashby + SmartRecruiters)";
  seedHistory.lastRun = today;
  seedHistory.locationScope = config.locationScope || "US";
  seedHistory.minMatchScore = effectiveMinMatchScore;
  seedHistory.activeSources = enabledSources.map((source) => ({
    label: getSourceLabel(source),
    provider: source.provider,
    key: source.key,
    organization: source.organization,
    kind: source.kind || "company"
  }));
  seedHistory.occupations = [...existingIndex.values()]
    .filter((entry) => Array.isArray(entry.daily) && entry.daily.length)
    .sort((left, right) => left.socCode.localeCompare(right.socCode));

  await writeJsonFile(options.historyPath, seedHistory);
  return seedHistory;
}
