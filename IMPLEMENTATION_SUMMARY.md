# Backend Implementation Summary
## MentiCode Backend Monorepo

Last Updated: April 6, 2026

---

## 1. Executive Summary

The backend is implemented as an npm workspace monorepo that groups multiple domain services, shared packages, and operational scripts under a single development boundary.

The current implementation emphasizes:
- Service isolation by business capability.
- Shared code reuse through internal packages.
- Parallel service orchestration for local development.
- Iterative intelligence-engine development across multiple versions.

This structure supports independent service evolution while preserving a unified developer workflow.

---

## 2. Current Implementation Scope

### Monorepo and Workspace Configuration

The backend root is configured as a private npm workspace with:
- `packages/*`
- `services/*`
- `auth`

Root scripts are implemented for multi-service orchestration:
- `npm run dev:all`
- `npm run start:all`
- `npm run dev:course`

These scripts are executed via `scripts/run-all.mjs`.

### High-Level Directory Responsibilities

- `auth/`: Standalone auth workspace package included in root workspaces.
- `docs/`: Architecture notes, engine analysis, and supporting design artifacts.
- `infrastructure/`: Infrastructure and deployment-related material.
- `packages/shared/`: Cross-service reusable code.
- `services/`: Service implementations split by domain boundaries.
- `scripts/`: Operational tooling for local orchestration.

---

## 3. Service Implementation Inventory

The `services/` layer currently includes:
- `analyzer-service`
- `auth-service`
- `course-service-demo`
- `gateway`
- `github-service`
- `intelligence-engine`
- `intelligence-enginev2`
- `intelligence-enginev3`
- `intelligence-enginev4`
- `learning-service`
- `notification-service`

### Active Default Runtime Set

By implementation in `scripts/run-all.mjs`, the default runtime set for `dev:all` and `start:all` is:
- `gateway`
- `auth`
- `analyzer`
- `course-service`
- `intelligence-enginev3`

This indicates a practical core path for end-to-end local development.

---

## 4. Orchestration and Runtime Design

The multi-service runner (`scripts/run-all.mjs`) provides:
- Dynamic script selection (`dev`, `start`, or custom workspace script).
- Optional selective startup via `SERVICES`/`SERVICE`.
- Service-specific environment overrides (for example, port assignment).
- Prefixed aggregated logging for concurrent service processes.
- Coordinated shutdown behavior with graceful SIGINT handling and fallback force-kill timeout.

### Relevant Runtime Environment Variables

- `SERVICES` or `SERVICE`: Comma-separated service IDs for selective startup.
- `CMD`: Script override for workspace command execution.
- `MENTICODE_SERVICE_COURSE_PORT` or `COURSE_PORT`: Course service port override.
- `MENTICODE_SERVICE_INTELLIGENCE_ENGINEV3_PORT` or `IEV3_PORT`: Intelligence engine v3 port override.
- `KILL_AFTER_MS`: Shutdown grace period before forced termination.

---

## 5. Intelligence Engine Evolution

The backend includes multiple intelligence-engine implementations in parallel:
- `intelligence-engine` (Python-based implementation path).
- `intelligence-enginev2` (Node.js implementation with staged LLM analysis pipeline).
- `intelligence-enginev3` (newer Node.js iteration used in default runtime set).
- `intelligence-enginev4` (next iteration present in repository).

This indicates an intentional progressive evolution strategy where versions may coexist for validation, migration, and rollout control.

---

## 6. Delivery Status Snapshot

### Implemented and Operationally Evident

- Workspace-level script orchestration is implemented and wired.
- Domain-oriented service segmentation is established.
- Shared package location is defined for code reuse.
- Core services for local integrated development are configured.

### Pending Centralization Opportunities

- Root-level testing and quality gates are not centralized in `backend/package.json`.
- Unified cross-service CI status is not represented at the backend root.
- Consolidated service contracts and dependency map can be formalized further.

---

## 7. Engineering Recommendations

1. Add root-level quality scripts (`lint`, `test`, `typecheck`, `format:check`) that fan out to workspaces.
2. Introduce a service registry document with standard metadata (port, ownership, runtime, health endpoint).
3. Standardize service-level READMEs around a common contract template.
4. Add a root-level CI workflow that validates all changed workspaces.
5. Define environment variable schema validation for each runtime service.

---

## 8. Conclusion

The backend implementation is structurally mature as a service-oriented monorepo, with clear boundaries and practical local orchestration in place. The current foundation is suitable for continued scaling, with the highest leverage coming from centralized quality automation, standardized service contracts, and explicit governance across evolving intelligence engine versions.
