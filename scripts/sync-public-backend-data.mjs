import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(repoRoot, "backend", "data");
const targetDir = path.join(repoRoot, "public", "backend", "data");

const ALLOWED_FILES = [
  "airs_baseline.json",
  "airs_data.json",
  "college_scorecard_cip_summary.json",
  "public_jobboards_history.json",
  "public_jobboards_sources.json",
  "soc_detailed_master.json",
  "usajobs_history.json",
  "usajobs_soc_map.json",
];

async function main() {
  await fs.mkdir(targetDir, { recursive: true });

  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const files = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".json") &&
        !entry.name.endsWith(".example.json") &&
        ALLOWED_FILES.includes(entry.name)
    )
    .map((entry) => entry.name)
    .sort();

  await Promise.all(
    files.map((file) =>
      fs.copyFile(path.join(sourceDir, file), path.join(targetDir, file))
    )
  );

  const airsDataStats = await fs.stat(path.join(sourceDir, "airs_data.json"));
  await fs.writeFile(
    path.join(targetDir, "airs_data.meta.json"),
    `${JSON.stringify(
      {
        fileName: "airs_data.json",
        updatedAt: airsDataStats.mtime.toISOString(),
        size: airsDataStats.size
      },
      null,
      2
    )}\n`
  );

  const oversizedFile = path.join(targetDir, "college_scorecard_programs.json");
  try {
    await fs.unlink(oversizedFile);
  } catch {}

  console.log(`Synced ${files.length} JSON files to public/backend/data`);
  files.forEach((file) => console.log(`- ${file}`));
  console.log("- airs_data.meta.json");
}

main().catch((error) => {
  console.error("Failed to sync public backend data.");
  console.error(error);
  process.exitCode = 1;
});
