// test-run.js

import { analyze } from "./src/core/pipeline.js";

async function runTest() {
    const sampleCode = `
function test(a){
  if(a == null){
    console.log("invalid");
  }
  return a + 1;
}

test();
`;

    try {
        const result = await analyze(sampleCode);

        console.log("=== ANALYSIS RESULT ===");
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error running analysis:");
        console.error(error);
    }
}

runTest();
