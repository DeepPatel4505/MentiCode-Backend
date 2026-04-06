# MentiCode Backend

Backend workspace for MentiCode, organized as a multi-service monorepo with shared packages, domain-focused services, and multiple intelligence engine iterations.

## Overview

This workspace contains:

- Service-oriented backend applications (gateway, auth, analyzer, course, intelligence engines).
- Shared packages reused across services.
- Infrastructure and architecture documentation.
- Utility scripts for running multiple services together in development.

## Repository Layout

```text
backend/
├── auth/                    # Standalone auth workspace package
├── docs/                    # Architecture notes and analysis artifacts
├── infrastructure/          # Infra and deployment-related assets
├── packages/
│   └── shared/              # Reusable cross-service code
├── scripts/
│   └── run-all.mjs          # Multi-service runner
├── services/
│   ├── analyzer-service/
│   ├── auth-service/
│   ├── course-service-demo/
│   ├── gateway/
│   ├── github-service/
│   ├── intelligence-engine/
│   ├── intelligence-enginev2/
│   ├── intelligence-enginev3/
│   ├── intelligence-enginev4/
│   ├── learning-service/
│   └── notification-service/
└── package.json             # Workspace root configuration
```

## Workspace Model

The root uses npm workspaces:

- `packages/*`
- `services/*`
- `auth`

This allows installing dependencies and running scripts per workspace from the backend root.

## Prerequisites

- Node.js 18+
- npm 9+

Some services may have additional runtime requirements (for example, databases, Python runtime, or service-specific environment variables). Check the README inside each service directory for details.

## Getting Started

From the backend root:

```bash
npm install
```

### Run Core Services in Development

```bash
npm run dev:all
```

This runs the default service set configured in `scripts/run-all.mjs`:

- `gateway`
- `auth`
- `analyzer`
- `course-service`
- `intelligence-enginev3`

### Run Core Services in Start Mode

```bash
npm run start:all
```

### Run a Single Service Group

```bash
npm run dev:course
```

### Run Selected Services

PowerShell:

```powershell
$env:SERVICES = "gateway,auth"
node scripts/run-all.mjs dev
```

Bash:

```bash
SERVICES=gateway,auth node scripts/run-all.mjs dev
```

## Useful Scripts

- `npm run dev:all`: Run default backend services in development mode.
- `npm run start:all`: Run default backend services in start mode.
- `npm run dev:course`: Run development flow focused on the course service.

## Environment Notes

- `SERVICES` (or `SERVICE`): Comma-separated service IDs for targeted runs.
- `CMD`: Script name override for `run-all.mjs`.
- `MENTICODE_SERVICE_COURSE_PORT` / `COURSE_PORT`: Override course service port (default `8001`).
- `MENTICODE_SERVICE_INTELLIGENCE_ENGINEV3_PORT` / `IEV3_PORT`: Override intelligence-enginev3 port (default `4003`).
- `KILL_AFTER_MS`: Grace period before force-killing child processes on shutdown (default `2500`).

## Development Guidance

- Keep service boundaries explicit and avoid cross-service coupling.
- Place reusable logic in `packages/shared` rather than duplicating it in services.
- Keep API contracts and environment variables documented per service.
- Add or update tests in the corresponding service when behavior changes.

## Documentation

Architecture and analysis artifacts are available under `docs/`, including engine evolution notes in `docs/EngineAnalysis/`.

## Contribution

1. Create a feature branch.
2. Implement changes in the relevant service or shared package.
3. Run service-level tests and checks.
4. Open a pull request with clear scope, test evidence, and migration notes (if applicable).