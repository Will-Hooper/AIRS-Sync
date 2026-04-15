import {
  CHINA_P0_SEARCH_SEEDS,
  CHINA_P05_SEARCH_SEEDS,
  COMMON_OCCUPATION_SEARCH_SEEDS,
  type OccupationSearchSeedAliasInput,
  type OccupationSearchSeedEntry
} from "../frontend/src/lib/occupation-search-seeds";
import { normalizeOccupationQuery } from "../frontend/src/lib/occupation-search";

interface AliasCheckRow {
  entryId: string;
  label: string;
  occupationId: string;
  alias: string;
  aliasNormalized: string;
  aliasType: string;
  weight: number | null;
}

function toAliasRows(entry: OccupationSearchSeedEntry) {
  const values: Array<string | OccupationSearchSeedAliasInput> = [{ alias: entry.label, aliasType: "official", weight: 100 }, ...entry.aliases];

  return values.map((value) => {
    const alias = typeof value === "string" ? value.trim() : String(value.alias || "").trim();
    const aliasType = typeof value === "string" ? "implicit" : value.aliasType || "implicit";
    const weight = typeof value === "string" ? null : (Number.isFinite(value.weight) ? Number(value.weight) : null);

    return {
      entryId: entry.id,
      label: entry.label,
      occupationId: entry.occupationId,
      alias,
      aliasNormalized: normalizeOccupationQuery(alias),
      aliasType,
      weight
    } satisfies AliasCheckRow;
  });
}

function main() {
  const entries = [...COMMON_OCCUPATION_SEARCH_SEEDS, ...CHINA_P0_SEARCH_SEEDS, ...CHINA_P05_SEARCH_SEEDS];
  const rows = entries.flatMap(toAliasRows);
  const errors: string[] = [];
  const warnings: string[] = [];

  const rowsByEntry = new Map<string, AliasCheckRow[]>();
  rows.forEach((row) => {
    const current = rowsByEntry.get(row.entryId) || [];
    current.push(row);
    rowsByEntry.set(row.entryId, current);

    if (!row.alias) {
      errors.push(`[empty-alias] ${row.entryId} has an empty alias.`);
    }

    if (!row.aliasNormalized) {
      errors.push(`[empty-normalized] ${row.entryId} alias "${row.alias}" normalizes to empty.`);
    }

    if (row.weight !== null && (row.weight < 1 || row.weight > 100)) {
      errors.push(`[invalid-weight] ${row.entryId} alias "${row.alias}" has invalid weight ${row.weight}.`);
    }
  });

  rowsByEntry.forEach((entryRows, entryId) => {
    const seen = new Map<string, AliasCheckRow>();
    entryRows.forEach((row) => {
      const existing = seen.get(row.aliasNormalized);
      if (existing) {
        warnings.push(
          `[duplicate-alias] ${entryId} repeats normalized alias "${row.aliasNormalized}" via "${existing.alias}" and "${row.alias}".`
        );
        return;
      }
      seen.set(row.aliasNormalized, row);
    });
  });

  const rowsByNormalized = new Map<string, AliasCheckRow[]>();
  rows.forEach((row) => {
    const current = rowsByNormalized.get(row.aliasNormalized) || [];
    current.push(row);
    rowsByNormalized.set(row.aliasNormalized, current);
  });

  rowsByNormalized.forEach((aliasRows, normalized) => {
    const occupationIds = [...new Set(aliasRows.map((row) => row.occupationId))];
    if (occupationIds.length <= 1) return;

    warnings.push(
      `[cross-occupation-alias] "${normalized}" points to multiple occupations: ${aliasRows
        .map((row) => `${row.entryId}:${row.alias}`)
        .join(", ")}`
    );
  });

  console.log(`Checked ${entries.length} seed entries and ${rows.length} normalized aliases.`);

  if (warnings.length) {
    console.log("");
    console.log("Warnings");
    warnings.forEach((warning) => console.log(`- ${warning}`));
  }

  if (errors.length) {
    console.log("");
    console.log("Errors");
    errors.forEach((error) => console.log(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log("No blocking seed issues found.");
}

main();
