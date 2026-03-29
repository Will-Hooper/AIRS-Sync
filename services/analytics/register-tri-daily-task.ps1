param(
  [string]$TaskName = "AIRS Analytics 3-Day Report",
  [string]$StartTime = "09:00",
  [string]$Workdir = "E:\Codex"
)

$scriptPath = Join-Path $Workdir "services\analytics\run-tri-daily.ps1"
$taskCommand = "powershell -ExecutionPolicy Bypass -File `"$scriptPath`" -Workdir `"$Workdir`""

schtasks /Create /TN $TaskName /SC DAILY /MO 3 /ST $StartTime /TR $taskCommand /F
Write-Host "Scheduled task registered: $TaskName"
