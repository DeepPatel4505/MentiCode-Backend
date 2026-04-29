# Code Analyzer Enhancement - Testing Guide

## Overview

This document explains the improvements made to the IE5 code analyzer to actually detect bugs.

## Changes Made

### 1. **Enhanced Analysis Prompt** (promptBuilder.js)
- Made the prompt more explicit about what constitutes a "real bug"
- Added specific examples of detectable issues
- Improved language-specific hints
- Made the prompt more permissive (don't filter out realistic issues)

**Before:**
- Too conservative: "Do NOT report hypothetical issues"
- Vague: just listed categories without examples

**After:**
- Specific: Lists 10 common bug patterns with examples
- Clear examples: Shows exactly what the LLM should detect
- More permissive: Focuses on pragmatic, realistic bugs

### 2. **Static Bug Detection Layer** (staticBugDetector.js - NEW FILE)
- Implements pattern-based detection for common bugs
- Complements LLM analysis with reliable pattern matching
- Detects:
  - **JavaScript/TypeScript**: null dereferences, infinite loops, SQL injection, missing error handling, unreachable code, resource leaks, mutable defaults, etc.
  - **Python**: mutable defaults, bare except, missing self, infinite loops
  - **Java**: null pointer dereference, unclosed resources

### 3. **Integrated Static Analysis** (analyser.js & incrementalAnalyser.js)
- Runs static detector in parallel with LLM analysis
- Merges findings from both sources
- Deduplicates findings by line + issue
- Logs both LLM and static findings separately for debugging

## How to Test

### Prerequisites
1. IE5 service running: `npm run dev`
2. PostgreSQL database connected
3. LLM providers configured (Groq, Gemini, or Ollama)

### Option A: PowerShell Test Script
```powershell
cd services\intelligence-enginev5
.\test-analyzer.ps1
```

This script will:
1. Send buggy code to the analyzer
2. Wait for analysis to complete
3. Display all findings with severity levels
4. Report success/failure

### Option B: Manual Testing with Curl

```bash
# Start analysis
curl -X POST http://localhost:5001/review \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function test(user) { return user.email; }",
    "language": "javascript"
  }'

# Get session ID from response, then poll results
curl http://localhost:5001/review/<SESSION_ID>
```

### Option C: Test Buggy Code File

We've included `test-buggy-code.js` with 10 intentional bugs covering:
1. Null dereference
2. Logic error (unreachable code)
3. Infinite loop
4. Resource leak
5. SQL injection
6. Race condition
7. Missing error handling
8. Assignment vs comparison
9. Prototype pollution
10. Type confusion

## Expected Results

### Before Enhancement
- **Findings**: 0
- **Status**: "DONE" (but no bugs detected)
- **Issue**: LLM too conservative, static analysis missing

### After Enhancement
- **Findings**: 5-8+
- **Static Detections**: 3-4 (from pattern matching)
- **LLM Detections**: 2-4 (from improved prompt)
- **Merged**: Deduped findings from both sources

## Success Criteria

✅ **At least one finding detected** in intentionally buggy code
✅ **No false positives** on correct code
✅ **Proper formatting** with issue, why, hint, severity
✅ **Persistence** - findings stored in database
✅ **Performance** - analysis completes < 5s

## Debugging

If you don't see findings:

1. **Check LLM Response**: Look at server logs for `chunk_analysed` events
2. **Verify Parser**: Check if LLM is returning JSON in expected format
3. **Test Patterns**: Run static detector directly on test code
4. **Provider Status**: Ensure at least one LLM provider is configured

Monitor these log entries:
```
chunk_analysed {
  findings: <total>,
  llmFindings: <from llm>,
  staticFindings: <from patterns>
}
```

## Next Steps

1. **Expand Static Detection**: Add more language-specific rules
2. **Fine-tune Prompt**: Adjust examples based on real usage
3. **Add ML Scoring**: Use multiple LLM models to verify findings
4. **Build Test Suite**: Automated tests for various code patterns
5. **Implement Plugins**: Allow custom detection rules per project

## Files Modified

- `src/llm/promptBuilder.js` - Enhanced prompt
- `src/engine/analyser.js` - Integrated static detection
- `src/engine/incrementalAnalyser.js` - Integrated static detection
- `src/engine/staticBugDetector.js` - NEW, pattern-based detection

## Configuration

No additional configuration needed. Static detection runs automatically alongside LLM analysis.

To disable static detection (not recommended):
- Remove the `detectStaticBugs()` call from analyser.js and incrementalAnalyser.js
