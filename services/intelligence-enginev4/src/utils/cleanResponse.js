const ALLOWED_RISK_LEVELS = new Set(["low", "medium", "high"]);
const ALLOWED_SEVERITIES = new Set(["low", "medium", "high", "critical"]);

function parseIfNeeded(raw) {
    if (typeof raw === "string") {
        try {
            return JSON.parse(raw);
        } catch {
            return {};
        }
    }

    return raw && typeof raw === "object" ? raw : {};
}

function clampQuality(value) {
    const num = Number(value);

    if (!Number.isFinite(num)) {
        return 0;
    }

    return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizeLine(value) {
    const num = Number(value);
    return Number.isInteger(num) && num > 0 ? num : 1;
}

function normalizeSeverity(value) {
    const normalized = String(value || "").toLowerCase();
    return ALLOWED_SEVERITIES.has(normalized) ? normalized : "low";
}

function normalizeRiskLevel(value, findings) {
    const normalized = String(value || "").toLowerCase();

    if (ALLOWED_RISK_LEVELS.has(normalized)) {
        return normalized;
    }

    if (findings.some((f) => f.severity === "critical" || f.severity === "high")) {
        return "high";
    }

    if (findings.some((f) => f.severity === "medium")) {
        return "medium";
    }

    return "low";
}

function normalizeFindings(input) {
    if (!Array.isArray(input)) {
        return [];
    }

    return input
        .map((item) => {
            const finding = item && typeof item === "object" ? item : {};
            const category = String(finding.category || "general").trim() || "general";

            return {
                line: normalizeLine(finding.line),
                category,
                severity: normalizeSeverity(finding.severity),
                issue: String(finding.issue || "No issue details provided."),
                why_it_matters: String(
                    finding.why_it_matters || "Potential impact was not provided.",
                ),
                hint: String(finding.hint || "No hint provided."),
                guided_fix: String(finding.guided_fix || "No guided fix provided."),
            };
        })
        .slice(0, 100);
}

export function cleanResponse(raw) {
    const parsed = parseIfNeeded(raw);
    const findings = normalizeFindings(parsed.findings);

    const summary = {
        risk_level: normalizeRiskLevel(parsed.summary?.risk_level, findings),
        overall_quality: clampQuality(parsed.summary?.overall_quality),
    };

    return {
        summary,
        findings,
    };
}
