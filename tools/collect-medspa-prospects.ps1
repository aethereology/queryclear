$ErrorActionPreference = "Continue"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$OutPath = Join-Path $Root "docs\marketing\outreach\2026-06-20-med-spa-prospect-list.csv"
$NotesPath = Join-Path $Root "docs\marketing\outreach\2026-06-20-med-spa-prospect-list.md"

$Rows = New-Object System.Collections.Generic.List[object]
$Seen = @{}
$SkipDomains = "yelp.com|facebook.com|instagram.com|americanmedspa.org|whatclinic.com|withorbital.com|indeed.com|ziprecruiter.com|linkedin.com|youtube.com|realself.com|spafinder.com|reddit.com|alle.com|empiremedicaltraining.com|healthgrades.com|zocdoc.com|bbb.org|groupon.com|mapquest.com|yellowpages.com|fresha.com|vagaro.com|classpass.com|bestprosintown.com|threebestrated.com|expertise.com|trustanalytica.com"

function Get-Domain {
  param([string] $Url)
  try {
    return (([uri] $Url).Host.ToLower() -replace "^www\.", "")
  } catch {
    return ""
  }
}

function Clean-Name {
  param([string] $Title, [string] $Domain)
  $t = $Title -replace "\s*\|\s*.*$", ""
  $t = $t -replace "\s+[–—]\s+.*$", ""
  $t = $t -replace "\s+-\s+(Medical Spa|Med Spa|Aesthetics|Botox|Skin Care|Home|Official Site|Best).*$", ""
  $t = $t -replace "^Top\s+|^Best\s+|^The\s+Best\s+", ""
  $t = $t.Trim()

  if ([string]::IsNullOrWhiteSpace($t) -or $t -match "^(med spa|medical spa|aesthetics|botox|home|services)$") {
    $t = (($Domain -split "\.")[0] -replace "[-_]", " ")
  }

  return $t
}

function Get-Signal {
  param([string] $Text)
  $signals = @()
  if ($Text -match "(?i)med\s*spa|medical\s*spa|medspa") { $signals += "med-spa positioning" }
  if ($Text -match "(?i)botox|injectable|injectables|filler") { $signals += "injectables page clarity" }
  if ($Text -match "(?i)laser") { $signals += "laser service-page clarity" }
  if ($Text -match "(?i)aesthetic") { $signals += "provider/proof density" }
  if ($signals.Count -eq 0) { return "AI-search readiness audit" }
  return ($signals | Select-Object -First 2) -join "; "
}

function Get-Tag {
  param($Tags, [string[]] $Names)
  if ($null -eq $Tags) { return "" }
  foreach ($name in $Names) {
    $prop = $Tags.PSObject.Properties[$name]
    if ($null -ne $prop -and -not [string]::IsNullOrWhiteSpace([string] $prop.Value)) {
      return [string] $prop.Value
    }
  }
  return ""
}

function Add-Prospect {
  param(
    [string] $Business,
    [string] $City,
    [string] $State,
    [string] $Website,
    [string] $Domain,
    [string] $Phone,
    [string] $Source,
    [string] $SourceRef,
    [string] $Signal,
    [string] $Notes
  )

  if ([string]::IsNullOrWhiteSpace($Business)) { return }
  $key = if ($Domain) { "domain:$Domain" } else { "place:$($Business.ToLower())|$City|$State" }
  if ($script:Seen.ContainsKey($key)) { return }

  $script:Seen[$key] = $true
  $script:Rows.Add([pscustomobject]@{
    priority             = 0
    business_name        = $Business
    city                 = $City
    state                = $State
    website              = $Website
    domain               = $Domain
    phone                = $Phone
    qualification_signal = $Signal
    discovery_source     = $Source
    source_reference     = $SourceRef
    status               = "uncontacted"
    notes                = $Notes
  }) | Out-Null
}

function Save-Rows {
  $ranked = $script:Rows |
    Sort-Object @{ Expression = { if ($_.website) { 0 } else { 1 } } }, @{ Expression = { if ($_.discovery_source -like "Firecrawl*") { 0 } else { 1 } } }, business_name |
    Select-Object -First 150

  $i = 1
  $ranked | ForEach-Object {
    $_.priority = $i
    $i++
  }

  $ranked | Export-Csv -Path $script:OutPath -NoTypeInformation -Encoding UTF8
}

