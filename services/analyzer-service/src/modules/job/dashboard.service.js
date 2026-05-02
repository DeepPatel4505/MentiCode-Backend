import prisma from "../../config/prisma.js";
import { logger } from "@menticode/shared";

function countBySeverity(findings = []) {
	const counts = { critical: 0, major: 0, minor: 0 };
	for (const f of findings) {
		const s = String(f?.severity || "").toLowerCase();
		if (counts[s] !== undefined) counts[s] += 1;
	}
	return counts;
}

function categorizeIssues(findings = []) {
	const categories = {};
	for (const finding of findings) {
		const category = String(finding?.category || "general").toLowerCase();
		if (!categories[category]) {
			categories[category] = {
				count: 0,
				findings: [],
				severities: { critical: 0, major: 0, minor: 0 },
			};
		}
		categories[category].count += 1;
		categories[category].findings.push(finding);
		const severity = String(finding?.severity || "minor").toLowerCase();
		if (categories[category].severities[severity] !== undefined) {
			categories[category].severities[severity] += 1;
		}
	}
	return categories;
}

function extractGoodsBads(completedJobs) {
	const goods = [];
	const bads = [];
	const allFindings = completedJobs.flatMap((job) => job.result?.findings || []);
	const severityCounts = countBySeverity(allFindings);
	const categoryBreakdown = categorizeIssues(allFindings);

	const qualityScores = completedJobs
		.map((job) => Number(job.result?.summary?.overall_quality || 0))
		.filter(Number.isFinite);
	const avgQuality = qualityScores.length
		? Math.round(qualityScores.reduce((s, v) => s + v, 0) / qualityScores.length)
		: 0;

	// Goods extraction
	if (completedJobs.length > 0) {
		goods.push({
			type: "achievement",
			title: `${completedJobs.length} Files Analyzed`,
			description: `You've completed analysis on ${completedJobs.length} file${completedJobs.length !== 1 ? "s" : ""}.`,
			icon: "checkmark-circle",
			priority: 1,
		});
	}

	if (avgQuality >= 70) {
		goods.push({
			type: "strength",
			title: "Good Code Quality",
			description: `Average quality score is ${avgQuality}/100. Your code maintains consistent quality standards.`,
			score: avgQuality,
			icon: "star",
			priority: 2,
		});
	}

	if (severityCounts.critical === 0 && completedJobs.length > 0) {
		goods.push({
			type: "strength",
			title: "No Critical Issues",
			description: "Excellent work! No critical-severity issues detected across recent analyses.",
			icon: "shield-check",
			priority: 3,
		});
	}

	if (severityCounts.major <= 2 && completedJobs.length > 0) {
		goods.push({
			type: "strength",
			title: "Minimal Major Issues",
			description: `Only ${severityCounts.major} major issue${severityCounts.major !== 1 ? "s" : ""} found. Keep it up!`,
			count: severityCounts.major,
			icon: "trending-up",
			priority: 4,
		});
	}

	// Get most improved category
	const topCategories = Object.entries(categoryBreakdown)
		.sort((a, b) => a[1].count - b[1].count)
		.slice(0, 3)
		.map(([cat]) => cat);

	if (topCategories.length > 0 && topCategories.includes("best-practices")) {
		goods.push({
			type: "best-practice",
			title: "Following Best Practices",
			description: "Your code demonstrates good adherence to industry best practices.",
			icon: "lightbulb",
			priority: 5,
		});
	}

	// Bads extraction
	if (severityCounts.critical > 0) {
		bads.push({
			type: "critical",
			severity: "critical",
			title: `${severityCounts.critical} Critical Issue${severityCounts.critical !== 1 ? "s" : ""} Found`,
			description: "These require immediate attention to prevent potential bugs or security vulnerabilities.",
			count: severityCounts.critical,
			icon: "alert-circle",
			priority: 1,
			action: "Review critical findings",
		});
	}

	if (severityCounts.major > 0) {
		bads.push({
			type: "major",
			severity: "major",
			title: `${severityCounts.major} Major Issue${severityCounts.major !== 1 ? "s" : ""} to Address`,
			description: "These issues affect code reliability and should be fixed soon.",
			count: severityCounts.major,
			icon: "alert-triangle",
			priority: 2,
			action: "Review major findings",
		});
	}

	if (severityCounts.minor > 3) {
		bads.push({
			type: "minor",
			severity: "minor",
			title: `${severityCounts.minor} Minor Issue${severityCounts.minor !== 1 ? "s" : ""} to Improve`,
			description: "These are good-to-fix improvements for code cleanliness.",
			count: severityCounts.minor,
			icon: "info-circle",
			priority: 3,
			action: "Review minor findings",
		});
	}

	if (avgQuality < 60 && completedJobs.length > 0) {
		bads.push({
			type: "quality",
			severity: "major",
			title: "Quality Score Trending Low",
			description: `Current average quality is ${avgQuality}/100. Focus on addressing the most frequent issues.`,
			score: avgQuality,
			icon: "trending-down",
			priority: 4,
		});
	}

	// Category-specific recommendations
	const highestImpactCategories = Object.entries(categoryBreakdown)
		.sort((a, b) => {
			const aSeverity = a[1].severities.critical * 10 + a[1].severities.major;
			const bSeverity = b[1].severities.critical * 10 + b[1].severities.major;
			return bSeverity - aSeverity;
		})
		.slice(0, 2);

	for (const [category, data] of highestImpactCategories) {
		if (data.count > 2) {
			bads.push({
				type: "category-focus",
				severity: data.severities.critical > 0 ? "critical" : "major",
				title: `Focus on ${category}`,
				description: `${data.count} issues found in this category. Consider using tools to automate checks.`,
				category,
				count: data.count,
				icon: "target",
				priority: 5,
			});
		}
	}

	return { goods, bads };
}

