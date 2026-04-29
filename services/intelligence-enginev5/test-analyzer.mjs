import fetch from 'node-fetch';
import fs from 'fs';

async function testAnalyzer() {
    const buggyCode = fs.readFileSync('./test-buggy-code.js', 'utf-8');
    
    console.log('📋 Sending buggy code to analyzer...');
    console.log(`Code length: ${buggyCode.length} bytes\n`);
    
    try {
        // Start analysis
        const analyzeRes = await fetch('http://localhost:5001/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: buggyCode,
                language: 'javascript'
            })
        });
        
        const analyzeData = await analyzeRes.json();
        console.log('✅ Analysis started:');
        console.log(JSON.stringify(analyzeData, null, 2));
        
        const sessionId = analyzeData.sessionId;
        
        // Wait a moment for analysis to complete
        console.log('\n⏳ Waiting 3 seconds for analysis to complete...\n');
        await new Promise(r => setTimeout(r, 3000));
        
        // Get results
        const resultRes = await fetch(`http://localhost:5001/review/${sessionId}`);
        const resultData = await resultRes.json();
        
        console.log('📊 Analysis results:');
        console.log(JSON.stringify(resultData, null, 2));
        
        // Check findings
        const totalFindings = (resultData.findings || []).length;
        console.log(`\n🔍 Total findings: ${totalFindings}`);
        
        if (totalFindings === 0) {
            console.log('❌ NO FINDINGS DETECTED - This is the problem!');
            console.log('\n📝 Expected bugs in test code:');
            console.log('  1. Null dereference on user.email');
            console.log('  2. Dead code after return');
            console.log('  3. Infinite loop (while(true))');
            console.log('  4. Resource leak (file not closed)');
            console.log('  5. SQL injection vulnerability');
            console.log('  6. Race condition in async');
            console.log('  7. Missing error handling');
            console.log('  8. Assignment in condition (=== vs =)');
            console.log('  9. Prototype pollution');
            console.log('  10. Type confusion');
        } else {
            console.log('\n✅ FINDINGS DETECTED:');
            for (const finding of resultData.findings) {
                console.log(`  - [${finding.severity}] Line ${finding.line}: ${finding.issue}`);
                console.log(`    Why: ${finding.why}`);
                console.log(`    Hint: ${finding.hint}\n`);
            }
        }
        
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

testAnalyzer();
