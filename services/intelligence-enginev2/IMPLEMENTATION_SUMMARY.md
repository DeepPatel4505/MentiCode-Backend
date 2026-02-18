# Intelligence Engine v2 — Implementation Summary

## Project Overview

Intelligence Engine v2 is a Node.js-based AI-powered code analysis microservice that leverages large language models to detect, validate, and explain code issues. It runs on a configurable port (default **4002**) and exposes a REST API that accepts source code and returns structured findings with severity, confidence scores, and guided fixes.

---

## Architecture

### High-Level Data Flow

```
Input Code
    ↓
[Preprocess] — Add line numbers for precise location tracking
    ↓
[Detect]     — LLM identifies potential bugs, security & performance issues
    ↓
[Validate]   — LLM filters speculative / incorrect findings
    ↓
[Explain]    — LLM enriches findings with severity, explanation & guided fixes
    ↓
[Output]     — Structured JSON with findings array
```

Each stage is wrapped in a **retry handler** that attempts up to a configurable number of calls (default 2) and validates output against a **Zod schema** before proceeding. Every stage is timed with `process.hrtime.bigint()` for nanosecond-precision performance logging.

---

### Core Components

#### 1. Entry Point — `src/index.js`

- Express.js HTTP server with CORS, body size limits, and graceful shutdown
- `GET /health` — health check endpoint returning uptime and timestamp
- `POST /analyze` — code analysis endpoint with request validation middleware
- Global error-handling middleware with consistent JSON error responses
- Graceful shutdown on `SIGTERM` / `SIGINT` with 10s drain timeout
- All configuration sourced from centralized `config.js`

#### 2. Configuration — `src/config.js`

- Centralized, environment-backed configuration using `dotenv`
- All values frozen with `Object.freeze()` to prevent accidental mutation
- Covers: server port, Node environment, Ollama URL/model/parameters, analysis thresholds, body limit

#### 3. Pipeline — `src/core/pipeline.js`

- **`analyze(code)`** — main orchestrator function
- Runs three sequential LLM stages: **Detect → Validate → Explain**
- Each stage timed with `process.hrtime.bigint()` and logged via structured logger
- Total analysis duration logged in seconds with nanosecond precision (9 decimal places)

#### 4. Model Client — `src/core/model-client.js`

- **`runModel(prompt)`** — sends prompts to a local Ollama instance
- Uses `AbortController` with configurable timeout (default 60s)
- Structured error messages for timeouts, HTTP errors, and network failures
- All parameters (URL, model, temperature, top_p, top_k, max tokens) from config

#### 5. Validator — `src/core/validator.js`

- **`validateModelOutput(rawOutput, options)`** — multi-step sanitization of raw LLM JSON
- **Validation pipeline**:
  1. Safe JSON parse (returns empty findings on failure)
  2. Zod schema validation against `DetectOutputSchema`
  3. Line range enforcement (`start ≥ 1`, `end ≤ totalLines`, `start ≤ end`)
  4. Confidence threshold filtering (configurable, default `≥ 0.6`)
  5. Duplicate removal (keyed on `category + line_range + issue`)
  6. Result capping (configurable, default max **8** findings)
- Logs each step with structured logger

#### 6. Retry Handler — `src/utils/retry.js`

- **`safeRun(prompt, schema)`** — resilience wrapper used by the pipeline
- Configurable retry count (default 2 attempts)
- Logs each attempt and failure with structured logger
- Falls back to `{ findings: [] }` on complete failure

#### 7. Logger — `src/utils/logger.js`

- Structured logger with `[DEBUG]`, `[INFO]`, `[WARN]`, `[ERROR]` levels
- ISO-8601 timestamps on every log line
- JSON metadata support for structured fields
- **High-resolution timer**: `startTimer()` / `endTimer()` / `logStageTime()` using `process.hrtime.bigint()` (nanosecond precision, formatted in seconds)
- Log level configurable via `LOG_LEVEL` environment variable

#### 8. Code Preprocessor — `src/utils/code-preproccess.js`

- **`numberLines(code)`** — prepends `1: `, `2: `, etc. to each line
- Enables the LLM to reference precise line locations in its output

---

### Middleware

#### Error Handler — `src/middleware/error-handler.js`

- Global Express error-handling middleware (registered last)
- Returns consistent `{ error, statusCode, message }` JSON responses
- Hides stack traces in production; logs full traces in development

#### Request Validator — `src/middleware/validate-request.js`