export async function getDashboardDataForUser(userId) {
	try {
		// Get last 5 completed analysis jobs for this user
		const completedJobs = await prisma.analysisJob.findMany({
			where: {
				status: "completed",
				file: {
					playground: {
						userId,
					},
				},
			},
			orderBy: { completedAt: "desc" },
			take: 5,
			select: {
				id: true,
				fileId: true,
				status: true,
				completedAt: true,
				file: {
					select: {
						name: true,
						language: true,
					},
				},
				result: {
					select: {
						summary: true,
						findings: true,
					},
				},
			},
		});

		if (completedJobs.length === 0) {
			logger.base.info({ userId }, "dashboard.no_completed_jobs");
			return {
				goods: [
					{
						type: "empty-state",
						title: "Start Your First Analysis",
						description: "Run an analysis to get insights about your code quality.",
						icon: "rocket",
						priority: 1,
					},
				],
				bads: [],
				stats: {
					totalAnalyses: 0,
					avgQuality: 0,
					criticalIssues: 0,
					majorIssues: 0,
					minorIssues: 0,
					lastUpdateAt: new Date().toISOString(),
				},
				recentFiles: [],
			};
		}

		// Extract goods and bads
		const { goods, bads } = extractGoodsBads(completedJobs);

		// Calculate stats
		const allFindings = completedJobs.flatMap((job) => job.result?.findings || []);
		const severityCounts = countBySeverity(allFindings);
		const qualityScores = completedJobs
			.map((job) => Number(job.result?.summary?.overall_quality || 0))
			.filter(Number.isFinite);
		const avgQuality = qualityScores.length
			? Math.round(qualityScores.reduce((s, v) => s + v, 0) / qualityScores.length)
			: 0;

		const stats = {
			totalAnalyses: completedJobs.length,
			avgQuality,
			criticalIssues: severityCounts.critical,
			majorIssues: severityCounts.major,
			minorIssues: severityCounts.minor,
			lastUpdateAt: new Date().toISOString(),
		};

		// Format recent files
		const recentFiles = completedJobs.map((job) => ({
			id: job.fileId,
			name: job.file?.name,
			language: job.file?.language,
			analyzedAt: job.completedAt?.toISOString(),
		}));

		logger.base.info({ userId, jobCount: completedJobs.length }, "dashboard.data_fetched");

		return {
			goods,
			bads,
			stats,
			recentFiles,
		};
	} catch (error) {
		logger.base.error({ userId, error: error?.message }, "dashboard.error");
		throw error;
	}
}
