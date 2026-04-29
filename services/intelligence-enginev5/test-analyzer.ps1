# Test script to verify code analyzer improvements
# Uses curl to call the IE5 API

Write-Host "🧪 Code Analyzer Testing Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5001"
$buggyCode = @"
// Bug 1: Null dereference
function getUserEmail(user) {
    return user.email;
}

// Bug 2: Assignment in condition  
function divide(a, b) {
    if (a = 0) {
        return null;
    }
    return a / b;
}

// Bug 3: Infinite loop
function processItems(items) {
    let i = 0;
    while (true) {
        console.log(items[i]);
    }
}

// Bug 4: SQL Injection
function getUserById(userId) {
    const query = `SELECT * FROM users WHERE id = $`+'{userId}';
    return db.query(query);
}

// Bug 5: JSON.parse without try-catch
function parseJSON(str) {
    return JSON.parse(str);
}

// Bug 6: Unreachable code
function test() {
    return 42;
    console.log("unreachable");
}
"@

Write-Host "📋 Test Code:" -ForegroundColor Yellow
Write-Host $buggyCode
Write-Host ""

Write-Host "🚀 Starting analysis..." -ForegroundColor Green

# Create JSON payload
$payload = @{
    code = $buggyCode
    language = "javascript"
} | ConvertTo-Json

Write-Host "📤 Sending POST /review..." -ForegroundColor Yellow

# Send analysis request
$response = Invoke-WebRequest -Uri "$baseUrl/review" `
    -Method POST `
    -ContentType "application/json" `
    -Body $payload `
    -ErrorAction SilentlyContinue

$analysisResult = $response.Content | ConvertFrom-Json

Write-Host "✅ Response received" -ForegroundColor Green
Write-Host "Session ID: $($analysisResult.sessionId)" -ForegroundColor Cyan
Write-Host "Status: $($analysisResult.status)" -ForegroundColor Cyan

$sessionId = $analysisResult.sessionId

Write-Host "`n⏳ Waiting 4 seconds for analysis to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 4

Write-Host "📥 Fetching results from GET /review/$sessionId..." -ForegroundColor Yellow

# Fetch results
$resultResponse = Invoke-WebRequest -Uri "$baseUrl/review/$sessionId" `
    -Method GET `
    -ErrorAction SilentlyContinue

$results = $resultResponse.Content | ConvertFrom-Json

Write-Host "`n📊 Analysis Results:" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "Status: $($results.status)" -ForegroundColor Cyan

$findingsCount = ($results.findings | Measure-Object).Count
Write-Host "Total Findings: $findingsCount" -ForegroundColor Cyan

if ($findingsCount -eq 0) {
    Write-Host "`n❌ NO FINDINGS DETECTED" -ForegroundColor Red
    Write-Host "   This means the analyzer did NOT find the bugs!" -ForegroundColor Red
} else {
    Write-Host "`n✅ FINDINGS DETECTED!" -ForegroundColor Green
    Write-Host ""
    
    $results.findings | ForEach-Object {
        Write-Host "[$($_.severity)] Line $($_.line): $($_.issue)" -ForegroundColor Magenta
        Write-Host "   Why: $($_.why)" -ForegroundColor Gray
        Write-Host "   Hint: $($_.hint)" -ForegroundColor Gray
        Write-Host ""
    }
}

Write-Host ""
Write-Host "📈 Summary:" -ForegroundColor Cyan
Write-Host "- Expected bugs in code: 6" -ForegroundColor Yellow
Write-Host "- Bugs found: $findingsCount" -ForegroundColor Yellow

if ($findingsCount -ge 3) {
    Write-Host "`n🎉 SUCCESS: Analyzer is detecting bugs!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  WARNING: Analyzer found few bugs. May need further tuning." -ForegroundColor Yellow
}
