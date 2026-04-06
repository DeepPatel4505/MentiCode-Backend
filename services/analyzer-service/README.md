# analysis-service

Production-ready analyzer service with async queue processing and realtime job lifecycle events.

## Processes

Run API and worker as separate processes:

- `node src/server.js`
- `node src/workers/analysis.worker.js`

Or with PM2:

- `pm2 start src/server.js --name analyzer-api`
- `pm2 start src/workers/analysis.worker.js --name analyzer-worker`

## Required Environment Variables

- `DATABASE_URL`
- `JWT_SECRET`
- `REDIS_HOST`
- `REDIS_PORT`
- `ENGINE_URL`
- `ANALYSIS_ENGINE_TIMEOUT_MS` (default `30000`)
- `ANALYSIS_WORKER_CONCURRENCY` (default `5`)
- `NODE_ENV` (use `production` in prod)

## HTTP Endpoints

- `POST /api/v1/analysis/playgrounds/:playgroundId/files/:fileId/analyze`
- `GET /api/v1/analysis/jobs/:jobId`
- `GET /api/v1/analysis/jobs/:jobId/result`

All analysis/admin endpoints require JWT Bearer auth.

## Admin Queue Dashboard

- `GET /admin/queues`

Requires JWT with role `admin`.

## WebSocket Realtime Updates

Endpoint:

- `ws://<host>:<port>/ws?token=<JWT>`

Client messages:

- Subscribe: `{ "type": "subscribe", "jobId": "<jobId>" }`
- Unsubscribe: `{ "type": "unsubscribe", "jobId": "<jobId>" }`
- Ping: `{ "type": "ping" }`

Server messages:

- `{ "type": "connection.ready" }`
- `{ "type": "subscribed", "jobId": "..." }`
- `{ "type": "job.running", "jobId": "...", "status": "running" }`
- `{ "type": "job.completed", "jobId": "...", "status": "completed", "engineLatencyMs": 123 }`
- `{ "type": "job.failed", "jobId": "...", "status": "failed" }`