function Get-WebsiteCount {
  return @($script:Rows | Where-Object { $_.website }).Count
}

# Seed from existing Firecrawl search response files already present in the repo.
$fileCity = @{
  "search-jax-1.json" = @("Jacksonville", "FL")
  "search-jax-2.json" = @("Jacksonville", "FL")
  "search-mia-1.json" = @("Miami", "FL")
  "search-orl-1.json" = @("Orlando", "FL")
  "search-tpa-1.json" = @("Tampa", "FL")
}

foreach ($entry in $fileCity.GetEnumerator()) {
  $path = Join-Path $Root ".firecrawl\$($entry.Key)"
  if (!(Test-Path $path)) { continue }

  $json = Get-Content $path -Raw | ConvertFrom-Json
  foreach ($result in $json.data.web) {
    $domain = Get-Domain $result.url
    if (!$domain -or $domain -match $SkipDomains) { continue }

    $title = [System.Net.WebUtility]::HtmlDecode($result.title)
    $desc = [System.Net.WebUtility]::HtmlDecode($result.description)
    $text = "$title $desc $($result.url)"
    if ($text -match "(?i)what to expect|where can i|why choose|top 5|near me|best med spa near me|\bblog\b|/blog/|providers|\bjobs?\b|ziprecruiter|cryotherapy") {
      continue
    }
    if ($text -notmatch "(?i)med\s*spa|medical\s*spa|medspa|aesthetic|aesthetics|botox|injectable|injectables|filler|laser") {
      continue
    }

    Add-Prospect `
      -Business (Clean-Name $title $domain) `
      -City $entry.Value[0] `
      -State $entry.Value[1] `
      -Website $result.url `
      -Domain $domain `
      -Phone "" `
      -Source "Firecrawl search response" `
      -SourceRef ".firecrawl/$($entry.Key) position $($result.position)" `
      -Signal (Get-Signal $text) `
      -Notes "Existing Firecrawl search result; verify location and current fit before outreach."
  }
}

Save-Rows
Write-Host "Seeded from Firecrawl: $($Rows.Count)"

$metros = @(
  @("Miami-Fort Lauderdale", "FL", 25.45, -80.55, 26.35, -79.95),
  @("Tampa Bay", "FL", 27.55, -82.9, 28.35, -82.1),
  @("Orlando", "FL", 28.25, -81.65, 28.75, -81.05),
  @("Jacksonville", "FL", 30.1, -82.0, 30.6, -81.35),
  @("Atlanta", "GA", 33.45, -84.75, 34.15, -83.95),
  @("Charlotte", "NC", 35.0, -81.15, 35.45, -80.55),
  @("Raleigh-Durham", "NC", 35.55, -79.1, 36.15, -78.35),
  @("Nashville", "TN", 35.85, -87.05, 36.45, -86.45),
  @("Dallas-Fort Worth", "TX", 32.45, -97.55, 33.25, -96.35),
  @("Houston", "TX", 29.45, -95.85, 30.2, -94.95),
  @("Austin", "TX", 30.05, -98.05, 30.55, -97.45),
  @("San Antonio", "TX", 29.2, -98.8, 29.75, -98.25),
  @("Phoenix-Scottsdale", "AZ", 33.25, -112.35, 33.85, -111.55),
  @("Las Vegas", "NV", 35.9, -115.45, 36.4, -114.9),
  @("Los Angeles", "CA", 33.65, -118.75, 34.35, -117.75),
  @("Orange County", "CA", 33.35, -118.15, 33.95, -117.45),
  @("San Diego", "CA", 32.55, -117.35, 33.15, -116.85),
  @("Bay Area", "CA", 37.2, -122.55, 38.1, -121.7),
  @("Seattle", "WA", 47.25, -122.55, 47.85, -121.95),
  @("Portland", "OR", 45.25, -122.95, 45.75, -122.35),
  @("Denver", "CO", 39.45, -105.25, 40.05, -104.55),
  @("Chicago", "IL", 41.55, -88.05, 42.15, -87.35),
  @("New York City", "NY", 40.45, -74.35, 41.0, -73.65),
  @("Northern New Jersey", "NJ", 40.55, -74.65, 41.15, -73.9),
  @("Boston", "MA", 42.05, -71.35, 42.55, -70.85),
  @("Philadelphia", "PA", 39.7, -75.55, 40.25, -74.95),
  @("Washington DC", "DC", 38.65, -77.35, 39.15, -76.75),
  @("Baltimore", "MD", 39.05, -76.95, 39.55, -76.35),
  @("Minneapolis-St Paul", "MN", 44.75, -93.55, 45.15, -92.85),
  @("Detroit", "MI", 42.1, -83.55, 42.65, -82.8),
  @("Columbus", "OH", 39.75, -83.25, 40.2, -82.75),
  @("Cleveland", "OH", 41.25, -81.95, 41.75, -81.35),
  @("Indianapolis", "IN", 39.55, -86.35, 40.0, -85.95),
  @("St Louis", "MO", 38.4, -90.55, 38.9, -89.85),
  @("Kansas City", "MO", 38.75, -94.9, 39.35, -94.25),
  @("Salt Lake City", "UT", 40.45, -112.15, 41.05, -111.65)
)

