import test from "node:test";
import assert from "node:assert/strict";
import cleanResponse from "../src/utils/cleanResponse.js";

test("cleanResponse strips markdown fences and normalizes schema", () => {
    const llmText = "```json\n{\n  \"summary\": {\"risk_level\": \"high\", \"overall_quality\": 7},\n  \"findings\": [{\"category\":\"bug\",\"severity\":\"major\",\"line_range\":[1,2],\"issue\":\"x\"}]\n}\n```";

    const out = cleanResponse(llmText);

    assert.equal(out.summary.risk_level, "high");
    assert.equal(out.summary.overall_quality, 7);
    assert.ok(Array.isArray(out.findings));
    assert.equal(out.findings[0].category, "bug");
    assert.equal(out.findings[0].severity, "major");
    assert.deepEqual(out.findings[0].line_range, [1, 2]);
    assert.equal(out.findings[0].issue, "x");
});

test("cleanResponse throws on invalid input type", () => {
    assert.throws(() => cleanResponse(null), /Invalid LLM response type/);
});

