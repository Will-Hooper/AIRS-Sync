param(
  [string]$Workdir = "E:\Codex"
)

Push-Location $Workdir
try {
  $env:ANALYTICS_REPORT_TO = "airsindex@qq.com"
  npm run build:node
  npm run analytics:report
  npm run analytics:email
} finally {
  Pop-Location
}
