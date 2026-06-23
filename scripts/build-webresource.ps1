param(
  [string] $SourceHtml = "index.html",
  [string] $WebResourceName = "new_TelaCurriculo",
  [string] $OutDir = "dist"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step([string] $Message) {
  Write-Host "[build-webresource] $Message"
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

if (-not (Test-Path -LiteralPath $SourceHtml)) {
  throw "Arquivo fonte nao encontrado: $SourceHtml"
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  throw "Node.js nao encontrado. Necessario para validar JavaScript inline."
}

$resolvedOutDir = Join-Path $root $OutDir
New-Item -ItemType Directory -Force -Path $resolvedOutDir | Out-Null

$html = Get-Content -Path $SourceHtml -Raw -Encoding UTF8
$matches = [regex]::Matches($html, "<script>\s*(?<code>[\s\S]*?)\s*</script>", [Text.RegularExpressions.RegexOptions]::IgnoreCase)
if ($matches.Count -eq 0) {
  throw "Nenhum <script> inline encontrado em $SourceHtml"
}

$inlineScript = $matches[$matches.Count - 1].Groups["code"].Value
$tempScriptPath = Join-Path $resolvedOutDir "$WebResourceName.inline.js"
Set-Content -Path $tempScriptPath -Value $inlineScript -Encoding UTF8

Write-Step "node --check $tempScriptPath"
node --check $tempScriptPath
if ($LASTEXITCODE -ne 0) {
  throw "Validacao JavaScript falhou com exit code $LASTEXITCODE"
}

$outputHtml = Join-Path $resolvedOutDir "$WebResourceName.html"
Copy-Item -LiteralPath $SourceHtml -Destination $outputHtml -Force

@("app.js", "curriculo-create-redirect.js", "styles.css") | ForEach-Object {
  if (Test-Path -LiteralPath $_) {
    Copy-Item -LiteralPath $_ -Destination (Join-Path $resolvedOutDir $_) -Force
  }
}

Write-Step "ok $outputHtml"
