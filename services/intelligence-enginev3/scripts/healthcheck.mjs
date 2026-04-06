// ── Health Check Script ─────────────────────────────────────────────────
// For use with Docker HEALTHCHECK, Kubernetes probes, or manual verification.
// Logs nanosecond-precision timing via process.hrtime.bigint().

const url = process.env.HEALTHCHECK_URL || "http://localhost:3000/health";

const NS_PER_MS = 1_000_000n;
const NS_PER_SEC = 1_000_000_000n;

const startNs = process.hrtime.bigint();

try {
    const res = await fetch(url, { method: "GET" });
    const elapsedNs = process.hrtime.bigint() - startNs;

    const ms = parseFloat((Number(elapsedNs) / Number(NS_PER_MS)).toFixed(6));
    const sec = parseFloat((Number(elapsedNs) / Number(NS_PER_SEC)).toFixed(9));

    if (!res.ok) {
        console.error(`Healthcheck FAILED (${res.status}) — ${ms} ms / ${sec} sec`);
        process.exit(1);
    }

    const body = await res.json();
    console.log(`Healthcheck OK — ${ms} ms / ${sec} sec — ${JSON.stringify(body)}`);
    process.exit(0);
} catch (err) {
    const elapsedNs = process.hrtime.bigint() - startNs;
    const ms = parseFloat((Number(elapsedNs) / Number(NS_PER_MS)).toFixed(6));
    console.error(`Healthcheck ERROR (${ms} ms): ${err?.message || err}`);
    process.exit(1);
}
