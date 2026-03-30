const SEVERITY_RANK = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
};

const RISK_RANK = {
    high: 3,
    medium: 2,
    low: 1,
};

const MIN_FINDINGS = 5;
const MAX_FINDINGS = 8;

const VAGUE_PATTERNS = [
    /^initial\s+\w+\s+scan\s+found/i,
    /^no\s+issue/i,
    /^looks\s+good/i,
    /^error/i,
    /^unknown/i,
];

function hasVagueOrLowConfidenceIssue(finding) {
    if (!finding || !finding.issue) {
        return true;
    }

    const issue = String(finding.issue).trim();

    if (issue.length < 10) {
        return true;
    }

    return VAGUE_PATTERNS.some((pattern) => pattern.test(issue));
}

function normalizeString(str) {
    return String(str || "").toLowerCase().trim().replace(/\s+/g, " ");
}

function calculateSimilarity(str1, str2) {
    const normalized1 = normalizeString(str1);
    const normalized2 = normalizeString(str2);

    if (normalized1 === normalized2) {
        return 1;
    }

    const len = Math.max(normalized1.length, normalized2.length);

    if (len === 0) {
        return 1;
    }

    let matches = 0;

    for (let i = 0; i < Math.min(normalized1.length, normalized2.length); i++) {
        if (normalized1[i] === normalized2[i]) {
            matches++;
        }
    }

    return matches / len;
}

function findDuplicateGroup(finding, existingFindings, lineRange = 5) {
    for (const existing of existingFindings) {
        const lineDiff = Math.abs(finding.line - existing.line);

        if (lineDiff > lineRange) {
            continue;
        }

        if (finding.category !== existing.category) {
            continue;
        }

        const issueSimilarity = calculateSimilarity(finding.issue, existing.issue);

        if (issueSimilarity >= 0.7) {
            return existing;
        }
    }

    return null;
}

function normalizeFinding(finding) {
    return {
        line: Number.isInteger(finding.line) && finding.line > 0 ? finding.line : 1,
        category: String(finding.category || "general").trim() || "general",
        severity: SEVERITY_RANK[finding.severity]
            ? finding.severity
            : "low",
        issue: String(finding.issue || "").trim(),
        why_it_matters: String(finding.why_it_matters || "").trim(),
        hint: String(finding.hint || "").trim(),
        guided_fix: String(finding.guided_fix || "").trim(),
    };
}

export function mergeFindings(chunkResponses, { maxFindings = MAX_FINDINGS } = {}) {
    if (!Array.isArray(chunkResponses) || chunkResponses.length === 0) {
        return {
            summary: {
                risk_level: "low",
                overall_quality: 0,
            },
            findings: [],
        };
    }

    const findings = [];
    let riskScore = 1;
    let qualitySum = 0;

    for (const chunkResponse of chunkResponses) {
        if (!chunkResponse || typeof chunkResponse !== "object") {
            continue;
        }

        const summary = chunkResponse.summary || {};
        riskScore = Math.max(riskScore, RISK_RANK[summary.risk_level] || 1);
        qualitySum += Number(summary.overall_quality || 0);

        const chunkFindings = Array.isArray(chunkResponse.findings)
            ? chunkResponse.findings
            : [];

        for (const rawFinding of chunkFindings) {
            const normalized = normalizeFinding(rawFinding);

            if (hasVagueOrLowConfidenceIssue(normalized)) {
                continue;
            }

            const duplicate = findDuplicateGroup(normalized, findings);

            if (!duplicate) {
                findings.push(normalized);
            }
        }
    }

    const riskLevelMap = {
        1: "low",
        2: "medium",
        3: "high",
    };

    const overallQuality =
        chunkResponses.length === 0
            ? 0
            : Math.round(qualitySum / chunkResponses.length);

    const sortedFindings = findings.sort((a, b) => {
        const severityDiff =
            (SEVERITY_RANK[b.severity] || 1) - (SEVERITY_RANK[a.severity] || 1);

        if (severityDiff !== 0) {
            return severityDiff;
        }

        return a.line - b.line;
    });

    const cappedFindings = sortedFindings.slice(0, maxFindings);

    return {
        summary: {
            risk_level: riskLevelMap[riskScore] || "low",
            overall_quality: overallQuality,
        },
        findings: cappedFindings,
    };
}