$endpoints = @(
  "https://z.overpass-api.de/api/interpreter",
  "https://overpass-api.de/api/interpreter"
)

foreach ($metro in $metros) {
  if ((Get-WebsiteCount) -ge 170 -or $Rows.Count -ge 350) { break }

  $label = $metro[0]
  $stateHint = $metro[1]
  $s = $metro[2]
  $w = $metro[3]
  $n = $metro[4]
  $e = $metro[5]
  $query = "[out:json][timeout:25];(nwr($s,$w,$n,$e)[""name""~""med spa|medical spa|medspa|aesthetic|aesthetics|injectable|injectables|botox"",i];);out center tags 80;"
  $json = $null

  foreach ($base in $endpoints) {
    $url = $base + "?data=" + [uri]::EscapeDataString($query)
    try {
      $json = (Invoke-WebRequest -Uri $url -Headers @{ "User-Agent" = "queryclear-prospect-research/1.0" } -TimeoutSec 35).Content | ConvertFrom-Json
      break
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  if ($null -eq $json) {
    Write-Host "Overpass failed: $label"
    continue
  }

  foreach ($el in $json.elements) {
    $tags = $el.tags
    $name = Get-Tag $tags @("name")
    if ([string]::IsNullOrWhiteSpace($name)) { continue }
    if ($name -match "(?i)school|training|academy|supply|jobs") { continue }

    $website = Get-Tag $tags @("website", "contact:website")
    $domain = if ($website) { Get-Domain $website } else { "" }
    if ($domain -and $domain -match $SkipDomains) { continue }

    $city = Get-Tag $tags @("addr:city")
    if (!$city) { $city = $label }
    $state = Get-Tag $tags @("addr:state")
    if (!$state) { $state = $stateHint }
    $phone = Get-Tag $tags @("phone", "contact:phone")
    $osmUrl = "https://www.openstreetmap.org/$($el.type)/$($el.id)"

    Add-Prospect `
      -Business $name `
      -City $city `
      -State $state `
      -Website $website `
      -Domain $domain `
      -Phone $phone `
      -Source "OpenStreetMap Overpass API" `
      -SourceRef $osmUrl `
      -Signal (Get-Signal "$name $website") `
      -Notes "OSM public place record; verify website and fit before outreach."
  }

  Save-Rows
  Write-Host "$label -> collected $($Rows.Count)"
  Start-Sleep -Seconds 1
}

Save-Rows

$notes = @'
# Med Spa Prospect List - 150 targets

Generated: 2026-06-20

Sources:
- Existing Firecrawl search response files in `.firecrawl/search-*.json` for Jacksonville, Miami, Orlando, and Tampa.
- OpenStreetMap Overpass API public place records for major U.S. metros.

Note: no Firecrawl connector/tool or `FIRECRAWL_API_KEY` was available in this session, so I reused the repo's existing Firecrawl artifacts and filled the rest from public Overpass data.

Use: start at priority 1, verify the website/location, run the free AI Search Audit, then send a one-issue opener.

CSV: `./2026-06-20-med-spa-prospect-list.csv`
'@
Set-Content -Path $NotesPath -Value $notes -Encoding UTF8

Write-Host "FINAL=$((Import-Csv $OutPath).Count) PATH=$OutPath"
