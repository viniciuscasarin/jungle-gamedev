$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
$reportHome = $PSScriptRoot
$workspace = (Resolve-Path (Join-Path $reportHome '../../..')).Path
$checks = [Collections.Generic.List[object]]::new()
function Check([string]$name, [bool]$condition) {
  $checks.Add([pscustomobject]@{ name = $name; passed = $condition })
  if (-not $condition) { throw "Evidence audit failed: $name" }
}
function Read-ZipJson($zip, [string]$name) {
  $reader = [IO.StreamReader]::new($zip.GetEntry($name).Open())
  try { return $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
}
$html = Get-Content -Raw -LiteralPath (Join-Path $reportHome 'playwright-report/index.html')
$base64 = [regex]::Match($html, '<template id="playwrightReportBase64">data:application/zip;base64,([^<]+)</template>').Groups[1].Value
$zip = [IO.Compression.ZipArchive]::new([IO.MemoryStream]::new([Convert]::FromBase64String($base64)))
try {
  $report = Read-ZipJson $zip 'report.json'
  $tests = @($report.files | ForEach-Object { (Read-ZipJson $zip ($_.fileId + '.json')).tests })
  Check 'Original HTML: 34 expected, zero unexpected/flaky/skipped/errors' ($report.stats.total -eq 34 -and $report.stats.expected -eq 34 -and $report.stats.unexpected -eq 0 -and $report.stats.flaky -eq 0 -and $report.stats.skipped -eq 0 -and $report.stats.ok -and @($report.errors).Count -eq 0)
  Check 'Original HTML: all detailed tests expected' (@($tests).Count -eq 34 -and @($tests | Where-Object { -not $_.ok -or $_.outcome -ne 'expected' }).Count -eq 0)
  foreach ($project in 'dev','preview') { Check "$project has 17 tests" (@($tests | Where-Object projectName -eq $project).Count -eq 17) }
  $pngAttachments = 0
  $jsonAttachments = 0
  $latestImages = @{}
  $reusedImageLabels = @()
  foreach ($test in $tests) {
    foreach ($result in $test.results) {
      foreach ($attachment in $result.attachments) {
        if ($attachment.contentType -eq 'image/png') {
          $pngAttachments++
          $original = Join-Path $reportHome ('playwright-report/' + $attachment.path)
          $extracted = Join-Path $reportHome ('browser-evidence/' + $test.projectName + '-' + $attachment.name + '.png')
          Check ($test.projectName + ' original image ' + $attachment.name) (Test-Path -LiteralPath $original)
          if ($latestImages.ContainsKey($extracted)) { $reusedImageLabels += $test.projectName + '-' + $attachment.name }
          $latestImages[$extracted] = $original
        } elseif ($attachment.contentType -eq 'application/json') {
          if ($attachment.name -eq 'console-issues') { Check ($test.projectName + ' console ' + $test.title) ($attachment.body.Trim() -eq '[]') }
          else {
            $jsonAttachments++
            $extracted = Join-Path $reportHome ('browser-evidence/' + $test.projectName + '-' + $attachment.name + '.json')
            Check ($test.projectName + ' JSON ' + $attachment.name) ((Test-Path -LiteralPath $extracted) -and (Get-Content -Raw -LiteralPath $extracted).Trim() -eq $attachment.body.Trim())
          }
        }
      }
    }
  }
  foreach ($extracted in $latestImages.Keys) {
    Check ('Latest extracted image ' + [IO.Path]::GetFileName($extracted)) ((Test-Path -LiteralPath $extracted) -and (Get-FileHash -LiteralPath $latestImages[$extracted]).Hash -eq (Get-FileHash -LiteralPath $extracted).Hash)
  }
} finally { $zip.Dispose() }
$cycles = @()
foreach ($project in 'dev','preview') {
  $data = Get-Content -Raw -LiteralPath (Join-Path $reportHome "browser-evidence/$project-lifecycle-five-cycles.json") | ConvertFrom-Json
  Check "$project five mixed cycles" ($data.cycles.Count -eq 5)
  foreach ($cycle in $data.cycles) {
    $removed = $cycle.removed
    foreach ($key in 'applications','resources','subscriptions','inputListeners','canvases','observers','resize','density','frames') { Check "$project cycle $($cycle.cycle) removed $key" ($removed.$key -eq 0) }
    Check "$project cycle $($cycle.cycle) menu clean and cache stable" ($null -eq $removed.navigation -and $removed.cache.leases -eq 0 -and $removed.cache.textures -eq 31 -and -not $removed.cache.pending -and $removed.nativeInput -eq 8 -and $removed.nativeInput -eq $data.baseline.nativeInput)
    Check "$project cycle $($cycle.cycle) terminal stops frames" ($cycle.completed.frames -eq 0 -and $cycle.completed.navigation.snapshot.state -eq 'completed')
    $fresh = $cycle.fresh
    Check "$project cycle $($cycle.cycle) single replay owner" ($fresh.applications -eq 1 -and $fresh.resources -eq 1 -and $fresh.subscriptions -eq 1 -and $fresh.canvases -eq 1 -and $fresh.inputListeners -eq 7 -and $fresh.observers -eq 2 -and $fresh.resize -eq 1 -and $fresh.density -eq 1)
    Check "$project cycle $($cycle.cycle) replay starts clean" ($fresh.navigation.snapshot.score -eq 0 -and $fresh.navigation.snapshot.player.health -eq 100 -and $fresh.navigation.snapshot.enemies.Count -eq 0 -and $fresh.navigation.snapshot.projectiles.Count -eq 0 -and $fresh.navigation.snapshot.reservations.Count -eq 0 -and -not $fresh.navigation.snapshot.autoSailEnabled)
  }
  $timer = Get-Content -Raw -LiteralPath (Join-Path $reportHome "browser-evidence/$project-lifecycle-timer-replay.json") | ConvertFrom-Json
  Check "$project exact real-engine 60s terminal" ($timer.terminal.snapshot.step -eq 3600 -and $timer.terminal.snapshot.activeTimeMs -eq 60000 -and $timer.terminal.snapshot.score -eq 0 -and $timer.persisted.data.endReason -eq 'time_expired' -and $timer.persisted.data.configuration.options.sessionDurationMs -eq 60000)
  Check "$project new replay ID/current options/history" ($timer.firstId -ne $timer.replayId -and $timer.persisted.data.matchId -eq $timer.firstId -and $timer.replay.setup.configuration.options.sessionDurationMs -eq 180000 -and $timer.replay.setup.configuration.options.enemySpawnIntervalMs -eq 10000 -and $timer.replay.snapshot.activeTimeMs -lt 200 -and $timer.replay.target -eq $null)
  $death = Get-Content -Raw -LiteralPath (Join-Path $reportHome "browser-evidence/$project-lifecycle-ai-death.json") | ConvertFrom-Json
  Check "$project AI death and pause" ($death.dead.snapshot.state -eq 'completed' -and $death.dead.snapshot.player.health -eq 0 -and $death.dead.snapshot.activeTimeMs -gt 0 -and $death.dead.snapshot.activeTimeMs -lt 120000 -and $death.paused.snapshot.state -eq 'paused' -and $death.paused.target -eq $null -and -not $death.paused.snapshot.autoSailEnabled)
  $cycles += [pscustomobject]@{project=$project; count=$data.cycles.Count; baselineNativeInput=$data.baseline.nativeInput; cacheTextures=$data.baseline.cache.textures; aiDeathActiveMs=$death.dead.snapshot.activeTimeMs}
}
$specs = @(Get-ChildItem -LiteralPath (Join-Path $workspace 'openspec/changes/implement-match-lifecycle/specs') -Filter spec.md -Recurse | ForEach-Object {
  $content = Get-Content -Raw -LiteralPath $_.FullName
  [pscustomobject]@{capability=$_.Directory.Name;requirements=[regex]::Matches($content,'(?m)^### Requirement:').Count;scenarios=[regex]::Matches($content,'(?m)^#### Scenario:').Count}
})
Check 'Seven deltas, nineteen requirements, forty-nine scenarios' ($specs.Count -eq 7 -and ($specs | Measure-Object requirements -Sum).Sum -eq 19 -and ($specs | Measure-Object scenarios -Sum).Sum -eq 49)
$baselineScenarios = @()
foreach ($spec in $specs) {
  $mainPath = Join-Path $workspace ('openspec/specs/' + $spec.capability + '/spec.md')
  if (-not (Test-Path -LiteralPath $mainPath)) { continue }
  $main = Get-Content -Raw -LiteralPath $mainPath
  $delta = Get-Content -Raw -LiteralPath (Join-Path $workspace ('openspec/changes/implement-match-lifecycle/specs/' + $spec.capability + '/spec.md'))
  foreach ($requirement in [regex]::Matches($delta, '(?ms)^### Requirement: ([^\r\n]+)\r?\n(.*?)(?=^### Requirement:|^## |\z)')) {
    $name = $requirement.Groups[1].Value
    $original = [regex]::Match($main, '(?ms)^### Requirement: ' + [regex]::Escape($name) + '\r?\n(.*?)(?=^### Requirement:|\z)')
    if (-not $original.Success) { continue }
    $oldNames = @([regex]::Matches($original.Value, '(?m)^#### Scenario: ([^\r\n]+)') | ForEach-Object { $_.Groups[1].Value })
    $newNames = @([regex]::Matches($requirement.Value, '(?m)^#### Scenario: ([^\r\n]+)') | ForEach-Object { $_.Groups[1].Value })
    Check ('Preserved baseline scenarios: ' + $spec.capability + ' / ' + $name) (@($oldNames | Where-Object { $_ -notin $newNames }).Count -eq 0)
    $baselineScenarios += [pscustomobject]@{capability=$spec.capability;requirement=$name;previous=$oldNames.Count;delta=$newNames.Count;preserved=$true}
  }
}
$instructions = Get-Content -Raw -LiteralPath (Join-Path $reportHome 'verify-instructions.json') | ConvertFrom-Json
Check 'CLI tracks complete 24/24 tasks' ($instructions.state -eq 'all_done' -and $instructions.progress.complete -eq 24 -and $instructions.progress.remaining -eq 0 -and $instructions.taskTrackingConfigured -and @($instructions.tasks | Where-Object { -not $_.done }).Count -eq 0)
$reportTime = (Get-Item -LiteralPath (Join-Path $reportHome 'playwright-report/index.html')).LastWriteTimeUtc
$newerProductFiles = @(Get-ChildItem -LiteralPath (Join-Path $workspace 'src') -Recurse -File | Where-Object LastWriteTimeUtc -gt $reportTime)
Check 'All product sources predate final original report' ($newerProductFiles.Count -eq 0)
$audit = [pscustomobject]@{verifiedAtUtc=[DateTime]::UtcNow.ToString('o');source='playwright-report/index.html embedded ZIP, original detailed attachments, extracted browser-evidence, CLI';stats=$report.stats;pngAttachments=$pngAttachments;pngFiles=@(Get-ChildItem -LiteralPath (Join-Path $reportHome 'browser-evidence') -Filter '*.png').Count;reusedImageLabels=$reusedImageLabels;imageLabelPolicy='Repeated project/label files contain the latest capture. Original per-test captures remain in HTML report data.';jsonAttachments=$jsonAttachments;jsonFiles=@(Get-ChildItem -LiteralPath (Join-Path $reportHome 'browser-evidence') -Filter '*.json').Count;specs=$specs;baselineScenarios=$baselineScenarios;cycles=$cycles;checks=$checks;passed=$true}
$audit | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $reportHome 'verify-evidence-audit.json') -Encoding UTF8
[pscustomobject]@{passed=$true;checks=$checks.Count;stats=$report.stats;pngAttachments=$pngAttachments;pngFiles=$audit.pngFiles;jsonAttachments=$jsonAttachments;jsonFiles=$audit.jsonFiles;cycles=$cycles} | ConvertTo-Json -Depth 5
