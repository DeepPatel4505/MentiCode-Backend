# IE5 Postman Collection - Quick Start

## Import & Setup (60 seconds)

```
1. Open Postman
2. Import: ie5-postman_collection.json
3. Verify BASE_URL is http://localhost:5001
4. Run "SETUP - Health Check" to verify connection
```

## The 8 Bug Tests (Repeat Flow)

Each test has two parts:

```
Part A: CREATE SESSION (Submit code for analysis)
  Run: "TEST X - [Issue Name]"
  ✅ Returns sessionId in SESSION_ID variable

Part B: POLL RESULTS (Check analysis status)
  Run: "POLL TEST X Results"
  ✅ Repeat until status = "DONE"
  ✅ View findings array for detected issues
```

## The Tests (In Order)

| # | Name | Bug Type | Language | Severity |
|---|------|----------|----------|----------|
| 1 | SQL Injection | Security | JS | **CRITICAL** |
| 2 | Assignment Bug | Logic | JS | **HIGH** |
| 3 | Infinite Loop | Logic | JS | **CRITICAL** |
| 4 | Null Dereference | Runtime | JS | **MEDIUM** |
| 5 | Unreachable Code | Quality | JS | **MEDIUM** |
| 6 | Missing Error Handling | Runtime | JS | **MEDIUM** |
| 7 | Mutable Default | Logic | Python | **HIGH** |
| 8 | Clean Code | None | JS | ✅ *No issues* |

## Test Execution Template

### For TEST 1 (SQL Injection):
```
1. Click: "TIER 1 - SQL Injection (Critical Security Bug)"
   → Send request
   → Check: SESSION_ID auto-populated

2. Click: "TIER 2 - Poll Results (SQL Injection)"
   → Send request
   → If status = "ANALYSING", wait 2-3 seconds and retry
   → If status = "DONE", check findings array
   
✅ Expected: SQL injection finding in results
```

### For TEST 2+ (Same pattern):
```
1. Click: "TEST 2 - Assignment Bug (Logic Error)"
   → Send
   
2. Click: "POLL TEST 2 Results"
   → Send (repeat if needed)
   → View findings
   
✅ Expected: Assignment operator finding
```

## Advanced Tests

### Incremental Re-analysis (Test changing code)
```
1. "ADVANCED - Incremental Re-analysis" (original buggy code)
2. "POLL - Wait for Initial Analysis" (until DONE)
3. "ADVANCED - Re-analyse with Fix" (fixed code)
4. "POLL - Check Re-analysis Results" (should show improvement)

✅ Expected: Fewer or no findings after fix
```

### Synchronous Analysis (Backward compatible)
```
1. "LEGACY - IE4 Compat (Synchronous)"
   → Single request, waits for analysis
   → Max 2 minutes
   → Returns findings immediately
   
✅ Expected: Same results as async flow
```

### Update Finding Status
```
1. Get a FINDING_ID from any results
2. "FINDINGS - Update Status to WONTFIX"
3. In URL, replace FINDING_ID_HERE with actual ID
4. Send

✅ Expected: HTTP 200
```

## Viewing Results

After each POLL (when status = "DONE"):

```json
{
  "id": "cmojr93x20000whsizs0telas",
  "status": "DONE",
  "findings": [
    {
      "id": "finding-001",
      "issue": "SQL injection vulnerability",
      "severity": "CRITICAL",
      "line": 2,
      "category": "Security",
      "hint": "Use parameterized queries..."
    }
  ]
}
```

- **id**: Unique finding ID (use for status updates)
- **issue**: What's wrong
- **severity**: CRITICAL, HIGH, MEDIUM, LOW
- **line**: Where in code
- **hint**: How to fix

## Variable Management

### Auto-Populated After Each Test:
- `SESSION_ID` → Automatically saved from response
- No manual setup needed

### Manual Entry (For Finding Updates):
```
1. Get FINDING_ID from results
2. Edit URL: /findings/FINDING_ID_HERE/status
3. Replace FINDING_ID_HERE with actual ID
4. Send PATCH request
```

## Success Checklist

- [ ] "SETUP - Health Check" returns 200
- [ ] "TEST 1 - SQL Injection" creates session
- [ ] "POLL TEST 1 Results" shows "DONE" status
- [ ] Findings array contains issues
- [ ] Each finding has: id, issue, severity, line, category, hint
- [ ] All 8 tests complete with expected findings
- [ ] Re-analysis shows improvement after fix
- [ ] IE4 compat endpoint works
- [ ] Finding status update succeeds

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "connect ECONNREFUSED" | `npm run dev` in ie5 directory |
| "SESSION_ID is empty" | Run test again to create new session |
| "status: ANALYSING" after 30s | Wait longer, LLM analysis in progress |
| "findings: []" | This is correct for clean code (TEST 8) |
| "Finding not found" (404) | Copy correct FINDING_ID from response |
| "Cannot POST /code_review" | Endpoint exists, check service running |

## Performance Expectations

- Health check: <100ms
- Create session: <500ms
- Poll (DONE): 5-10ms
- Full analysis: 1-2 seconds
- Re-analysis: 500ms-1s

## Pro Tips

✅ Use Postman's **Pre-request Script** to auto-format URLs  
✅ Use **Collections Runner** to test all at once  
✅ Set up **Monitors** for continuous testing  
✅ Export results with **Reports**  

## Next: Load Testing

Once basic tests pass:

```javascript
// In Postman Console (Ctrl+Alt+C)
for (let i = 0; i < 10; i++) {
  pm.sendRequest(request, callback);
}
```

## Need Help?

📖 Full guide: `POSTMAN_TESTING_GUIDE.md`  
📋 Analyzer docs: `EXPERT_CODE_ANALYZER.md`  
🔧 API docs: `README.md`  
🐛 Debug: Check service logs `npm run dev`
