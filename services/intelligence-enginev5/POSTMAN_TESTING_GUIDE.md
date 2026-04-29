# IE5 Postman Collection - Complete Testing Guide

## Overview

This comprehensive Postman collection tests **all flows** of the IE5 (Intelligence Engine v5) code analyzer with the three-tier analysis system:

1. **LLM-based semantic analysis** - GPT models understand code logic
2. **Static pattern detection** - Regex patterns catch common bugs
3. **Rigorous expert verification** - High-precision issue validation

## Setup

### Prerequisites
- Postman (v10+)
- IE5 service running locally on port 5001
- Node.js environment configured

### Import Collection
1. Open Postman
2. Click **Import** → **Select File**
3. Choose `ie5-postman_collection.json`
4. Collection automatically imports with variables

### Environment Setup
- **BASE_URL**: `http://localhost:5001` (default)
- **SESSION_ID**: Auto-populated after first test
- **FINDING_ID**: Manually set when testing finding updates

## Test Flows

### FLOW 1: Setup & Health Check
**Purpose**: Verify IE5 service is running and database is connected

```
1. Run: "SETUP - Health Check"
   ✅ Should return HTTP 200
   ✅ Response shows database status
```

---

## Tier 1: SQL Injection Detection (Critical Security)

### TEST: SQL Injection Vulnerability

**Test Code**:
```javascript
function getUserById(userId) {
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  return db.query(query);
}
```

**Expected Issues**:
- **Severity**: CRITICAL
- **Category**: Security Issue
- **Issue**: SQL injection via unescaped template literal
- **Why it matters**: Attacker can inject malicious SQL code through userId parameter

**Flow**:
```
1. Run: "TIER 1 - SQL Injection (Critical Security Bug)"
   → Creates analysis session, saves SESSION_ID
   → Status: ANALYSING
   
2. Run: "TIER 2 - Poll Results (SQL Injection)" (repeat until DONE)
   → Status progresses: ANALYSING → DONE
   → Findings array contains SQL injection issue
   
✅ Expected: 1+ findings with SQL/injection keywords
```

---

## Logic Errors

### TEST 2: Assignment in Condition

**Test Code**:
```javascript
function isAdmin(role) {
  if (role = 'admin') {  // ← BUG: assignment instead of comparison
    return true;
  }
  return false;
}
```

**Expected Issues**:
- **Severity**: HIGH
- **Issue**: Assignment operator in conditional
- **Impact**: Always evaluates to true (side effect of assignment)

**Flow**:
```
1. Run: "TEST 2 - Assignment Bug (Logic Error)"
   → Creates new session
   
2. Run: "POLL TEST 2 Results" (repeat until DONE)
   ✅ Expected: 1+ findings about assignment in condition
```

---

### TEST 3: Infinite Loop

**Test Code**:
```javascript
function processItems(items) {
  let i = 0;
  while (true) {
    console.log(items[i]);
  }
}
```

**Expected Issues**:
- **Severity**: CRITICAL
- **Issue**: Infinite loop without break/exit
- **Impact**: Program will hang indefinitely

**Flow**:
```
1. Run: "TEST 3 - Infinite Loop (Critical)"
2. Run: "POLL TEST 3 Results"
   ✅ Expected: 1+ findings about infinite loops
```

---

### TEST 4: Null Pointer Dereference

**Test Code**:
```javascript
function getUserEmail(user) {
  return user.email;  // ← No null/undefined check
}
```

**Expected Issues**:
- **Severity**: MEDIUM
- **Issue**: Potential null pointer dereference
- **Impact**: Runtime error if user is null/undefined

**Flow**:
```
1. Run: "TEST 4 - Null Pointer Dereference"
2. Run: "POLL TEST 4 Results"
   ✅ Expected: 1+ findings about null checks
```

---

### TEST 5: Unreachable Code

