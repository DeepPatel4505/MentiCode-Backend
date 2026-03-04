# Backend Summary

This backend is organized as a microservices workspace with shared platform components and service-specific implementations.

## High-Level Structure

```text
backend/
├── docs/
│   └── EngineAnalysis/
│       ├── EngineAnalysis.md
│       ├── breif.md
│       └── imgs/
│           ├── charts/
│           ├── v1/
│           ├── v2/
│           └── v3/
├── infrastructure/
├── services/
│   ├── analyzer-service/
│   │   ├── app/
│   │   └── tests/
│   ├── api-gateway/
│   │   └── app/
│   ├── auth-service/
│   │   ├── app/
│   │   └── tests/
│   ├── github-service/
│   │   ├── app/
│   │   └── tests/
│   ├── intelligence-engine/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   ├── domain/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   ├── tests/
│   │   │   ├── integration/
│   │   │   ├── service/
│   │   │   └── unit/
│   │   ├── requirements.txt
│   │   ├── requirements-dev.txt
│   │   ├── pytest.ini
│   │   └── implementation and coverage reports
│   ├── intelligence-enginev2/
│   │   ├── src/
│   │   │   ├── core/
│   │   │   ├── middleware/
│   │   │   ├── prompts/
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── README.md
│   ├── intelligence-enginev3/
│   │   ├── src/
│   │   ├── test/
│   │   ├── scripts/
│   │   ├── package.json
│   │   └── README.md
│   ├── learning-service/
│   │   ├── app/
│   │   └── tests/
│   └── notification-service/
│       ├── app/
│       └── tests/
└── shared/
```

## Directory Responsibilities

- **docs/**: Architecture notes, analysis artifacts, and diagrams for backend evolution.
- **infrastructure/**: Environment and deployment-related backend infrastructure assets.
- **services/**: Business capabilities split by service boundary (gateway, auth, analyzer, GitHub, intelligence, learning, notifications).
- **shared/**: Reusable backend code, contracts, or utilities intended for cross-service usage.

## Service Layer Pattern

Most services follow this structure:

- **app/**: Runtime application code (API handlers, business logic, integrations).
- **tests/**: Unit/integration tests scoped to the service.

## Intelligence Engine Versions

There are multiple intelligence-engine implementations in parallel:

- **intelligence-engine/**: Python-based implementation with layered `core/domain/services/utils` modules and pytest coverage artifacts.
- **intelligence-enginev2/**: Node.js implementation with modularized source folders.
- **intelligence-enginev3/**: Newer Node.js iteration with scripts and dedicated tests.

This suggests an active migration/iteration path where multiple versions coexist for comparison, phased rollout, or experimentation.
