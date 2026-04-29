/**
 * test-cases.js
 * Test cases for the code analyzer - various bug patterns
 */

export const testCases = [
  {
    name: "Null Dereference",
    language: "javascript",
    code: `
function getUserEmail(user) {
  return user.email; // BUG: user could be null
}
`,
    expectedBugs: ["Potential null reference to user", "Null"],
    severity: "MEDIUM"
  },

  {
    name: "Infinite Loop",
    language: "javascript",
    code: `
function processItems(items) {
  let i = 0;
  while (true) { // BUG: infinite loop
    console.log(items[i]);
  }
}
`,
    expectedBugs: ["Infinite loop", "while(true)"],
    severity: "HIGH"
  },

  {
    name: "SQL Injection",
    language: "javascript",
    code: `
function getUserById(userId) {
  const query = \`SELECT * FROM users WHERE id = \${userId}\`; // BUG: SQL injection
  return db.query(query);
}
`,
    expectedBugs: ["SQL injection", "string interpolation"],
    severity: "HIGH"
  },

  {
    name: "Missing Error Handling",
    language: "javascript",
    code: `
function parseJSON(str) {
  return JSON.parse(str); // BUG: no try-catch
}
`,
    expectedBugs: ["JSON.parse", "error handling"],
    severity: "MEDIUM"
  },

  {
    name: "Assignment in Condition",
    language: "javascript",
    code: `
function isAdmin(role) {
  if (role = "admin") { // BUG: = instead of ==
    return true;
  }
  return false;
}
`,
    expectedBugs: ["Assignment operator", "condition"],
    severity: "HIGH"
  },

  {
    name: "Unreachable Code",
    language: "javascript",
    code: `
function test() {
  return 42;
  console.log("This is unreachable"); // BUG: dead code
}
`,
    expectedBugs: ["Unreachable code", "after return"],
    severity: "LOW"
  },

  {
    name: "Resource Leak",
    language: "javascript",
    code: `
async function readFile(filePath) {
  const file = fs.openSync(filePath);
  const data = fs.readFileSync(file);
  return data; // BUG: file never closed
}
`,
    expectedBugs: ["Resource leak", "file", "close"],
    severity: "MEDIUM"
  },

  {
    name: "Clean Code - No Bugs",
    language: "javascript",
    code: `
function add(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  return a + b;
}
`,
    expectedBugs: [],
    severity: null
  },

  {
    name: "Python Mutable Default",
    language: "python",
    code: `
def append_to_list(item, items=[]):
    items.append(item)  # BUG: mutable default argument
    return items
`,
    expectedBugs: ["Mutable default argument"],
    severity: "HIGH"
  },

  {
    name: "Python Bare Except",
    language: "python",
    code: `
def process_data(data):
    try:
        return parse(data)
    except:  # BUG: bare except is too broad
        pass
`,
    expectedBugs: ["Bare except"],
    severity: "MEDIUM"
  },

  {
    name: "Race Condition",
    language: "javascript",
    code: `
let counter = 0;
async function incrementCounter() {
  const temp = counter;
  await sleep(10);
  counter = temp + 1; // BUG: race condition
}
`,
    expectedBugs: ["Race condition", "async"],
    severity: "HIGH"
  },

  {
    name: "Prototype Pollution",
    language: "javascript",
    code: `
function merge(obj1, obj2) {
  for (const key in obj2) {
    obj1[key] = obj2[key]; // BUG: can modify __proto__
  }
  return obj1;
}
`,
    expectedBugs: ["prototype"],
    severity: "HIGH"
  }
];

/**
 * Helper to format test results
 */
export function formatResults(testName, findings) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test: ${testName}`);
  console.log(`${'='.repeat(60)}`);
  
  if (findings.length === 0) {
    console.log("✅ No bugs found (as expected)");
  } else {
    console.log(`🔍 Found ${findings.length} bug(s):\n`);
    findings.forEach((f, i) => {
      console.log(`${i + 1}. [${f.severity}] Line ${f.line}: ${f.issue}`);
      console.log(`   Why: ${f.why}`);
      console.log(`   Hint: ${f.hint}\n`);
    });
  }
}
