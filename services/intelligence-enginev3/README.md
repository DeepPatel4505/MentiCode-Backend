## Intelligence Engine v3 (Code Analysis Service)

Production-ready HTTP service that performs AI-assisted code review and returns a normalized JSON contract for downstream apps.

### API

#### `GET /health`

Returns service status.

#### `POST /code_review`

Request body:

```json
{
  "language": "javascript",
  "code": "..."
}
```

Response body (normalized):

```json
{
  "summary": {
    "risk_level": "low | medium | high",
    "overall_quality": 0
  },
  "findings": [
    {
      "category": "bug | design | security | performance | style",
      "severity": "minor | major | critical",
      "line_range": [0, 0],
      "issue": "",
      "why_it_matters": "",
      "hint": "",
      "guided_fix": "",
      "full_fix": null
    }
  ]
}
```

### Configuration

Environment variables:

- **`GEMINI_API_KEY`**: required (API key for `@google/genai`)
- **`PORT`**: optional, default `3000`
- **`NODE_ENV`**: optional, default `development`
- **`LLM_MODEL`**: optional, default `deepseek-coder:6.7b-instruct`
- **`LLM_TIMEOUT_MS`**: optional, default `20000`

Notes:
- For local development, the service will also attempt to load `src/.env` when `NODE_ENV=development`.
- Do **not** commit secrets. Use environment variables or secret stores in production.

### Run locally

```bash
npm install
npm run dev
```

### Production notes (recommended)

- Run behind a reverse proxy / API gateway (TLS termination, auth, rate limiting).
- Emit logs to stdout (JSON), collect via your platform (Kubernetes, ECS, etc.).
- Set `LLM_TIMEOUT_MS` to protect against long upstream calls.

