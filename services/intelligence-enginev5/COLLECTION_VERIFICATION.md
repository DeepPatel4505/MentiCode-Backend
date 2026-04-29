# Postman Collection Verification - Step by Step

## Prerequisites Check

Before importing, ensure:

```bash
# 1. IE5 service is running
npm run dev
# Expected output:
# [2026-04-29 07:49:46.614] INFO: server_started {"port":5001,"env":"development","service":"ie5"}

# 2. PostgreSQL is accessible
# Check .env file for DATABASE_URL

# 3. Postman is installed and updated
# Recommend: Postman v10.0+
```

---

## Step-by-Step Verification

### 1. Import Collection (2 minutes)

**In Postman:**
```
File → Import → Select ie5-postman_collection.json
✅ Collection appears in left sidebar
✅ 28 requests organized in folders
```

**Verify Import:**
```
Look for these sections:
  - SETUP - Health Check
  - TIER 1 - SQL Injection
  - TEST 2 - Assignment Bug
  - TEST 3 - Infinite Loop
  - TEST 4 - Null Pointer Dereference
  - TEST 5 - Unreachable Code
  - TEST 6 - Missing Error Handling
  - TEST 7 - Python Mutable Default
  - TEST 8 - Clean Code
  - ADVANCED - Incremental Re-analysis
  - LEGACY - IE4 Compat
  - FINDINGS - Update Status
```

### 2. Verify Variables (1 minute)

**In Postman:**
```
Click "Variables" at top right
Should see:
  - BASE_URL: http://localhost:5001
  - SESSION_ID: (empty, will auto-populate)
  - FINDING_ID: (empty, manual entry)
```

### 3. Test Health Check (1 minute)

**Run this request:**
```
1. Find "SETUP - Health Check"
2. Click Send
3. Expected response (HTTP 200):
{
  "status": "healthy",
  "database": "connected",
  "service": "ie5"
}
```

**If you see 200 OK:** ✅ Service is running correctly  
**If you see connection refused:** ❌ Start IE5 with `npm run dev`

---

## Test Execution Flow

### Test 1: SQL Injection (2 minutes)

**Execute in order:**

```
STEP 1: Create Session
  Click: "TIER 1 - SQL Injection (Critical Security Bug)"
  Send Request
  
  Expected Response (HTTP 202):
  {
    "sessionId": "cmojr93x20000whsizs0telas",
    "status": "ANALYSING",
    "language": "javascript",
    "chunks": 1
  }
  
  ✅ Check: SESSION_ID variable auto-populated

STEP 2: Poll Results (repeat if needed)
  Click: "TIER 2 - Poll Results (SQL Injection)"
  Send Request
  
  If status = "ANALYSING":
    → Wait 2-3 seconds
    → Send again
    
  When status = "DONE":
    Check findings array has SQL-related issues
    
    Expected findings should include:
    {
      "id": "f-sql-001",
      "issue": "SQL injection via string interpolation",
      "severity": "CRITICAL",
      "line": 2,
      "category": "Security",
      "hint": "Use parameterized queries (db.query with $1, $2)"
    }
```

**Success Indicators:**
- ✅ HTTP 200 responses
- ✅ Status progresses from ANALYSING to DONE
- ✅ Findings array is not empty
- ✅ At least 1 security-related finding

### Test 2: Assignment Bug (2 minutes)

```
STEP 1: Create Session
  Click: "TEST 2 - Assignment Bug (Logic Error)"
  Send
  
  Expected: sessionId returned, SESSION_ID auto-saved

STEP 2: Poll Results
  Click: "POLL TEST 2 Results"
  Send (repeat until DONE)
  
  Expected findings:
  {
    "issue": "Assignment operator in conditional",
    "severity": "HIGH",
    "category": "Logic",
    "hint": "Use === instead of = for comparison"
  }
```

### Test 3-8: Same Pattern

```
For each test (3-8):

CREATE:
  Click: "TEST X - [Name]"
  Send
  SESSION_ID auto-saves

POLL (repeat until DONE):
  Click: "POLL TEST X Results"
  Send
  View findings
```

