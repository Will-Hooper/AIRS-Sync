import { createReadStream } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import AdmZip from "adm-zip";
import { parse as parseCsv } from "csv-parse";
import {
  getStringArg,
  normalizeText,
  parseCliArgs,
  writeJsonFile,
  writeStep
} from "./lib/common";

interface CollegeScorecardOptions {
  downloadUrl: string;
  zipPath: string;
  extractDir: string;
  outputPath: string;
  summaryPath: string;
}

interface CollegeScorecardProgramRecord {
  unitId: string;
  opeid6: string;
  institution: string;
  control: string;
  mainCampus: boolean;
  cipCode: string;
  cipDesc: string;
  credentialCode: string;
  credential: string;
  completionCount: number | null;
  earningsMedian1Y: number | null;
  earningsMedian2Y: number | null;
  debtMedian: number | null;
}

interface CollegeScorecardSummaryRecord {
  cipCode: string;
  cipDesc: string;
  programCount: number;
  institutionCount: number;
  median1Y: number | null;
  median2Y: number | null;
}

interface CollegeScorecardProgramsFile {
  source: string;
  updatedAt: string;
  rowCount: number;
  programCount: number;
  institutionCount: number;
  programs: CollegeScorecardProgramRecord[];
}

interface CollegeScorecardSummaryFile {
  source: string;
  updatedAt: string;
  cipSummary: CollegeScorecardSummaryRecord[];
}

const DEFAULT_DOWNLOAD_URL =
  "https://data.ed.gov/dataset/9dc70e6b-8426-4d71-b9d5-70ce6094a3f4/resource/ff68afc4-6d23-459d-9f60-4006e4f85583/download/most-recent-cohorts-field-of-study_04192023.zip";

const execFileAsync = promisify(execFile);

function toIsoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function toNumberOrNull(value: string | undefined) {
  const text = String(value || "").trim();
  if (!text || /privacysuppressed|null|n\/a/i.test(text)) {
    return null;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function toCompletionCount(row: Record<string, string>) {
  const one = toNumberOrNull(row.IPEDSCOUNT1);
  const two = toNumberOrNull(row.IPEDSCOUNT2);
  if (one === null && two === null) {
    return null;
  }
  return Math.max(Number(one || 0), Number(two || 0));
}

function getControlLabel(value: string) {
  const raw = String(value || "").trim();
  if (raw === "1" || normalizeText(raw) === "public") return "Public";
  if (raw === "2") return "Private nonprofit";
  if (raw === "3") return "Private for-profit";
  return raw || "Unknown";
}

async function ensureDownloadedZip(options: CollegeScorecardOptions) {
  await mkdir(path.dirname(options.zipPath), { recursive: true });
  const response = await fetch(options.downloadUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
      "Accept": "application/zip,application/octet-stream,*/*",
      "Referer": "https://catalog.data.gov/"
    }
  });
  if (response.ok) {
    const arrayBuffer = await response.arrayBuffer();
    await writeFile(options.zipPath, Buffer.from(arrayBuffer));
    return;
  }

  const downloadCommand = [
    "$ProgressPreference='SilentlyContinue'",
    `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12`,
    `Invoke-WebRequest -Uri '${options.downloadUrl.replace(/'/g, "''")}' -OutFile '${options.zipPath.replace(/'/g, "''")}' -UseBasicParsing`
  ].join("; ");

  try {
    await execFileAsync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", downloadCommand], {
      windowsHide: true
    });
    return;
  } catch (error) {
    throw new Error(
      `College Scorecard download failed: ${response.status}. ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function extractCsv(options: CollegeScorecardOptions) {
  await rm(options.extractDir, { recursive: true, force: true });
  await mkdir(options.extractDir, { recursive: true });
  const zip = new AdmZip(options.zipPath);
  zip.extractAllTo(options.extractDir, true);
  const entries = zip.getEntries().map((entry) => entry.entryName);
  const csvName = entries.find((entry) => entry.toLowerCase().endsWith(".csv"));
  if (!csvName) {
    throw new Error("College Scorecard ZIP missing CSV payload.");
  }
  return path.join(options.extractDir, csvName);
}

function getMedian(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }
  return sorted[middle];
}

async function buildOutputs(csvPath: string, options: CollegeScorecardOptions) {
  const programs: CollegeScorecardProgramRecord[] = [];
  const cipAgg = new Map<
    string,
    { cipDesc: string; institutions: Set<string>; oneYear: number[]; twoYear: number[]; count: number }
  >();

  let rowCount = 0;
  const parser = createReadStream(csvPath).pipe(parseCsv({ columns: true, relax_column_count: true, bom: true }));

  for await (const row of parser) {
    rowCount += 1;
    const earningsMedian1Y = toNumberOrNull(row.EARN_MDN_HI_1YR);
    const earningsMedian2Y = toNumberOrNull(row.EARN_MDN_HI_2YR);

    if (earningsMedian1Y === null && earningsMedian2Y === null) {
      continue;
    }

    const program: CollegeScorecardProgramRecord = {
      unitId: String(row.UNITID || "").trim(),
      opeid6: String(row.OPEID6 || "").trim(),
      institution: String(row.INSTNM || "").trim(),
      control: getControlLabel(String(row.CONTROL || "").trim()),
      mainCampus: String(row.MAIN || "").trim() === "1",
      cipCode: String(row.CIPCODE || "").trim(),
      cipDesc: String(row.CIPDESC || "").trim(),
      credentialCode: String(row.CREDLEV || "").trim(),
      credential: String(row.CREDDESC || "").trim(),
      completionCount: toCompletionCount(row),
      earningsMedian1Y,
      earningsMedian2Y,
      debtMedian: toNumberOrNull(row.DEBT_ALL_STGP_ANY_MDN) ?? toNumberOrNull(row.DEBT_ALL_PP_ANY_MDN)
    };

    programs.push(program);

    const key = program.cipCode;
    if (!cipAgg.has(key)) {
      cipAgg.set(key, {
        cipDesc: program.cipDesc,
        institutions: new Set<string>(),
        oneYear: [],
        twoYear: [],
        count: 0
      });
    }

    const agg = cipAgg.get(key)!;
    agg.cipDesc = agg.cipDesc || program.cipDesc;
    agg.count += 1;
    agg.institutions.add(program.unitId);
    if (program.earningsMedian1Y !== null) agg.oneYear.push(program.earningsMedian1Y);
    if (program.earningsMedian2Y !== null) agg.twoYear.push(program.earningsMedian2Y);
  }

  programs.sort((left, right) => {
    const institutionCompare = left.institution.localeCompare(right.institution);
    if (institutionCompare !== 0) return institutionCompare;
    const cipCompare = left.cipCode.localeCompare(right.cipCode);
    if (cipCompare !== 0) return cipCompare;
    return left.credential.localeCompare(right.credential);
  });

  const programFile: CollegeScorecardProgramsFile = {
    source: "U.S. Department of Education College Scorecard (Field of Study)",
    updatedAt: toIsoDate(),
    rowCount,
    programCount: programs.length,
    institutionCount: new Set(programs.map((entry) => entry.unitId)).size,
    programs
  };

  const summaryFile: CollegeScorecardSummaryFile = {
    source: "U.S. Department of Education College Scorecard (Field of Study)",
    updatedAt: toIsoDate(),
    cipSummary: [...cipAgg.entries()]
      .map(([cipCode, agg]) => ({
        cipCode,
        cipDesc: agg.cipDesc,
        programCount: agg.count,
        institutionCount: agg.institutions.size,
        median1Y: getMedian(agg.oneYear),
        median2Y: getMedian(agg.twoYear)
      }))
      .sort((left, right) => left.cipCode.localeCompare(right.cipCode))
  };

  await writeJsonFile(options.outputPath, programFile);
  await writeJsonFile(options.summaryPath, summaryFile);

  return {
    rowCount,
    programCount: programFile.programCount,
    institutionCount: programFile.institutionCount,
    cipCount: summaryFile.cipSummary.length
  };
}

function getOptions() {
  const args = parseCliArgs(process.argv.slice(2));
  const dataDir = path.resolve(process.cwd(), "backend", "data");
  const tempDir = path.join(process.cwd(), ".tmp_scorecard_sync");

  return {
    downloadUrl: getStringArg(args, "downloadUrl", "downloadurl") || DEFAULT_DOWNLOAD_URL,
    zipPath: getStringArg(args, "zipPath", "zippath") || path.join(tempDir, "field-of-study.zip"),
    extractDir: getStringArg(args, "extractDir", "extractdir") || path.join(tempDir, "unzipped"),
    outputPath: getStringArg(args, "outputPath", "outputpath") || path.join(dataDir, "college_scorecard_programs.json"),
    summaryPath: getStringArg(args, "summaryPath", "summarypath") || path.join(dataDir, "college_scorecard_cip_summary.json")
  } satisfies CollegeScorecardOptions;
}

async function main() {
  const options = getOptions();
  writeStep("Downloading College Scorecard field-of-study data");
  await ensureDownloadedZip(options);
  writeStep("Extracting College Scorecard ZIP");
  const csvPath = await extractCsv(options);
  writeStep("Building compact university-major outcomes dataset");
  const result = await buildOutputs(csvPath, options);
  await rm(path.dirname(options.zipPath), { recursive: true, force: true });
  console.log(
    `College Scorecard sync complete. Programs: ${result.programCount}. Institutions: ${result.institutionCount}. CIP groups: ${result.cipCount}.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
