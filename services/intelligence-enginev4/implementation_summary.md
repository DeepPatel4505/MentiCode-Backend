# Intelligence Engine v4 (IE4) Implementation Summary

## Overview
**Intelligence Engine v4 (IE4)** is an Express backend service responsible for interacting with external Large Language Models (LLMs) to perform automated code reviews and project-wide analysis. It is designed to be highly resilient and production-ready, featuring dynamic LLM provider fallback routing and strict JSON output validation.

## Tech Stack
* **Runtime**: Node.js (v20+)
* **Framework**: Express (`^5.2.1`)
* **Shared Libraries**: Consumes standard utilities (`logger`, `ApiError`, `ApiResponse`) from the monorepo's `@menticode/shared` package.
* **Security & Utility Middlewares**: `helmet`, `cors`, structured JSON payload restrictions (limit: `256kb`).

## Core API Endpoints

### 1. Code Review (`POST /code_review`)
Performs a deep-dive analysis on a single file.
* **Controller**: `src/controllers/review.controller.js`
* **Payload requirements**:
  * `language` (String): Non-empty.
  * `code` (String): Non-empty, max 50,000 characters.
  * `mode` (String, Optional): `"guided"` (default) or `"full"`.
* **Output Example**:
  ```json
  {
    "summary": { "risk_level": "low", "overall_quality": 84 },
    "findings": [ { "line": 5, "severity": "medium", "issue": "..." } ],
    "meta": { "provider": "gemini", "latency_ms": 1205 }
  }
  ```

### 2. Project Summary (`POST /project_summary`)
Analyzes multiple files together to generate a workspace-level architectural overview.
* **Controller**: `src/controllers/project.controller.js`
* **Payload requirements**:
  * `files` (Array): Mandatory, max 50 items. Each item must contain a non-empty `language` and `code` string (`code` max 50,000 chars).

### 3. Healthcheck (`GET /health`)
Standard service readiness probe.

## Advanced LLM Configuration (`src/llm/router.js`)
IE4 implements a highly resilient, cross-provider "LLM Router":
* **Supported Providers**: Integrates natively with **Gemini**, **Groq**, **OpenAI**, and **Ollama**.
* **Startup Strictness**: Providers are spun up based on environment variables (e.g., `GEMINI_API_KEY`). If no valid providers are registered, **the server throws a fatal error and refuses to start**. Mock static data has been entirely stripped to ensure robust production operations.
* **Fallback Strategy**: The router loops through the available providers. If one goes down or times out (default 20_000ms), it automatically attempts the next provider.
* **Output Validation**: Leverages custom extraction helpers (`extractFirstJSONObject`, `stripMarkdownCodeFences`) to sanitize LLM responses. Extracted JSON is then enforced against a strict schema (must contain `summary` object and `findings` array). If parsing fails, an `InvalidProviderResponseError` triggers a router fallback.

## Logging & Monitoring
* Replaces legacy `console.log` statements with `@menticode/shared` structured `logger.base` logic.
* Records request/response lifecycles securely in `src/middleware/requestLogger.js`.
* Emits server lifecycle telemetry inside `src/server.js` (`server_started`, `server_stopped`).
