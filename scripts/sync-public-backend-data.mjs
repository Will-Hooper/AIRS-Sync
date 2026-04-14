import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(repoRoot, "backend", "data");
const targetDir = path.join(repoRoot, "public", "backend", "data");

async function main() {
  await fs.mkdir(targetDir, { recursive: true });

  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !entry.name.endsWith(".example.json"))
    .map((entry) => entry.name)
    .sort();

  await Promise.all(
    files.map((file) => fs.copyFile(path.join(sourceDir, file), path.join(targetDir, file)))
  );

  console.log(`Synced ${files.length} JSON files to public/backend/data`);
  files.forEach((file) => console.log(`- ${file}`));
}

main().catch((error) => {
  console.error("Failed to sync public backend data.");
  console.error(error);
  process.exitCode = 1;
});
