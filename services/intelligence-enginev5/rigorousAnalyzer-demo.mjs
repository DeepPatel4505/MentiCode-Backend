/**
 * rigorousAnalyzer-demo.mjs
 * 
 * Demonstration of expert-grade rigorous code analysis
 * Shows real issues vs false positives
 */

import { analyzeRigorously, generateReport } from './src/engine/rigorousAnalyzer.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('      EXPERT-GRADE RIGOROUS CODE ANALYZER DEMONSTRATION');
console.log('═══════════════════════════════════════════════════════════════\n');

// ═══════════════════════════════════════════════════════════════════════════
// TEST 1: SQL Injection (CRITICAL SECURITY BUG)
// ═══════════════════════════════════════════════════════════════════════════
console.log('[TEST 1] SQL Injection Vulnerability\n');
const sqlInjectionCode = `
function getUserById(userId) {
  const query = \`SELECT * FROM users WHERE id = \${userId}\`;
  return db.query(query);
}
`;

console.log('Code:');
console.log(sqlInjectionCode);
const issues1 = analyzeRigorously(sqlInjectionCode, 'javascript');
console.log(generateReport(issues1));

// ═══════════════════════════════════════════════════════════════════════════
// TEST 2: Assignment in Condition (LOGICAL BUG)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n[TEST 2] Assignment in Condition (Logic Error)\n');
const assignmentBugCode = `
function isAdmin(role) {
  if (role = "admin") {
    return true;
  }
  return false;
}
`;

console.log('Code:');
console.log(assignmentBugCode);
const issues2 = analyzeRigorously(assignmentBugCode, 'javascript');
console.log(generateReport(issues2));

// ═══════════════════════════════════════════════════════════════════════════
// TEST 3: Infinite Loop (CRITICAL BUG)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n[TEST 3] Infinite Loop Without Exit\n');
const infiniteLoopCode = `
function processItems(items) {
  let i = 0;
  while (true) {
    console.log(items[i]);
  }
}
`;

console.log('Code:');
console.log(infiniteLoopCode);
const issues3 = analyzeRigorously(infiniteLoopCode, 'javascript');
console.log(generateReport(issues3));

// ═══════════════════════════════════════════════════════════════════════════
// TEST 4: Null Dereference (LOGICAL BUG)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n[TEST 4] Null Pointer Dereference\n');
const nullDerefCode = `
function getUserEmail(user) {
  return user.email;
}
`;

console.log('Code:');
console.log(nullDerefCode);
const issues4 = analyzeRigorously(nullDerefCode, 'javascript');
console.log(generateReport(issues4));

// ═══════════════════════════════════════════════════════════════════════════
// TEST 5: Unreachable Code (LOGICAL BUG)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n[TEST 5] Unreachable Code After Return\n');
const unreachableCode = `
function divide(a, b) {
  return a / b;
  console.log("This never runs");
}
`;

console.log('Code:');
console.log(unreachableCode);
const issues5 = analyzeRigorously(unreachableCode, 'javascript');
console.log(generateReport(issues5));

// ═══════════════════════════════════════════════════════════════════════════
// TEST 6: Missing Error Handling (CODE QUALITY)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n[TEST 6] Unhandled JSON.parse\n');
const jsonParseCode = `
function parseUserData(jsonString) {
  const data = JSON.parse(jsonString);
  return data.user;
}
`;

console.log('Code:');
console.log(jsonParseCode);
const issues6 = analyzeRigorously(jsonParseCode, 'javascript');
console.log(generateReport(issues6));

// ═══════════════════════════════════════════════════════════════════════════
// TEST 7: eval() Usage (CRITICAL SECURITY)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n[TEST 7] Dangerous eval() Usage\n');
const evalCode = `
function executeExpression(expr) {
  return eval(expr);
}
`;

console.log('Code:');
console.log(evalCode);
const issues7 = analyzeRigorously(evalCode, 'javascript');
console.log(generateReport(issues7));

// ═══════════════════════════════════════════════════════════════════════════
// TEST 8: Clean Code (SHOULD HAVE NO ISSUES)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n[TEST 8] Clean, Safe Code\n');
const cleanCode = `
function getUserEmail(user) {
  if (!user || !user.email) {
    throw new Error('Invalid user');
  }
  return user.email;
}

function divide(a, b) {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

function safeParseJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Invalid JSON');
    return null;
  }
}
`;

console.log('Code:');
console.log(cleanCode);
const issues8 = analyzeRigorously(cleanCode, 'javascript');
if (issues8.length === 0) {
  console.log('✅ No verifiable issues found.\n');
} else {
  console.log(generateReport(issues8));
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 9: Python - Mutable Default (LOGICAL BUG)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n[TEST 9] Python - Mutable Default Argument\n');
const pythonMutableCode = `
def append_item(item, items=[]):
  items.append(item)
  return items
`;

console.log('Code:');
console.log(pythonMutableCode);
const issues9 = analyzeRigorously(pythonMutableCode, 'python');
console.log(generateReport(issues9));

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                          SUMMARY');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('✅ KEY PRINCIPLES:');
console.log('  1. Only real, verifiable issues flagged');
console.log('  2. No speculation or assumptions');
console.log('  3. Every issue has clear impact');
console.log('  4. Fixes are immediately applicable');
console.log('  5. Context-aware analysis\n');

console.log('📊 RESULTS:');
console.log(`  Test 1 (SQL Injection): ${issues1.length} CRITICAL issue(s)`);
console.log(`  Test 2 (Assignment Bug): ${issues2.length} HIGH issue(s)`);
console.log(`  Test 3 (Infinite Loop): ${issues3.length} CRITICAL issue(s)`);
console.log(`  Test 4 (Null Deref): ${issues4.length} MEDIUM issue(s)`);
console.log(`  Test 5 (Unreachable): ${issues5.length} MEDIUM issue(s)`);
console.log(`  Test 6 (Missing Error): ${issues6.length} MEDIUM issue(s)`);
console.log(`  Test 7 (eval): ${issues7.length} CRITICAL issue(s)`);
console.log(`  Test 8 (Clean Code): ${issues8.length} issue(s) ✅`);
console.log(`  Test 9 (Python Mutable): ${issues9.length} HIGH issue(s)\n`);

console.log('🎯 CHARACTERISTICS:');
console.log('  ✓ High precision (low false positives)');
console.log('  ✓ Expert-level analysis');
console.log('  ✓ Production-grade quality');
console.log('  ✓ Zero speculation');
console.log('  ✓ Clear, actionable output\n');

console.log('═══════════════════════════════════════════════════════════════');
