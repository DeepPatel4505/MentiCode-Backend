<div align="center">

# 🧠 Intelligence Engine v2

**AI-Powered Code Analysis Service**

[![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-qwen3:8b-000000?logo=ollama&logoColor=white)](https://ollama.com/)
[![Zod](https://img.shields.io/badge/Zod-v4-3068B7?logo=zod&logoColor=white)](https://zod.dev/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

*A multi-stage LLM pipeline that detects, validates, and explains code issues with precision.*

[Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Architecture](#-architecture) · [Configuration](#-configuration)

</div>

---

## ✨ Features

- **🔍 Multi-Stage Analysis** — Three-pass pipeline (Detect → Validate → Explain) that reduces false positives
- **🛡️ Schema-Validated Output** — Every LLM response is validated against strict Zod schemas
- **🔄 Automatic Retries** — Resilient retry mechanism with graceful fallback on LLM failures
- **📍 Line-Level Precision** — Findings include exact line ranges for pinpoint issue location
- **📊 Confidence Scoring** — Each finding carries a confidence score (0–1) with configurable threshold filtering
- **🩺 Guided Fixes** — Final output includes severity ratings, explanations, and step-by-step fix guidance
- **⚙️ Enterprise-Grade Infrastructure** — Centralized config, structured logging, request validation, CORS, graceful shutdown
- **⏱ Nanosecond Timing** — `process.hrtime.bigint()` for highest-precision performance measurement at every pipeline stage

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|------------|---------|
| [Node.js](https://nodejs.org/) | ≥ 18 |
| [Ollama](https://ollama.com/) | Latest |

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/intelligence-enginev2.git
cd intelligence-enginev2
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment (optional)

Create a `.env` file to override defaults:

```env
PORT=4002
NODE_ENV=development
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=qwen3:8b
MODEL_TEMPERATURE=0
MODEL_MAX_TOKENS=400
MODEL_TIMEOUT_MS=60000
MIN_CONFIDENCE=0.6
MAX_FINDINGS=8
MAX_RETRIES=2
LOG_LEVEL=DEBUG
```

### 4. Start Ollama with the required model

```bash
ollama pull qwen3:8b
ollama serve          # runs on http://localhost:11434
```

### 5. Start the service

```bash
npm start
```

Expected log output:
```
[2026-02-18T16:27:04.495Z] [INFO] Intelligence Engine v2 running {"port":4002,"env":"development","model":"qwen3:8b"}
```

### 6. Verify with health check

```bash
curl http://localhost:4002/health
```

```json
{ "status": "ok", "uptime": 13.61, "timestamp": "2026-02-18T16:27:17.861Z" }
```

### 7. Send a test request

```bash
curl -X POST http://localhost:4002/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "language": "javascript",
    "code": "function test(a) {\n  if (a == null) {\n    console.log(\"invalid\");\n  }\n  return a + 1;\n}\n\ntest();"
  }'
```

---

## 📡 API Reference

### `GET /health`

Health check endpoint.

**Response (200):**
```json
{
  "status": "ok",
  "uptime": 13.61,
  "timestamp": "2026-02-18T16:27:17.861Z"
}
```

### `POST /analyze`

Analyze source code for bugs, security issues, and performance problems.

#### Request

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | ✅ | Source code to analyze (non-empty) |
| `language` | `string` | ❌ | Programming language of the submitted code |

```json
{
  "language": "javascript",
  "code": "function foo(x) { return x + 1; }"
}
```

#### Success Response (200)

```json
{
  "findings": [
    {
      "line_range": [2, 4],
      "category": "bug",
      "severity": "major",
      "issue": "Short description of the issue",
      "why_it_matters": "Detailed explanation of impact",
      "hint": "Quick suggestion for the developer",
      "guided_fix": "Step-by-step fix instructions",
      "confidence": 0.85
    }
  ]
}
```

#### Validation Error Response (400)

```json
{
  "error": true,
  "statusCode": 400,
  "message": "Invalid request body.",
  "details": ["'code' is required."]
}
```

#### Finding Fields

| Field | Type | Values |
|-------|------|--------|
| `line_range` | `[number, number]` | Start and end line numbers |
| `category` | `string` | `bug` · `security` · `performance` |
| `severity` | `string` | `minor` · `major` · `critical` |
| `issue` | `string` | Concise issue description |
| `why_it_matters` | `string` | Impact explanation |
| `hint` | `string` | Quick developer hint |
| `guided_fix` | `string` | Detailed fix instructions |
| `confidence` | `number` | Confidence score (0–1) |

---

## 🏗️ Architecture

### Analysis Pipeline

```
┌──────────────┐       ┌───────────┐     ┌────────────┐     ┌───────────┐
│  Input Code  │ ───▶ │  Detect   │───▶ │  Validate  │───▶ │  Explain  │
│              │       │  (LLM)    │     │  (LLM)     │     │  (LLM)    │
└──────────────┘       └─────┬─────┘     └─────┬──────┘     └─────┬─────┘
       │                   │                 │                  │
  Line numbers         Zod schema       Zod schema         Zod schema
  added by             validation       validation         validation
  preprocessor                                                 │
                                                               ▼
                                                     ┌─────────────────┐
                                                     │  Final Findings │
                                                     │  with severity, │
                                                     │  explanations & │
                                                     │  guided fixes   │
                                                     └─────────────────┘
```

### Project Structure

```
intelligence-enginev2/
├── src/
│   ├── index.js                   # Express server, routes, graceful shutdown
│   ├── config.js                  # Centralized env-backed configuration
│   ├── core/
│   │   ├── pipeline.js            # Analysis orchestrator with hrtime timing
│   │   ├── model-client.js        # Ollama LLM interface with timeout
│   │   ├── validator.js           # Multi-step output sanitizer
│   │   └── schema/
│   │       ├── detect.schema.js   # Detection output schema (Zod)
│   │       ├── validate.schema.js # Validation output schema (Zod)
│   │       ├── explain.schema.js  # Explanation output schema (Zod)
│   │       ├── final.schema.js    # Final combined output schema (Zod)
│   │       └── index.js           # Barrel exports
│   ├── middleware/
│   │   ├── error-handler.js       # Global error handling middleware
│   │   └── validate-request.js    # Request body validation
│   ├── prompts/
│   │   ├── detect.js              # Detection prompt builder
│   │   ├── validate.js            # Validation prompt builder
│   │   └── explain.js             # Explanation prompt builder
│   └── utils/
│       ├── logger.js              # Structured logger with nanosecond timer
│       ├── retry.js               # Retry handler with schema validation
│       └── code-preproccess.js    # Line number preprocessor
├── test-run.js                    # Standalone test script
├── package.json
├── .env                           # Environment config (gitignored)
├── .gitignore
├── IMPLEMENTATION_SUMMARY.md
├── README.md
└── TODO.md
```

---

## ⚙️ Configuration

All configuration is managed in `src/config.js`, backed by environment variables loaded from `.env` via [dotenv](https://github.com/motdotla/dotenv).

| Parameter | Env Variable | Default |
|-----------|-------------|---------|
| Server port | `PORT` | `4002` |
| Environment | `NODE_ENV` | `development` |
| Ollama endpoint | `OLLAMA_URL` | `http://localhost:11434/api/generate` |
| LLM model | `OLLAMA_MODEL` | `qwen3:8b` |
| Temperature | `MODEL_TEMPERATURE` | `0` (deterministic) |
| Top P | `MODEL_TOP_P` | `1` |
| Top K | `MODEL_TOP_K` | `40` |
| Max tokens | `MODEL_MAX_TOKENS` | `400` |
| Request timeout | `MODEL_TIMEOUT_MS` | `60000` (60s) |
| Confidence threshold | `MIN_CONFIDENCE` | `0.6` |
| Max findings | `MAX_FINDINGS` | `8` |
| Retry attempts | `MAX_RETRIES` | `2` |
| Body size limit | `BODY_LIMIT` | `1mb` |
| Log level | `LOG_LEVEL` | `DEBUG` |

---

## 🧩 How It Works

### Stage 1 — Detect

The LLM scans the line-numbered code for **functional, security, and performance** issues. It is explicitly instructed to ignore style suggestions and avoid inventing imaginary problems. Output is an array of findings with `line_range`, `category`, `reason`, and `confidence`.

### Stage 2 — Validate

The detected findings are fed back to the LLM alongside the original code. The model is asked to remove any findings that are speculative, not directly supported by the code, or have incorrect line ranges. No new findings are added.

### Stage 3 — Explain

Validated findings are enriched with `severity`, `issue` description, `why_it_matters`, a developer `hint`, and a `guided_fix`. Line ranges and categories are preserved exactly as validated.

---

## 🔒 Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Invalid request body | `400` with detailed validation errors |
| LLM returns invalid JSON | Retries up to configured attempts, then returns `{ findings: [] }` |
| Schema validation fails | Finding excluded from results |
| Invalid line ranges | Removed by validator |
| Low confidence findings | Filtered by threshold (< 0.6) |
| Ollama unreachable / timeout | Error caught by retry handler; structured error logged |
| Unhandled server error | Global error handler returns consistent JSON error |
| SIGTERM / SIGINT | Graceful shutdown with 10s connection drain |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js ≥ 18 (ES Modules) |
| **Framework** | Express.js |
| **LLM Backend** | Ollama — `qwen3:8b` |
| **Schema Validation** | Zod v4 |
| **HTTP Client** | Native `fetch` API |
| **Configuration** | dotenv |
| **CORS** | cors middleware |

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ as part of <strong>MentiCode</strong></sub>
</div>
