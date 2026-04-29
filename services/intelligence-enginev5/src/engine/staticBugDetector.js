/**
 * staticBugDetector.js
 * 
 * Pattern-based bug detection for common issues.
 * Complements LLM-based analysis with reliable pattern matching.
 */

/**
 * Detects potential bugs using regex patterns and heuristics
 * @param {string} code - source code
 * @param {string} language - programming language
 * @param {number} startLine - line offset for chunk
 * @returns {object[]} array of detected issues
 */
export function detectStaticBugs(code, language = 'javascript', startLine = 1) {
    const findings = [];
    const lines = code.split('\n');
    
    if (language === 'javascript' || language === 'typescript') {
        findings.push(...detectJavaScriptBugs(lines, startLine));
    } else if (language === 'python') {
        findings.push(...detectPythonBugs(lines, startLine));
    } else if (language === 'java') {
        findings.push(...detectJavaBugs(lines, startLine));
    }
    
    return findings;
}

/**
 * JavaScript/TypeScript bug detection
 */
function detectJavaScriptBugs(lines, startLine) {
    const findings = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = startLine + i;
        
        // 1. Assignment in condition (= instead of ==, ===)
        if (/\bif\s*\([^)]*\s=\s[^=]/.test(line) && !line.includes('==')) {
            findings.push({
                line: lineNum,
                issue: 'Assignment operator in condition',
                why: 'Using = instead of == or === in condition will always assign and may have unexpected behavior',
                hint: 'Change = to == or === for comparison',
                severity: 'HIGH'
            });
        }
        
        // 2. Infinite loop detection
        if (/while\s*\(\s*true\s*\)/.test(line)) {
            findings.push({
                line: lineNum,
                issue: 'Infinite loop (while(true))',
                why: 'Loop has no exit condition and will run forever',
                hint: 'Add a break condition or fix the loop termination logic',
                severity: 'HIGH'
            });
        }
        
        // 3. SQL Injection via string interpolation
        if ((/query\s*=|SELECT.*FROM|INSERT.*INTO|UPDATE.*SET|DELETE.*FROM/.test(line)) && 
            (/\${|\+\s*[a-zA-Z_]|\+\s*'|\+\s*"/.test(line))) {
            findings.push({
                line: lineNum,
                issue: 'Potential SQL injection vulnerability',
                why: 'Using string interpolation in SQL queries allows injection attacks',
                hint: 'Use parameterized queries or prepared statements instead',
                severity: 'HIGH'
            });
        }
        
        // 4. Missing error handling on async/await
        if (/await\s+/.test(line) && i > 0) {
            // Check if inside try block
            const prevLines = lines.slice(Math.max(0, i - 5), i).join('\n');
            if (!prevLines.includes('try') || prevLines.indexOf('try') < prevLines.indexOf('catch')) {
                // Simple heuristic - could have false positives
                if (!/try|\.catch|error/.test(line)) {
                    findings.push({
                        line: lineNum,
                        issue: 'Unhandled promise rejection risk',
                        why: 'Await without try-catch or .catch() can cause unhandled rejection',
                        hint: 'Wrap await in try-catch block or add .catch() handler',
                        severity: 'MEDIUM'
                    });
                }
            }
        }
        
        // 5. JSON.parse without try-catch
        if (/JSON\.parse\s*\(/.test(line)) {
            const prevLines = lines.slice(Math.max(0, i - 3), i).join('\n');
            if (!prevLines.includes('try')) {
                findings.push({
                    line: lineNum,
                    issue: 'JSON.parse without error handling',
                    why: 'JSON.parse throws on invalid input and will crash if not caught',
                    hint: 'Wrap in try-catch: try { JSON.parse(...) } catch (e) { ... }',
                    severity: 'MEDIUM'
                });
            }
        }
        
        // 6. Potential null dereference - accessing property without check
        if (/\.[a-zA-Z_]\w*\s*[;,\)]/.test(line) && 
            (line.includes('user.') || line.includes('obj.') || line.includes('data.') || line.includes('response.'))) {
            // Simple heuristic: look for direct property access without null check
            if (!/if.*===?|if.*!=|if.*\?|&&|const.*=.*\?|optional chaining/.test(line)) {
                const match = line.match(/([a-zA-Z_]\w*)\./);
                if (match && !/typeof|instanceof|new|function|class|=>|const|let|var/.test(line)) {
                    findings.push({
                        line: lineNum,
                        issue: `Potential null reference to ${match[1]}`,
                        why: `Accessing property on ${match[1]} without null/undefined check`,
                        hint: `Add null check: if (${match[1]}) { ... } or use optional chaining: ${match[1]}?.property`,
                        severity: 'MEDIUM'
                    });
                }
            }
        }
        
        // 7. Unreachable code after return
        if (/^\s*(return|throw)\s/.test(line) && i < lines.length - 1) {
            const nextLine = lines[i + 1];
            if (!/^\s*(}|else|case|:)/.test(nextLine) && 
                !/^\s*\/\//.test(nextLine) && 
                nextLine.trim().length > 0) {
                findings.push({
                    line: lineNum + 1,
                    issue: 'Unreachable code after return/throw',
                    why: 'Code after return or throw statement will never execute',
                    hint: 'Remove the unreachable code or fix the control flow',
                    severity: 'LOW'
                });
            }
        }
        
        // 8. Resource leak - file operations not closed
        if (/fs\.(open|read)Sync|new.*Stream|\.open\s*\(/.test(line)) {
            // Look ahead for close
            const nextLines = lines.slice(i, Math.min(i + 10, lines.length)).join('\n');
            if (!nextLines.includes('close') && !nextLines.includes('on.*close')) {
                findings.push({
                    line: lineNum,
                    issue: 'Potential resource leak',
                    why: 'File or stream opened but not explicitly closed',
                    hint: 'Ensure resource is closed: use .close() or try-finally block',
                    severity: 'MEDIUM'
                });
            }
        }
    }
    
    return findings;
}

/**
 * Python bug detection
 */
function detectPythonBugs(lines, startLine) {
    const findings = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = startLine + i;
        
        // 1. Mutable default argument
        if (/def\s+\w+\([^)]*=\s*\[\s*\]|=\s*\{\s*\}/.test(line)) {
            findings.push({
                line: lineNum,
                issue: 'Mutable default argument',
                why: 'Default list/dict arguments are shared across function calls, causing unexpected behavior',
                hint: 'Use None as default: def foo(items=None): if items is None: items = []',
                severity: 'HIGH'
            });
        }
        
        // 2. While True without break
        if (/while\s+True\s*:/.test(line)) {
            const nextLines = lines.slice(i + 1, Math.min(i + 10, lines.length)).join('\n');
            if (!nextLines.includes('break')) {
                findings.push({
                    line: lineNum,
                    issue: 'Infinite loop (while True)',
                    why: 'Loop has no break statement and will run forever',
                    hint: 'Add a break condition inside the loop',
                    severity: 'HIGH'
                });
            }
        }
        
        // 3. Bare except
        if (/except\s*:/.test(line)) {
            findings.push({
                line: lineNum,
                issue: 'Bare except clause',
                why: 'Catching all exceptions including SystemExit and KeyboardInterrupt is dangerous',
                hint: 'Catch specific exceptions: except ValueError: or except Exception:',
                severity: 'MEDIUM'
            });
        }
        
        // 4. Missing self in method
        if (/def\s+\w+\([^)]*\)\s*:/.test(line) && line.includes('def') && !line.includes('self')) {
            const indent = line.match(/^\s*/)[0].length;
            if (indent > 0) { // Inside a class
                findings.push({
                    line: lineNum,
                    issue: 'Instance method missing self parameter',
                    why: 'Instance methods need self as first parameter',
                    hint: 'Add self as first parameter: def method(self, ...)',
                    severity: 'HIGH'
                });
            }
        }
    }
    
    return findings;
}

/**
 * Java bug detection
 */
function detectJavaBugs(lines, startLine) {
    const findings = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = startLine + i;
        
        // 1. Null pointer dereference risk
        if (/\.\w+\s*[=;,\)]/.test(line) && 
            (line.includes('get()') || line.includes('find()') || line.includes('load()'))) {
            findings.push({
                line: lineNum,
                issue: 'Potential NullPointerException',
                why: 'Result of method call might be null and is used without null check',
                hint: 'Check for null or use Optional: if (result != null) { ... }',
                severity: 'HIGH'
            });
        }
        
        // 2. Resource not closed
        if (/(FileReader|FileWriter|BufferedReader|Connection|Statement|ResultSet)\s+\w+\s*=\s*new/.test(line)) {
            findings.push({
                line: lineNum,
                issue: 'Resource may not be closed',
                why: 'Resource allocated but may not be properly closed on exception',
                hint: 'Use try-with-resources: try (Resource r = new ...) { ... }',
                severity: 'MEDIUM'
            });
        }
    }
    
    return findings;
}
