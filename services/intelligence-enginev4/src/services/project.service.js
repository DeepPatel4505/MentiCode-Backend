import { runCodeReview } from "./review.service.js";
import logger from "../utils/logger.js";

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

const ISSUE_PATTERN_THRESHOLD = 2;
const MAX_MAIN_ISSUES = 5;

function aggregateRiskLevel(riskLevels) {
    let maxRank = 1;

    for (const level of riskLevels) {
        maxRank = Math.max(maxRank, RISK_RANK[level] || 1);
    }

    const rankMap = { 1: "low", 2: "medium", 3: "high" };
    return rankMap[maxRank] || "low";
}

function aggregateQualityScore(qualityScores) {
    if (qualityScores.length === 0) {
        return 0;
    }

    const sum = qualityScores.reduce((acc, score) => acc + Number(score || 0), 0);
    return Math.round(sum / qualityScores.length);
}

function extractPatterns(allFindings) {
    const categories = {};
    const issues = {};

    for (const finding of allFindings) {
        const category = String(finding.category || "general").toLowerCase();
        categories[category] = (categories[category] || 0) + 1;

        const normalizedIssue = String(finding.issue || "").toLowerCase().trim();

        if (normalizedIssue.length > 10) {
            issues[normalizedIssue] = (issues[normalizedIssue] || 0) + 1;
        }
    }

    const topCategories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, count]) => ({ category: cat, count }));

    const topIssues = Object.entries(issues)
        .filter(([_, count]) => count >= ISSUE_PATTERN_THRESHOLD)
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_MAIN_ISSUES)
        .map(([issue, count]) => ({ issue, count }));

    return { topCategories, topIssues };
}

function extractMainIssues(allFindings, topIssuePatterns) {
    if (topIssuePatterns.length === 0) {
        return [];
    }

    const mainIssues = [];
    const seenIssues = new Set();

    for (const pattern of topIssuePatterns) {
        for (const finding of allFindings) {
            const normalizedFinding = String(finding.issue || "").toLowerCase().trim();

            if (normalizedFinding === pattern.issue && !seenIssues.has(pattern.issue)) {
                seenIssues.add(pattern.issue);
                mainIssues.push({
                    issue: finding.issue,
                    category: finding.category,
                    severity: finding.severity,
                    occurrences: pattern.count,
                });
                break;
            }
        }
    }

    return mainIssues.slice(0, MAX_MAIN_ISSUES);
}

function identifyStrengths(fileSummaries) {
    const strengths = [];

    const highQualityFiles = fileSummaries.filter((f) => f.overall_quality >= 80);

    if (highQualityFiles.length > 0) {
        const avgFiles = Math.round(highQualityFiles.length);
        strengths.push(
            `${avgFiles} file(s) with high code quality (>= 80/100)`,
        );
    }

    const lowRiskFiles = fileSummaries.filter((f) => f.risk_level === "low");

    if (lowRiskFiles.length > fileSummaries.length / 2) {
        strengths.push("Majority of files have low risk level");
    }

    const commonGoodPatterns = fileSummaries
        .filter((f) => f.findings.length === 0)
        .map((f) => f.index);

    if (commonGoodPatterns.length > 0) {
        strengths.push(`${commonGoodPatterns.length} file(s) with zero findings`);
    }

    return strengths;
}

export async function generateProjectSummary({ files, mode = "guided", requestId }) {
    if (!Array.isArray(files) || files.length === 0) {
        throw new Error("At least one file is required for project summary.");
    }

    const fileSummaries = [];
    const allFindings = [];
    const riskLevels = [];
    const qualityScores = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (typeof file.language !== "string" || file.language.trim().length === 0) {
            throw new Error(`File ${i}: language is required and must be a non-empty string.`);
        }

        if (typeof file.code !== "string" || file.code.trim().length === 0) {
            throw new Error(`File ${i}: code is required and must be a non-empty string.`);
        }

        if (file.code.length > 50_000) {
            throw new Error(`File ${i}: code exceeds max length of 50000 characters.`);
        }

        const review = await runCodeReview({
            language: file.language.trim(),
            code: file.code,
            mode,
            requestId,
        });

        const fileSummary = {
            index: i,
            language: file.language.trim(),
            risk_level: review.summary?.risk_level || "low",
            overall_quality: Number(review.summary?.overall_quality || 0),
            findings: Array.isArray(review.findings) ? review.findings : [],
            meta: review.meta,
        };

        fileSummaries.push(fileSummary);
        riskLevels.push(fileSummary.risk_level);
        qualityScores.push(fileSummary.overall_quality);

        for (const finding of fileSummary.findings) {
            allFindings.push({
                ...finding,
                fileIndex: i,
            });
        }
    }

    const patterns = extractPatterns(allFindings);
    const mainIssues = extractMainIssues(allFindings, patterns.topIssues);
    const strengths = identifyStrengths(fileSummaries);

    logger.info("project_summary_complete", {
        requestId,
        files: fileSummaries.length,
        totalFindings: allFindings.length,
        mainIssues: mainIssues.length,
        riskLevel: aggregateRiskLevel(riskLevels),
    });

    return {
        project_summary: {
            risk_level: aggregateRiskLevel(riskLevels),
            quality_score: aggregateQualityScore(qualityScores),
            files_analyzed: fileSummaries.length,
            total_findings: allFindings.length,
            main_issues: mainIssues,
            strengths,
            top_issue_categories: patterns.topCategories,
        },
        file_summaries: fileSummaries,
    };
}