**Test Code**:
```javascript
function divide(a, b) {
  return a / b;
  console.log('This never runs');  // ← Dead code
}
```

**Expected Issues**:
- **Severity**: MEDIUM
- **Issue**: Code after return statement is unreachable
- **Impact**: Dead code (wasted space, confusing)

**Flow**:
```
1. Run: "TEST 5 - Unreachable Code"
2. Run: "POLL TEST 5 Results"
   ✅ Expected: 1+ findings about unreachable code
```

---

### TEST 6: Missing Error Handling

**Test Code**:
```javascript
function parseUserData(jsonString) {
  const data = JSON.parse(jsonString);  // ← Can throw
  return data.user;
}
```

**Expected Issues**:
- **Severity**: MEDIUM
- **Issue**: Unprotected JSON.parse (can throw on invalid input)
- **Impact**: Runtime error crashes the function

**Flow**:
```
1. Run: "TEST 6 - Missing Error Handling"
2. Run: "POLL TEST 6 Results"
   ✅ Expected: 1+ findings about error handling
```

---

## Multi-Language Support

### TEST 7: Python Mutable Default Argument

**Test Code**:
```python
def append_item(item, items=[]):
  items.append(item)
  return items
```

**Expected Issues**:
- **Severity**: HIGH
- **Issue**: Mutable default argument
- **Impact**: Default list shared across all function calls (state leak)

**Flow**:
```
1. Run: "TEST 7 - Python Mutable Default"
   → Language automatically detected as Python
   
2. Run: "POLL TEST 7 Results"
   ✅ Expected: 1+ findings about mutable defaults
```

---

## Negative Testing: Clean Code

### TEST 8: No Issues

**Test Code**:
```javascript
function add(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  return a + b;
}

function safeParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('Invalid JSON');
    return null;
  }
}
```

**Expected**: Minimal or zero findings (this is clean code)

**Flow**:
```
1. Run: "TEST 8 - Clean Code (No Issues)"
2. Run: "POLL TEST 8 Results"
   ✅ Expected: 0 critical findings (well-written code)
```

---

## Advanced: Incremental Re-analysis

**Purpose**: Test the incremental analysis system (IE5 only re-analyzes changed chunks)

### Scenario: Fix a Bug

**Flow**:
```
1. Run: "ADVANCED - Incremental Re-analysis"
   → Analyzes code with assignment bug
   → Status: ANALYSING
   
2. Run: "POLL - Wait for Initial Analysis"
   → Wait until status = DONE
   → Note initial findings
   
3. Run: "ADVANCED - Re-analyse with Fix"
   → Submit FIXED code (role === 'admin')
   → Status: ANALYSING
   
4. Run: "POLL - Check Re-analysis Results"
   → Check final findings
   ✅ Expected: Bug finding should disappear/decrease
```

**Key Point**: IE5 uses SHA-256 hashing to detect unchanged chunks and skips re-analyzing them.

---

## Legacy Compatibility: IE4 Compat Mode

**Purpose**: Test backward-compatible synchronous endpoint

```
1. Run: "LEGACY - IE4 Compat (Synchronous)"
   → Endpoint: POST /code_review
   → SYNCHRONOUS (waits for analysis)
   → Max wait: 2 minutes
   
✅ Expected: Immediate response with findings
```

---

## Advanced: Finding Status Management

### Update Finding Status

**Purpose**: Mark findings as WONTFIX, ACKNOWLEDGED, etc.

```
Steps:
1. Run any analysis test and get results
2. Copy a FINDING_ID from the findings array
3. Run: "FINDINGS - Update Status to WONTFIX"
4. In URL, replace "FINDING_ID_HERE" with actual ID
5. Status can be: WONTFIX, ACKNOWLEDGED, OPEN, FIXED

✅ Expected: HTTP 200, finding status updated
```

---

## Complete Test Execution Order

For comprehensive validation:

