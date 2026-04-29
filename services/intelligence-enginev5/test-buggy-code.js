// Test file with intentional bugs for analyzer testing

/**
 * Bug 1: Null dereference - accessing property on potentially null object
 */
function getUserEmail(user) {
    return user.email; // BUG: user could be null/undefined
}

/**
 * Bug 2: Logic error - unreachable code after return
 */
function divide(a, b) {
    if (b === 0) {
        return null;
    }
    const result = a / b;
    return result;
    console.log("This line is unreachable"); // BUG: dead code
}

/**
 * Bug 3: Infinite loop
 */
function processItems(items) {
    let i = 0;
    while (true) { // BUG: infinite loop, never increments i
        console.log(items[i]);
    }
}

/**
 * Bug 4: Resource leak - file not closed
 */
async function readFile(filePath) {
    const file = fs.openSync(filePath);
    const data = fs.readFileSync(file);
    return data; // BUG: file handle never closed, resource leak
}

/**
 * Bug 5: SQL Injection vulnerability
 */
function getUserById(userId) {
    const query = `SELECT * FROM users WHERE id = ${userId}`; // BUG: SQL injection
    return db.query(query);
}

/**
 * Bug 6: Race condition in async code
 */
let counter = 0;
async function incrementCounter() {
    const temp = counter;
    await new Promise(resolve => setTimeout(resolve, 10));
    counter = temp + 1; // BUG: race condition, lost update
}

/**
 * Bug 7: Missing error handling
 */
function parseJSON(str) {
    return JSON.parse(str); // BUG: no try-catch, will crash on invalid JSON
}

/**
 * Bug 8: Incorrect operator
 */
function isAdminUser(role) {
    if (role = "admin") { // BUG: assignment instead of comparison
        return true;
    }
    return false;
}

/**
 * Bug 9: Prototype pollution
 */
function merge(obj1, obj2) {
    for (const key in obj2) {
        obj1[key] = obj2[key]; // BUG: can modify __proto__ or constructor
    }
    return obj1;
}

/**
 * Bug 10: Type confusion
 */
function multiply(a, b) {
    return a * b; // BUG: if a or b is string, unexpected behavior
}
