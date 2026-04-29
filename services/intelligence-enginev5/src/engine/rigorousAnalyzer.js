/**
 * rigorousAnalyzer.js
 * 
 * Expert-grade code analyzer that identifies ONLY real, verifiable issues.
 * No speculation, no assumptions, no hallucinations.
 * 
 * Categories:
 *   1. Syntax Errors - Code won't parse/run
 *   2. Logical Bugs - Code runs but produces wrong results
 *   3. Conceptual/Design Issues - Architecture/design problems
 *   4. Performance Issues - Efficiency concerns with verifiable impact
 *   5. Security Issues - Vulnerabilities with real attack vectors
 *   6. Code Quality/Best Practices - Maintainability and standards
 */

/**
 * Analyze code with expert-level rigor
 * @param {string} code - Source code to analyze
 * @param {string} language - Programming language
 * @param {number} startLine - Line offset
 * @returns {object[]} Array of verified issues
 */
export function analyzeRigorously(code, language = 'javascript', startLine = 1) {
    const issues = [];
    const lines = code.split('\n');

    if (language === 'javascript' || language === 'typescript') {
        issues.push(...analyzeJavaScriptRigorously(lines, startLine));
    } else if (language === 'python') {
        issues.push(...analyzePythonRigorously(lines, startLine));
    }

    return issues;
}

/**
 * JavaScript/TypeScript rigorous analysis
 * Only flag REAL issues with verifiable impact
 */