```
1. SETUP - Health Check
   ↓
2. TIER 1 - SQL Injection (Critical Security Bug)
   ↓
3. TIER 2 - Poll Results (SQL Injection)
   ↓
4. TEST 2 - Assignment Bug
5. POLL TEST 2 Results
   ↓
6. TEST 3 - Infinite Loop
7. POLL TEST 3 Results
   ↓
8. TEST 4 - Null Pointer Dereference
9. POLL TEST 4 Results
   ↓
10. TEST 5 - Unreachable Code
11. POLL TEST 5 Results
    ↓
12. TEST 6 - Missing Error Handling
13. POLL TEST 6 Results
    ↓
14. TEST 7 - Python Mutable Default
15. POLL TEST 7 Results
    ↓
16. TEST 8 - Clean Code (No Issues)
17. POLL TEST 8 Results
    ↓
18. ADVANCED - Incremental Re-analysis flow
    ↓
19. LEGACY - IE4 Compat Mode
    ↓
20. FINDINGS - Update Finding Status
```

---

## Expected Results Summary

| Test | Language | Expected Findings | Severity |
|------|----------|-------------------|----------|
| SQL Injection | JavaScript | 1+ (SQL patterns) | CRITICAL |
| Assignment Bug | JavaScript | 1+ (= in condition) | HIGH |
| Infinite Loop | JavaScript | 1+ (while true) | CRITICAL |
| Null Deref | JavaScript | 1+ (no null check) | MEDIUM |
| Unreachable | JavaScript | 1+ (code after return) | MEDIUM |
| Error Handling | JavaScript | 1+ (no try-catch) | MEDIUM |
| Mutable Default | Python | 1+ (mutable default) | HIGH |
| Clean Code | JavaScript | 0-1 (minimal) | NONE |

---

## Troubleshooting

### Service Not Running
```
Error: connect ECONNREFUSED 127.0.0.1:5001

Solution:
npm run dev   # in intelligence-enginev5 directory
```

### Session Not Found
```
Error: "status":404, "message":"Session not found"

Solution:
- Make sure SESSION_ID is correctly populated
- Run initial analysis test first to create session
- Check if session exists: GET /review/{{SESSION_ID}}
```

### All Findings Empty (0 issues)
```
This means analyzer is working but not detecting bugs

Possible causes:
1. Check LLM provider is configured (Groq/Gemini)
2. Verify static detection is enabled
3. Check prompt in src/llm/promptBuilder.js
4. Review analyzer logs for errors
```

### Timeout Issues
```
Analyzer taking >2 minutes

Possible causes:
1. LLM API is slow
2. Large code chunks
3. Network connectivity

Solution:
- Check IE5 logs
- Verify LLM provider status
- Reduce code size in test
```

---

## Tips for Effective Testing

✅ **Do**:
- Run tests in order to ensure consistency
- Check logs while tests run
- Verify findings match expected patterns
- Test with different languages
- Use the collection repeatedly

❌ **Don't**:
- Modify collection URLs directly (use variables)
- Send multiple requests simultaneously
- Delete sessions before checking results
- Forget to update status in finding tests

---

## Performance Benchmarks

**Expected Performance**:
- Health check: < 100ms
- Analysis request: ~200ms (async)
- Poll (DONE): ~5-10ms
- Re-analysis: ~300-500ms (incremental)
- Sync code_review: ~1-2 seconds

If slower: Check LLM provider latency.

---

## Next Steps

After validating with this collection:

1. **Production Deployment**: Run full test suite
2. **CI/CD Integration**: Automate Postman tests
3. **Load Testing**: Test with multiple concurrent sessions
4. **Performance Tuning**: Optimize slow endpoints

---

## Support

For issues or questions:
1. Check `services/intelligence-enginev5/README.md`
2. Review `EXPERT_CODE_ANALYZER.md` for analyzer details
3. Check logs in service directory
4. Verify LLM provider configuration