---

## Complete Test Checklist

Run through all tests and check:

| Test | Create Status | Poll Status | Findings | ✅ |
|------|----------------|-------------|----------|-----|
| SQL Injection | 202 | DONE | 1+ | [ ] |
| Assignment Bug | 202 | DONE | 1+ | [ ] |
| Infinite Loop | 202 | DONE | 1+ | [ ] |
| Null Deref | 202 | DONE | 1+ | [ ] |
| Unreachable | 202 | DONE | 1+ | [ ] |
| Error Handling | 202 | DONE | 1+ | [ ] |
| Mutable Default | 202 | DONE | 1+ | [ ] |
| Clean Code | 202 | DONE | 0-1 | [ ] |

---

## Advanced Flow: Incremental Re-analysis

**This verifies IE5 detects code changes:**

```
STEP 1: Initial Analysis (Buggy)
  Click: "ADVANCED - Incremental Re-analysis"
  Send
  Note the SESSION_ID
  Note: has assignment bug (role = 'admin')

STEP 2: Wait for Analysis
  Click: "POLL - Wait for Initial Analysis"
  Send (repeat until DONE)
  Note: findings with assignment bug

STEP 3: Re-submit Fixed Code
  Click: "ADVANCED - Re-analyse with Fix"
  Send
  Note: code now has role === 'admin'

STEP 4: Check Re-analysis
  Click: "POLL - Check Re-analysis Results"
  Send (repeat until DONE)
  
  Expected: Bug finding is gone or reduced
  ✅ Success: IE5 detected the fix!
```

---

## Legacy Compatibility Test

**Test IE4 synchronous endpoint:**

```
Click: "LEGACY - IE4 Compat (Synchronous)"
Send

Expected (HTTP 200):
{
  "summary": {
    "risk_level": "low",
    "overall_quality": 100
  },
  "findings": [
    // immediate results, no polling needed
  ],
  "meta": {
    "latency_ms": 1234
  }
}

✅ Success: Synchronous analysis works!
```

---

## Finding Status Management

**Test updating a finding:**

```
STEP 1: Get a Finding ID
  Run any test and get results
  Copy a finding's "id" field
  
  Example: "id": "finding-abc123"

STEP 2: Update Status
  Click: "FINDINGS - Update Status to WONTFIX"
  In URL bar, replace "FINDING_ID_HERE" with actual ID
  Example URL: /findings/finding-abc123/status
  Send

STEP 3: Verify
  Expected (HTTP 200):
  {
    "id": "finding-abc123",
    "status": "WONTFIX"
  }
  
  ✅ Success: Status updated!
```

---

## Interpreting Results

### Success Indicators

```
✅ All responses have HTTP 200 or 202
✅ SESSION_ID auto-populates
✅ Status transitions: ANALYSING → DONE
✅ Findings array populated
✅ Each finding has: id, issue, severity, line, category, hint
✅ Bug counts match expectations (8 tests with 1+ findings each)
✅ Re-analysis shows improvement
```

### Finding Structure

Each finding should include:

```json
{
  "id": "unique-finding-id",
  "issue": "Clear description of the bug",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "line": 2,
  "category": "Security|Logic|Runtime|Quality|etc",
  "explanation": "Technical explanation",
  "hint": "How to fix it",
  "suggestion": "Code fix example"
}
```

### Expected Findings by Test

| Test | Issue | Severity |
|------|-------|----------|
| 1. SQL Injection | SQL injection vulnerability | **CRITICAL** |
| 2. Assignment | Assignment operator in condition | **HIGH** |
| 3. Infinite Loop | Infinite loop detected | **CRITICAL** |
| 4. Null Deref | Null pointer dereference risk | **MEDIUM** |
| 5. Unreachable | Code after return | **MEDIUM** |
| 6. Error Handling | Unprotected JSON.parse | **MEDIUM** |
| 7. Mutable Default | Mutable default argument | **HIGH** |
| 8. Clean Code | (minimal/none) | - |

---

## Troubleshooting

### Error: Connection Refused

