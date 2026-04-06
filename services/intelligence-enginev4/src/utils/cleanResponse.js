const ALLOWED_RISK_LEVELS = new Set(["low", "medium", "high"]);
const ALLOWED_SEVERITIES = new Set(["minor", "major", "critical"]);

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

function normalizeLineRange(lineRange, fallbackLine) {
    if (Array.isArray(lineRange) && lineRange.length >= 2) {
        const start = normalizeLine(lineRange[0]);
        const end = normalizeLine(lineRange[1]);
        return start <= end ? [start, end] : [end, start];
    }

    const line = normalizeLine(fallbackLine);
    return [line, line];
}

function normalizeSeverity(value) {
    const normalized = String(value || "").toLowerCase();

    if (ALLOWED_SEVERITIES.has(normalized)) {
        return normalized;
    }

    if (normalized === "high" || normalized === "medium") {
        return "major";
    }

    if (normalized === "low") {
        return "minor";
    }

    return "minor";
}

function normalizeRiskLevel(value, findings) {
    const normalized = String(value || "").toLowerCase();

    if (ALLOWED_RISK_LEVELS.has(normalized)) {
        return normalized;
    }

    if (findings.some((f) => f.severity === "critical")) {
        return "high";
    }

    if (findings.some((f) => f.severity === "major")) {
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
            const lineRange = normalizeLineRange(finding.line_range, finding.line);

            return {
                category,
                severity: normalizeSeverity(finding.severity),
                line_range: lineRange,
                abstract_issue: String(
                    finding.abstract_issue || finding.issue || "No issue details provided.",
                ),
                issue: String(finding.issue || "No issue details provided."),
                why_it_matters: String(
                    finding.why_it_matters || "Potential impact was not provided.",
                ),
                hint: String(finding.hint || "No hint provided."),
                guided_fix: String(finding.guided_fix || "No guided fix provided."),
                full_fix: finding.full_fix ?? null,
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
        final_solution: parsed.final_solution ?? null,
    };
}
