$ErrorActionPreference = "Stop"

param(
  [Parameter(Mandatory = $true)][string]$AllowedPrefix,
  [Parameter(Mandatory = $false)][string]$BaselineUntrackedFile
)

function Fail([string]$message) {
  Write-Host "[check_diff_allowed] FAIL: $message"
  exit 1
}

Write-Host "[check_diff_allowed] Allowed prefix: $AllowedPrefix"

$changed = @(git diff --name-only)
foreach ($p in $changed) {
  if ([string]::IsNullOrWhiteSpace($p)) { continue }
  if (-not $p.StartsWith($AllowedPrefix)) {
    Fail "git diff has paths outside allowed prefix: $p"
  }
}

$status = @(git status --porcelain)
$outsideUntracked = @()
foreach ($line in $status) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $code = $line.Substring(0, 2)
  if ($code -ne "??") { continue }
  $p = $line.Substring(3)
  if (-not $p.StartsWith($AllowedPrefix)) {
    $outsideUntracked += $p
  }
}

if ($outsideUntracked.Count -gt 0) {
  if (-not $BaselineUntrackedFile -or -not (Test-Path $BaselineUntrackedFile)) {
    Fail ("untracked files exist outside allowed prefix and no baseline file provided.`n" + ($outsideUntracked -join "`n"))
  }

  $baseline = @{}
  foreach ($p in Get-Content $BaselineUntrackedFile) {
    if ([string]::IsNullOrWhiteSpace($p)) { continue }
    $baseline[$p] = $true
  }

  $newOutside = @()
  foreach ($p in $outsideUntracked) {
    if (-not $baseline.ContainsKey($p)) { $newOutside += $p }
  }

  if ($newOutside.Count -gt 0) {
    Fail ("new untracked files outside allowed prefix (not in baseline):`n" + ($newOutside -join "`n"))
  }
}

Write-Host "[check_diff_allowed] OK"

