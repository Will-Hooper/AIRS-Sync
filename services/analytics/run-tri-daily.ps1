param(
  [string]$Workdir = "E:\Codex"
)

Push-Location $Workdir
try {
  npm run build:node
  npm run analytics:report
  npm run analytics:email
} finally {
  Pop-Location
}
