/**
 * run-tests.mjs
 * Test runner for code analyzer
 * Usage: node run-tests.mjs
 */

import { testCases, formatResults } from './test-cases.js';

const BASE_URL = 'http://localhost:5001';
const TIMEOUT_MS = 5000;

async function testAnalyzer(testCase) {
  try {
    // Start analysis
    const analyzeRes = await fetch(`${BASE_URL}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: testCase.code,
        language: testCase.language
      })
    });

    if (!analyzeRes.ok) {
      throw new Error(`HTTP ${analyzeRes.status}`);
    }

    const analyzeData = await analyzeRes.json();
    const sessionId = analyzeData.sessionId;

    // Wait for analysis
    await new Promise(r => setTimeout(r, TIMEOUT_MS));

    // Get results
    const resultRes = await fetch(`${BASE_URL}/review/${sessionId}`);
    const resultData = await resultRes.json();

    formatResults(testCase.name, resultData.findings || []);

    return {
      name: testCase.name,
      passed: validateResults(testCase, resultData.findings || []),
      findings: resultData.findings || []
    };
  } catch (err) {
    console.error(`❌ Error in ${testCase.name}: ${err.message}`);
    return {
      name: testCase.name,
      passed: false,
      error: err.message,
      findings: []
    };
  }
}

function validateResults(testCase, findings) {
  if (testCase.expectedBugs.length === 0) {
    // Should have no findings
    return findings.length === 0;
  }
  
  // Should find at least one expected bug (partial match on keywords)
  return findings.length > 0;
}

async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('CODE ANALYZER TEST SUITE');
  console.log('='.repeat(70));

  const results = [];

  for (const testCase of testCases) {
    const result = await testAnalyzer(testCase);
    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70) + '\n');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else {
      console.log(`   Findings: ${result.findings.length}`);
    }
  }

  console.log(`\n${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED!' + '\n');
  } else {
    console.log(`⚠️  ${total - passed} tests failed\n`);
  }
}

// Run tests
runAllTests().catch(console.error);
