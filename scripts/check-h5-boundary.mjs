import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const frontendSrcRoot = path.join(projectRoot, "frontend", "src");
const h5Root = path.join(frontendSrcRoot, "h5");

const allowedSharedFiles = new Set([
  path.join(frontendSrcRoot, "lib", "api.ts"),
  path.join(frontendSrcRoot, "lib", "analytics.ts"),
  path.join(frontendSrcRoot, "lib", "format.ts"),
  path.join(frontendSrcRoot, "lib", "types.ts")
]);
const allowedSharedRoots = [
  path.join(frontendSrcRoot, "shared")
];

const importPattern = /\b(?:import|export)\b[\s\S]*?\bfrom\s*["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".css"];

function collectFiles(root, predicate) {
  const results = [];
  const queue = [root];

  while (queue.length) {
    const current = queue.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    entries.forEach((entry) => {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        return;
      }
      if (predicate(fullPath)) {
        results.push(fullPath);
      }
    });
  }

  return results;
}

function tryResolveImport(sourceFile, specifier) {
  if (!specifier.startsWith(".")) return null;

  const basePath = path.resolve(path.dirname(sourceFile), specifier);
  const candidates = [
    basePath,
    ...sourceExtensions.map((extension) => `${basePath}${extension}`),
    ...sourceExtensions.map((extension) => path.join(basePath, `index${extension}`))
  ];

  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || null;
}

function extractImports(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const imports = [];
  let match;

  while ((match = importPattern.exec(content))) {
    const specifier = match[1] || match[2];
    if (specifier) imports.push(specifier);
  }

  return imports;
}

function isInside(targetPath, rootPath) {
  const relativePath = path.relative(rootPath, targetPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function isAllowedSharedImport(resolvedPath) {
  return allowedSharedFiles.has(resolvedPath) || allowedSharedRoots.some((rootPath) => isInside(resolvedPath, rootPath));
}

function relativeToProject(filePath) {
  return path.relative(projectRoot, filePath).replaceAll("\\", "/");
}

function validateH5Imports(files) {
  const errors = [];

  files.forEach((filePath) => {
    extractImports(filePath).forEach((specifier) => {
      const resolvedPath = tryResolveImport(filePath, specifier);
      if (!resolvedPath) return;
      if (!isInside(resolvedPath, frontendSrcRoot)) return;
      if (isInside(resolvedPath, h5Root)) return;
      if (isAllowedSharedImport(resolvedPath)) return;

      errors.push(
        `${relativeToProject(filePath)} imports disallowed desktop-side module ${relativeToProject(resolvedPath)}`
      );
    });
  });

  return errors;
}

function validateDesktopImports(files) {
  const errors = [];

  files.forEach((filePath) => {
    extractImports(filePath).forEach((specifier) => {
      const resolvedPath = tryResolveImport(filePath, specifier);
      if (!resolvedPath) return;
      if (!isInside(resolvedPath, h5Root)) return;

      errors.push(
        `${relativeToProject(filePath)} imports H5 module ${relativeToProject(resolvedPath)}`
      );
    });
  });

  return errors;
}

const h5SourceFiles = collectFiles(h5Root, (filePath) => [".ts", ".tsx", ".css"].includes(path.extname(filePath)));
const desktopSourceFiles = collectFiles(frontendSrcRoot, (filePath) => {
  if (![".ts", ".tsx"].includes(path.extname(filePath))) return false;
  return !isInside(filePath, h5Root);
});

const errors = [
  ...validateH5Imports(h5SourceFiles),
  ...validateDesktopImports(desktopSourceFiles)
];

if (errors.length) {
  console.error("H5 boundary check failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("H5 boundary check passed.");