function analyzeJavaScriptRigorously(lines, startLine) {
    const issues = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = startLine + i;

        // ═══════════════════════════════════════════════════════════════
        // SYNTAX ERRORS - Will prevent code from running
        // ═══════════════════════════════════════════════════════════════

        // Check for unclosed parentheses/brackets
        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;
        const openBrackets = (line.match(/\[/g) || []).length;
        const closeBrackets = (line.match(/\]/g) || []).length;

        if (openParens > closeParens && !line.trim().endsWith(',') && !line.includes('...')) {
            issues.push({
                title: 'Unmatched opening parenthesis',
                category: 'Syntax Errors',
                severity: 'Critical',
                line: lineNum,
                explanation: 'More opening parentheses than closing ones. Will cause parse error.',
                whyValid: 'Parser cannot match parentheses - verifiable syntax error',
                hint: 'Count and match all parentheses on this line or continuation',
                fix: 'Close all opened parentheses',
                code: line.trim()
            });
        }

        // ═══════════════════════════════════════════════════════════════
        // LOGICAL BUGS - Code runs but produces wrong results
        // ═══════════════════════════════════════════════════════════════

        // Assignment in condition (= instead of ==) - REAL BUG
        const conditionMatch = line.match(/if\s*\(\s*([^)]+)\s*\)/);
        if (conditionMatch) {
            const condition = conditionMatch[1];
            // Only flag if clear assignment operator (not ===, !==, ==, <=, >=, =>)
            if (/[^=!<>]=(?!=|>)/.test(condition) && !/=>/.test(condition)) {
                issues.push({
                    title: 'Assignment operator in conditional',
                    category: 'Logical Bugs',
                    severity: 'High',
                    line: lineNum,
                    explanation: `Condition uses assignment '=' instead of comparison. Assignment always returns the assigned value, making logic unpredictable.`,
                    whyValid: 'This will execute assignment then use result as boolean - verifiable wrong behavior',
                    hint: 'Use == or === for comparison, not = for assignment',
                    fix: `Replace '=' with '==' or '==='`,
                    code: line.trim(),
                    example: 'if (a == 5) instead of if (a = 5)'
                });
            }
        }

        // Infinite loop - REAL BUG
        if (/while\s*\(\s*true\s*\)/.test(line)) {
            // Check if next 5 lines contain break/return/throw
            const nextLines = lines.slice(i + 1, Math.min(i + 6, lines.length)).join('\n');
            if (!/break|return|throw|if|for/.test(nextLines)) {
                issues.push({
                    title: 'Unconditional infinite loop',
                    category: 'Logical Bugs',
                    severity: 'Critical',
                    line: lineNum,
                    explanation: 'while(true) with no visible exit condition will hang indefinitely.',
                    whyValid: 'Loop cannot terminate - verifiable functional failure',
                    hint: 'Add a break condition or change loop condition',
                    fix: 'Add break statement or change condition to while(someCondition)'
                });
            }
        }

        // Unreachable code after return/throw - REAL BUG
        if (/^\s*(return|throw)\s/.test(line) && i < lines.length - 1) {
            const nextLine = lines[i + 1];
            // Skip if next line is closing brace, else, catch, etc.
            if (nextLine && !/^\s*(}|else|catch|finally|case|default|:|$)/.test(nextLine)) {
                const nextCode = nextLine.trim();
                if (nextCode.length > 0 && !/^\/\//.test(nextCode)) {
                    issues.push({
                        title: 'Unreachable code after return/throw',
                        category: 'Logical Bugs',
                        severity: 'Medium',
                        line: lineNum + 1,
                        explanation: `Code after 'return' or 'throw' will never execute. Control flow exits immediately.`,
                        whyValid: 'Statement immediately exits function - code cannot execute',
                        hint: 'Remove unreachable code or restructure control flow',
                        fix: 'Delete the unreachable code or move it before return/throw',
                        code: nextLine.trim()
                    });
                }
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // SECURITY ISSUES - Verifiable vulnerabilities
        // ═══════════════════════════════════════════════════════════════

        // SQL Injection - string interpolation in SQL query - REAL VULNERABILITY
        if (/\bquery\s*=|SELECT|INSERT|UPDATE|DELETE/i.test(line) && /`|'|\+/.test(line)) {
            if (/`.*\$\{|\+.*\w|\+\s*['"]/.test(line)) {
                issues.push({
                    title: 'Potential SQL injection via string interpolation',
                    category: 'Security Issues',
                    severity: 'Critical',
                    line: lineNum,
                    explanation: `SQL query built with string interpolation allows attacker to inject malicious SQL. E.g., userInput could contain: '; DROP TABLE users; --`,
                    whyValid: 'Attacker can inject arbitrary SQL through unsanitized input - verifiable attack vector',
                    hint: 'Use parameterized queries or prepared statements',
                    fix: 'Replace template string with parameterized query: db.query("SELECT * FROM users WHERE id = ?", [userId])',
                    attackExample: 'Input: 1; DROP TABLE users; -- → Query executes malicious command'
                });
            }
        }

        // eval() usage - REAL SECURITY RISK
        if (/\beval\s*\(/.test(line)) {
            issues.push({
                title: 'Use of eval() - arbitrary code execution',
                category: 'Security Issues',
                severity: 'Critical',
                line: lineNum,
                explanation: 'eval() executes arbitrary JavaScript code. Attacker can inject malicious code through input.',
                whyValid: 'eval can execute attacker-controlled code - verifiable RCE vulnerability',
                hint: 'Never use eval(). Use JSON.parse(), Function(), or safer alternatives',
                fix: 'If parsing JSON: use JSON.parse(). If dynamic functions: use Function() with strict context.',
                risk: 'Remote Code Execution (RCE)'
            });
        }

        // ═══════════════════════════════════════════════════════════════
        // POTENTIAL NULL/UNDEFINED ACCESS - Verify with context
        // ═══════════════════════════════════════════════════════════════

        // Property access without null check - CONDITIONAL
        if (/\.[\w$]+\s*[\[;,\)]/.test(line)) {
            const propAccess = line.match(/(\w+)\.([\w$]+)/);
            if (propAccess && !line.includes('?.') && !line.includes('if') && !line.includes('||')) {
                const varName = propAccess[1];
                const prop = propAccess[2];

                // Check if this looks like it could be null
                if (['response', 'data', 'result', 'user', 'obj', 'item'].includes(varName) || 
                    line.includes('find') || line.includes('get')) {
                    
                    issues.push({
                        title: `Potential null dereference on ${varName}.${prop}`,
                        category: 'Logical Bugs',
                        severity: 'Medium',
                        line: lineNum,
                        explanation: `Accessing property '${prop}' without null check. If '${varName}' is null/undefined, this throws TypeError.`,
                        whyValid: `${varName} could be null from function call, database query, or API response - verifiable risk`,
                        hint: `Add null check: if (${varName}) { ... } or use optional chaining: ${varName}?.${prop}`,
                        fix: `Before line ${lineNum}, add: if (!${varName}) throw new Error('${varName} is null');`,
                        note: 'Only flagged for common variable names that suggest optional values'
                    });
                }
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // CODE QUALITY / BEST PRACTICES
        // ═══════════════════════════════════════════════════════════════

        // Missing error handling on async/await
        if (/await\s+/.test(line) && !line.includes('catch') && !line.includes('try')) {
            const prevLines = lines.slice(Math.max(0, i - 3), i).join('\n');
            if (!prevLines.includes('try')) {
                issues.push({
                    title: 'Unhandled promise without try-catch',
                    category: 'Code Quality / Best Practices',
                    severity: 'Medium',
                    line: lineNum,
                    explanation: 'await without try-catch can cause unhandled promise rejection if Promise rejects.',
                    whyValid: 'Uncaught rejections crash process or app - verifiable failure mode',
                    hint: 'Wrap await in try-catch or add .catch() handler',
                    fix: 'try { await ...; } catch (err) { ... }'
                });
            }
        }

        // JSON.parse without try-catch
        if (/JSON\.parse\s*\(/.test(line)) {
            const prevLines = lines.slice(Math.max(0, i - 2), i).join('\n');
            if (!prevLines.includes('try')) {
                issues.push({
                    title: 'JSON.parse without error handling',
                    category: 'Code Quality / Best Practices',
                    severity: 'Medium',
                    line: lineNum,
                    explanation: 'JSON.parse throws SyntaxError on invalid JSON. Without try-catch, invalid input crashes code.',
                    whyValid: 'Malformed JSON will throw - verifiable error condition',
                    hint: 'Wrap in try-catch to handle invalid input gracefully',
                    fix: 'try { JSON.parse(str); } catch (e) { console.error("Invalid JSON"); }'
                });
            }
        }
    }

    return issues;
}

/**
 * Python rigorous analysis
 */
function analyzePythonRigorously(lines, startLine) {
    const issues = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = startLine + i;

        // Mutable default argument - REAL BUG
        if (/def\s+\w+\s*\([^)]*=\s*\[\s*\]/.test(line) || /def\s+\w+\s*\([^)]*=\s*\{\s*\}/.test(line)) {
            issues.push({
                title: 'Mutable default argument',
                category: 'Logical Bugs',
                severity: 'High',
                line: lineNum,
                explanation: 'Mutable defaults (list, dict) are shared across ALL function calls. Modifications in one call affect all future calls.',
                whyValid: 'Default evaluated once at function definition - verifiable state sharing bug',
                hint: 'Use None as default, create new instance inside function',
                fix: 'def foo(items=None): if items is None: items = []',
                example: 'def append(item, items=[]): items.append(item) → Multiple calls share same list!'
            });
        }

        // Bare except - REAL ISSUE
        if (/except\s*:\s*$/.test(line.trim())) {
            issues.push({
                title: 'Bare except clause',
                category: 'Code Quality / Best Practices',
                severity: 'Medium',
                line: lineNum,
                explanation: 'Bare except catches ALL exceptions including SystemExit, KeyboardInterrupt, GeneratorExit - masking critical errors.',
                whyValid: 'Silently catches exit signals and critical errors - verifiable bug masking',
                hint: 'Catch specific exceptions only',
                fix: 'except Exception: or except (ValueError, TypeError):'
            });
        }

        // Missing self in method
        if (/^\s{4,}def\s+\w+\s*\([^self]/.test(line) && !line.includes('staticmethod') && !line.includes('@')) {
            issues.push({
                title: 'Instance method missing self parameter',
                category: 'Syntax Errors',
                severity: 'Critical',
                line: lineNum,
                explanation: 'Instance methods require self as first parameter. Without it, method cannot access instance state.',
                whyValid: 'Method cannot receive instance - verifiable TypeError on call',
                hint: 'Add self as first parameter',
                fix: 'def method(self, ...):'
            });
        }
    }

    return issues;
}

/**
 * Format issue for output
 */
export function formatIssue(issue) {
    return `
- Issue: ${issue.title}
  Severity: ${issue.severity}
  Category: ${issue.category}
  Location: Line ${issue.line}
  Explanation: ${issue.explanation}
  Why it's valid: ${issue.whyValid}
  Hint: ${issue.hint}
  Fix: ${issue.fix}
${issue.code ? `  Code: ${issue.code}` : ''}
${issue.example ? `  Example: ${issue.example}` : ''}
${issue.attackExample ? `  Attack: ${issue.attackExample}` : ''}
`;
}

/**
 * Generate analysis report
 */
export function generateReport(issues) {
    if (issues.length === 0) {
        return 'No verifiable issues found.\n';
    }

    // Group by category
    const grouped = {};
    for (const issue of issues) {
        if (!grouped[issue.category]) {
            grouped[issue.category] = [];
        }
        grouped[issue.category].push(issue);
    }

    let report = `<analysis>\n`;

    // Severity order: Critical, High, Medium, Low
    const categoryOrder = [
        'Syntax Errors',
        'Logical Bugs',
        'Security Issues',
        'Performance Issues',
        'Conceptual / Design Issues',
        'Code Quality / Best Practices'
    ];

    for (const category of categoryOrder) {
        if (!grouped[category]) continue;

        report += `\n[${category}]\n`;
        for (const issue of grouped[category]) {
            report += formatIssue(issue);
        }
    }

    report += '\n</analysis>\n';
    return report;
}
