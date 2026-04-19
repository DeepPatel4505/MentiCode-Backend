import { prisma } from "../db.js";
import logger from "../utils/logger.js";

/**
 * reconcileFindings — merges new LLM findings with stored state.
 *
 * State transitions:
 *   OPEN finding disappeared    → FIXED
 *   FIXED finding re-appeared   → REGRESSED
 *   New finding not seen before → creates OPEN record
 *   WONTFIX / ACKNOWLEDGED      → never changed here (user-managed)
 *
 * @param {string} chunkId
 * @param {object[]} oldFindings - existing Finding records from DB
 * @param {object[]} newFindings - validated findings from current LLM call
 * @param {string} newHash - current chunk hash
 */
export async function reconcileFindings(chunkId, oldFindings, newFindings, newHash) {
    const newById = new Map(newFindings.map((f) => [f.id, f]));
    const oldById = new Map(oldFindings.map((f) => [f.id, f]));

    // ── Check existing findings ───────────────────────────────────────────────
    for (const old of oldFindings) {
        // User-managed states — never touch
        if (old.status === "WONTFIX" || old.status === "ACKNOWLEDGED") continue;

        const stillPresent = newById.has(old.id);

        if (old.status === "OPEN" && !stillPresent) {
            // Finding was OPEN, now gone → FIXED
            await prisma.finding.update({
                where: { id: old.id },
                data: { status: "FIXED", resolvedAt: new Date() },
            });
        } else if (old.status === "FIXED" && stillPresent) {
            // Finding was FIXED, re-appeared → REGRESSED
            await prisma.finding.update({
                where: { id: old.id },
                data: { status: "REGRESSED", resolvedAt: null },
            });
        }
        // OPEN + stillPresent → no change needed (already OPEN)
    }

    // ── Create brand-new findings ─────────────────────────────────────────────
    for (const f of newFindings) {
        if (oldById.has(f.id)) continue; // Already in DB (update handled above)

        await prisma.finding.create({
            data: {
                chunkId,
                line: f.line,
                issue: f.issue,
                why: f.why,
                hint: f.hint,
                severity: f.severity.toUpperCase(),
                status: "OPEN",
                chunkHashAtDetection: newHash,
            },
        });
    }
}