```
Error: "connect ECONNREFUSED 127.0.0.1:5001"

Solution:
1. In terminal, start IE5:
   npm run dev
   
2. Wait for: [INFO] server_started
3. Try Postman request again
```

### Error: Session Not Found

```
Error: "status":404, "message":"Session not found"

Cause: SESSION_ID is wrong or session expired
Solution:
1. Create new analysis (run test again)
2. Use new SESSION_ID automatically
3. Poll immediately after
```

### Issue: All Findings Empty

```
Result: "findings": []

Possible causes:
1. Analyzer not detecting issues (check logs)
2. LLM provider misconfigured
3. Static detection disabled

Solution:
1. Check service logs: npm run dev
2. Verify .env has LLM provider keys
3. See POSTMAN_TESTING_GUIDE.md troubleshooting
```

### Issue: Timeout (Status stays ANALYSING)

```
After 30+ seconds, still ANALYSING

Cause: LLM provider slow or stuck
Solution:
1. Wait longer (up to 2 minutes)
2. Check LLM provider status
3. Try test with shorter code
4. Review service logs
```

---

## Performance Metrics

Monitor these during testing:

```
Health Check: < 100ms
  → If slower: Database issue

Create Session: < 500ms
  → If slower: Network latency

Poll (DONE): 5-10ms
  → If slower: Service overloaded

Full Analysis (ANALYSING to DONE): 1-3 seconds
  → If slower: LLM provider latency

Re-analysis: 500ms-1s
  → Should be faster than initial (only changed chunks)
```

---

## Test Report Template

**Save results in a file:**

```markdown
# IE5 Postman Collection Test Report
Date: [YYYY-MM-DD HH:MM]

## Setup
- [ ] Health check: PASS
- [ ] BASE_URL correct: PASS
- [ ] Variables auto-populate: PASS

## Bug Detection Tests
- [ ] Test 1 SQL Injection: PASS (1 CRITICAL found)
- [ ] Test 2 Assignment Bug: PASS (1 HIGH found)
- [ ] Test 3 Infinite Loop: PASS (1 CRITICAL found)
- [ ] Test 4 Null Deref: PASS (1 MEDIUM found)
- [ ] Test 5 Unreachable: PASS (1 MEDIUM found)
- [ ] Test 6 Error Handling: PASS (1 MEDIUM found)
- [ ] Test 7 Mutable Default: PASS (1 HIGH found)
- [ ] Test 8 Clean Code: PASS (0-1 found)

## Advanced Tests
- [ ] Incremental Re-analysis: PASS
- [ ] IE4 Compatibility: PASS
- [ ] Finding Status Update: PASS

## Performance
- Average analysis time: 1.5s
- Re-analysis time: 0.6s
- No timeout issues

## Notes
- All tests passed successfully
- No connection issues
- LLM provider responding well
```

---

## Next Steps After Verification

✅ **All tests pass?**
1. Document results
2. Move to production deployment
3. Set up CI/CD integration
4. Configure monitoring

❌ **Some tests fail?**
1. Check troubleshooting section
2. Review service logs
3. Verify LLM provider configuration
4. Contact support with logs

---

## Quick Command Reference

```bash
# Start IE5 service
npm run dev

# Run tests (alternative: use Postman UI)
# (Tests are designed for Postman GUI)

# Check service health
curl http://localhost:5001/health

# View IE5 logs
tail -f logs/ie5.log

# Stop IE5
Ctrl+C

# Verify JSON collection
node -e "const fs = require('fs'); JSON.parse(fs.readFileSync('ie5-postman_collection.json')); console.log('✅ Valid')"
```

---

## Summary Checklist

Before declaring collection "verified":

- [ ] Health check passes (HTTP 200)
- [ ] All 8 tests create sessions
- [ ] All 8 tests complete with DONE status
- [ ] All 8 tests find issues
- [ ] Incremental re-analysis works
- [ ] IE4 legacy endpoint works
- [ ] Finding status updates work
- [ ] No errors in logs
- [ ] Response times are acceptable
- [ ] Documentation is clear

**When all boxes checked:** ✅ Collection is production-ready!
