const url = process.env.HEALTHCHECK_URL || "http://localhost:3000/health";

try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
        console.error(`Healthcheck failed (${res.status})`);
        process.exit(1);
    }
    process.exit(0);
} catch (err) {
    console.error("Healthcheck error:", err?.message || err);
    process.exit(1);
}

