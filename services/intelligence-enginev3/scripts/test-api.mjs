// ── API Smoke Test ──────────────────────────────────────────────────────
// Sends a POST /code_review request and prints a detailed timing report
// with nanosecond precision via process.hrtime.bigint().

const API_URL = process.env.API_URL || "http://localhost:3000/code_review";

const payload = {
    language: "cpp",
    code: `
#include <iostream>
#include <vector>
using namespace std;

int binarySearch(vector<int>& arr, int target) {
    int left = 0;
    int right = arr.size();  // off-by-one: should be size()-1
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target)
            return mid;
        if (arr[mid] < target)
            left = mid + 1;
        else
            right = mid - 1;
    }
    return -1;
}

void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i <= n; i++) {  // loop_bound_risk: <= causes OOB
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}

int divide(int a, int b) {
    return a / b;  // division_without_check: no zero check
}

int main() {
    vector<int> v;  // vector without resize
    int x = v[0];   // vector_index_without_resize: indexing empty vector

    if (x = 5) {    // assignment_in_condition: should be ==
        cout << x;
    }

    int result = divide(10, 0);  // division_by_zero literal

    vector<int> arr = {3, 1, 4, 1, 5};
    int idx = binarySearch(arr, 4);
    bubbleSort(arr);

    return 0;
}
`,
};

const NS_PER_MS = 1_000_000n;
const NS_PER_SEC = 1_000_000_000n;

function formatDuration(elapsedNs) {
    const ms = Number(elapsedNs) / Number(NS_PER_MS);
    const sec = Number(elapsedNs) / Number(NS_PER_SEC);
    return {
        durationNs: elapsedNs.toString(),
        durationMs: parseFloat(ms.toFixed(6)),
        durationSec: parseFloat(sec.toFixed(9)),
    };
}

async function main() {
    console.log("╔══════════════════════════════════════════════════════╗");
    console.log("║        Intelligence Engine v3 — API Smoke Test      ║");
    console.log("╚══════════════════════════════════════════════════════╝");
    console.log(`\n  Target: ${API_URL}`);
    console.log(`  Time:   ${new Date().toISOString()}\n`);

    const startNs = process.hrtime.bigint();

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const endNs = process.hrtime.bigint();
        const elapsedNs = endNs - startNs;
        const timing = formatDuration(elapsedNs);

        console.log("── Response ───────────────────────────────────────────");
        console.log(`  Status:     ${res.status} ${res.statusText}`);
        console.log(`  Request-Id: ${res.headers.get("x-request-id") || "N/A"}`);

        const text = await res.text();
        try {
            const json = JSON.parse(text);
            console.log(`  Risk Level: ${json.summary?.risk_level ?? "N/A"}`);
            console.log(`  Quality:    ${json.summary?.overall_quality ?? "N/A"}`);
            console.log(`  Findings:   ${json.findings?.length ?? 0}`);
            console.log("\n── Full Response ──────────────────────────────────────");
            console.log(JSON.stringify(json, null, 2));
        } catch {
            console.log("\n── Raw Response ───────────────────────────────────────");
            console.log(text);
        }

        console.log("\n── Timing Report (highest precision) ──────────────────");
        console.log(`  Nanoseconds:  ${timing.durationNs} ns`);
        console.log(`  Milliseconds: ${timing.durationMs} ms`);
        console.log(`  Seconds:      ${timing.durationSec} sec`);

        console.log("\n── Result ─────────────────────────────────────────────");
        if (res.ok) {
            console.log("  ✅ PASS — API returned a successful response.");
        } else {
            console.log(`  ❌ FAIL — API returned HTTP ${res.status}.`);
            process.exit(1);
        }
    } catch (err) {
        const endNs = process.hrtime.bigint();
        const elapsedNs = endNs - startNs;
        const timing = formatDuration(elapsedNs);

        console.error("\n── Error ──────────────────────────────────────────────");
        console.error(`  ${err.message}`);
        console.error("\n── Timing Report (highest precision) ──────────────────");
        console.error(`  Nanoseconds:  ${timing.durationNs} ns`);
        console.error(`  Milliseconds: ${timing.durationMs} ms`);
        console.error(`  Seconds:      ${timing.durationSec} sec`);
        console.error("\n  ❌ FAIL — Request failed.\n");
        process.exit(1);
    }
}

main();