- Validates `POST /analyze` body: `code` is required non-empty string
- Validates `language` type if present
- Returns `400` with detailed error messages on invalid input

---

### Schema Definitions — `src/core/schema/`

All schemas are defined with **Zod v4** and enforce strict typing on LLM outputs.

| File | Schema | Key Fields |
|------|--------|------------|
| `detect.schema.js` | `DetectOutputSchema` | `line_range`, `category` (bug / security / performance), `reason`, `confidence` (optional) |
| `validate.schema.js` | `ValidateOutputSchema` | Reuses `DetectFindingSchema`, max 12 findings |
| `explain.schema.js` | `ExplainOutputSchema` | `line_range`, `category`, `severity` (minor / major / critical), `issue`, `why_it_matters`, `hint`, `guided_fix`, `confidence` |
| `final.schema.js` | `FinalOutputSchema` | Adds `version: "v2"`, `summary` (risk_level, overall_quality), plus `ExplainFindingSchema` findings |
| `index.js` | Barrel export | Proper ESM re-exports for all schemas |

---

### Prompt Modules — `src/prompts/`

| File | Builder Function | Purpose |
|------|-----------------|---------|
| `detect.js` | `buildDetectPrompt(code)` | Instructs the LLM to find functional/security bugs; ignores style issues |
| `validate.js` | `buildValidatePrompt(code, findings)` | Instructs the LLM to remove unsubstantiated or speculative findings |
| `explain.js` | `buildExplainPrompt(code, findings)` | Instructs the LLM to enrich each finding with severity, explanation, and a guided fix |

---

## API Reference

### `GET /health`

**Response (200):**
```json
{
  "status": "ok",
  "uptime": 13.61,
  "timestamp": "2026-02-18T16:27:17.861Z"
}
```

### `POST /analyze`

**Request body:**
```json
{
  "language": "javascript",
  "code": "function foo(x) { return x + 1; }"
}
```

**Response body (from Explain stage):**
```json
{
  "findings": [
    {
      "line_range": [2, 4],
      "category": "bug",
      "severity": "major",
      "issue": "Short description of the issue",
      "why_it_matters": "Detailed explanation of impact",
      "hint": "Quick suggestion",
      "guided_fix": "Step-by-step fix instructions",
      "confidence": 0.85
    }
  ]
}
```

**Error response (400):**
```json
{
  "error": true,
  "statusCode": 400,
  "message": "Invalid request body.",
  "details": ["'code' is required."]
}
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 18 (ES Modules) |
| Framework | Express.js |
| LLM Backend | Ollama (`qwen3:8b`) |
| Validation | Zod v4 |
| HTTP Client | Native `fetch` API |
| Config | dotenv |
| CORS | cors middleware |

---

## Configuration

All configuration is managed in `src/config.js` and backed by environment variables (loaded from `.env` via dotenv).

| Parameter | Env Variable | Default |
|-----------|-------------|---------|
| Server port | `PORT` | `4002` |
| Environment | `NODE_ENV` | `development` |
| Ollama endpoint | `OLLAMA_URL` | `http://localhost:11434/api/generate` |
| LLM model | `OLLAMA_MODEL` | `qwen3:8b` |
| Temperature | `MODEL_TEMPERATURE` | `0` |
| Top P | `MODEL_TOP_P` | `1` |
| Top K | `MODEL_TOP_K` | `40` |
| Max token prediction | `MODEL_MAX_TOKENS` | `400` |
| Request timeout | `MODEL_TIMEOUT_MS` | `60000` |
| Confidence threshold | `MIN_CONFIDENCE` | `0.6` |
| Max findings | `MAX_FINDINGS` | `8` |
| Retry attempts | `MAX_RETRIES` | `2` |
| Body size limit | `BODY_LIMIT` | `1mb` |
| Log level | `LOG_LEVEL` | `DEBUG` |

---

## Error Handling Strategy

| Scenario | Behaviour |
|----------|-----------|
| Invalid request body | 400 with detailed validation errors |
| LLM returns invalid JSON | Retries up to configured attempts, then returns `{ findings: [] }` |
| Schema validation fails | Finding excluded from results |
| Invalid line ranges | Removed by validator |
| Low confidence findings | Filtered by threshold |
| Ollama unreachable / timeout | Error caught by retry handler; structured error logged |
| Unhandled server error | Global error handler returns consistent JSON error response |
| SIGTERM / SIGINT | Graceful shutdown with 10s connection drain timeout |
