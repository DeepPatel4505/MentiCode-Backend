# Analyzer Service API Docs (Frontend Integration)

## 1) Quick Overview

- **Service Base URL (HTTP):** `http://<host>:<port>`
- **API prefix:** `/api/v1`
- **Analysis API prefix:** `/api/v1/analysis`
- **WebSocket URL:** `ws://<host>:<port>/ws?token=<JWT>`
- **Auth:** JWT Bearer required for all `/api/v1/analysis/*` and `/admin/queues`
- **Default local port:** `3000` (unless `PORT` env is set)

---

## 2) Authentication

### Required header (HTTP)

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

### JWT claims expected by backend

- `sub` (**required**) => user ID (UUID string expected by DB usage)
- `role` (optional, required as `admin` for admin queue dashboard)
- `plan` (optional, forwarded into `req.user.plan`)

### Auth errors

- Missing/invalid token => `401`

```json
{ "error": "Unauthorized" }
```

- Authenticated but non-admin on admin route => `403`

```json
{ "error": "Forbidden" }
```

---

## 3) Data Types and Enums

### Enums used by API

- `SourceType`: `upload | github`
- `JobStatus`: `pending | running | completed | failed`

### ID types

All IDs are UUID strings:

- `playgroundId`
- `fileId`
- `jobId`
- `userId` (JWT `sub`)

---

## 4) Common Response/Error Pattern

### Success responses

Most analysis endpoints return plain JSON objects/arrays.

### Error responses

Standard error envelope:

```json
{ "error": "<message>" }
```

Common messages:

- `Unauthorized` (`401`)
- `Forbidden` (`403`)
- `Not found` (`404`)  
  (used for missing resources **and** cross-user ownership violations)
- `Validation failed` (`400`)
- `Result not ready` (`409`)
- `Analysis failed` (`422`)
- `Failed to enqueue analysis job` (`422`)

---

## 5) REST API Reference

## 5.1 Health / Root

### `GET /api/v1/`

Returns service welcome/version payload.

Example:

```json
{
  "message": "Welcome to the Analyzer Service API",
  "data": { "version": "1.0.0" }
}
```

> This route is not protected by JWT.

---

## 5.2 Playgrounds

### `POST /api/v1/analysis/playgrounds`

Create a playground for the authenticated user.

#### Request body

```ts
interface CreatePlaygroundRequest {
  name: string;                          // required, trimmed, non-empty
  sourceType?: "upload" | "github";     // default: "upload"
  repoId?: string;                       // required if sourceType === "github"
  files?: Array<{
    name: string;                        // required for each file to be created
    language?: string;                   // default: "plaintext"
    storagePath?: string;                // if omitted, backend auto-generates path
  }>;
}
```

#### Validation rules

- `name` must be present and non-empty after trim
- `sourceType` must be `upload` or `github`
- If `sourceType = github`, `repoId` is required

Validation failure:

```http
400 Bad Request
```

```json
{ "error": "Validation failed" }
```

#### Response

```http
201 Created
```

```ts
interface CreatePlaygroundResponse {
  id: string;
  name: string;
  sourceType: "upload" | "github";
  createdAt: string; // ISO datetime
}
```

#### Example request

```json
{
  "name": "My First Playground",
  "sourceType": "upload",
  "files": [
    {
      "name": "app.js",
      "language": "javascript",
      "storagePath": "inline://function%20add(a%2Cb)%7Breturn%20a%2Bb%3B%7D"
    }
  ]
}
```

---

### `GET /api/v1/analysis/playgrounds`

List authenticated user playgrounds.

#### Response

```http
200 OK
```

```ts
type ListPlaygroundsResponse = Array<{
  id: string;
  name: string;
  sourceType: "upload" | "github";
}>;
```

Notes:

- Ordered by newest first (`createdAt desc` in backend)
- User-scoped automatically via JWT `sub`

---

## 5.3 Files

### `GET /api/v1/analysis/playgrounds/:playgroundId/files`

List files inside a playground owned by authenticated user.

#### Path params

- `playgroundId` (UUID)

#### Responses

```http
200 OK
```

```ts
type ListFilesResponse = Array<{
  id: string;
  name: string;
  language: string;
}>;
```

```http
404 Not Found
```

```json
{ "error": "Not found" }
```

`404` is returned for both:

- invalid/nonexistent playground
- playground not owned by current user

---

## 5.4 Jobs / Analysis

### `POST /api/v1/analysis/playgrounds/:playgroundId/files/:fileId/analyze`

Starts async analysis by enqueueing a BullMQ job.

#### Path params

- `playgroundId` (UUID)
- `fileId` (UUID)

#### Request body

- none

#### Success response

```http
202 Accepted
```

```ts
interface StartAnalysisResponse {
  jobId: string;
  status: "pending" | "running";
}
```

Notes:

- If there is already an in-flight job (`pending`/`running`) for the same file, backend returns that existing job instead of creating a new one.

#### Error responses

- `404 { "error": "Not found" }` for invalid/missing/non-owned file/playground
- `422 { "error": "Failed to enqueue analysis job" }` if queue enqueue fails

---

### `GET /api/v1/analysis/jobs/:jobId`

Get current job status for a user-owned job.

#### Path params

- `jobId` (UUID)

#### Response

```http
200 OK
```

```ts
interface GetJobStatusResponse {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
}
```

#### Error

```http
404 Not Found
```

```json
{ "error": "Not found" }
```

---

### `GET /api/v1/analysis/jobs/:jobId/result`

Get completed analysis result for a user-owned job.

#### Path params

- `jobId` (UUID)

#### Success response

```http
200 OK
```

```ts
interface GetJobResultResponse {
  fileId: string;
  summary: Record<string, unknown>;  // JSON from analysis engine
  findings: unknown[];               // JSON array from analysis engine
}
```

#### State-dependent responses

- Job still running:

```http
409 Conflict
```

```json
{ "error": "Result not ready" }
```

- Job failed:

```http
422 Unprocessable Entity
```

```json
{ "error": "Analysis failed" }
```

- Job missing/not owned:

```http
404 Not Found
```

```json
{ "error": "Not found" }
```

---

## 5.5 Admin Queue Dashboard

### `GET /admin/queues`

Bull Board UI route for queue monitoring.

- Requires JWT auth + `role=admin`
- Returns HTML dashboard, not JSON API

Use case:

- Internal/admin frontend only

---

## 6) WebSocket API (Realtime Job Updates)

## 6.1 Connection

### Endpoint

`ws://<host>:<port>/ws?token=<JWT>`

The server also supports `Authorization: Bearer <JWT>` during WS upgrade, but browser clients usually use query token.

### Auth failure behavior

- Connection closes with code `1008` and reason `Unauthorized`.

### Server message on successful connect

```json
{ "type": "connection.ready" }
```

---

## 6.2 Client -> Server Messages

### Subscribe to job events

```json
{ "type": "subscribe", "jobId": "<jobId>" }
```

### Unsubscribe from job

```json
{ "type": "unsubscribe", "jobId": "<jobId>" }
```

### Ping

```json
{ "type": "ping" }
```

---

## 6.3 Server -> Client Messages

### Protocol/control

```json
{ "type": "connection.ready" }
```

```json
{ "type": "subscribed", "jobId": "<jobId>" }
```

```json
{ "type": "unsubscribed", "jobId": "<jobId>" }
```

```json
{ "type": "pong" }
```

### Errors

```json
{ "type": "error", "message": "Invalid message format" }
```

```json
{ "type": "error", "message": "Unsupported message type" }
```

```json
{ "type": "error", "message": "jobId is required" }
```

```json
{ "type": "error", "message": "Forbidden" }
```

### Job lifecycle events

```json
{ "type": "job.running", "jobId": "<jobId>", "status": "running" }
```

```json
{
  "type": "job.completed",
  "jobId": "<jobId>",
  "status": "completed",
  "engineLatencyMs": 123
}
```

```json
{ "type": "job.failed", "jobId": "<jobId>", "status": "failed" }
```

---

## 7) Recommended Frontend Flow

1. Create playground (`POST /playgrounds`) with file metadata.
2. List files for selected playground.
3. Start analysis for selected file.
4. Immediately:
   - open WS (if not already connected)
   - subscribe to returned `jobId`
5. In parallel, poll `GET /jobs/:jobId` as fallback (every 1-2s).
6. On `job.completed` OR polled `status=completed`, fetch `GET /jobs/:jobId/result`.
7. On `job.failed` OR polled `status=failed`, show failure state.
8. Unsubscribe from job channel after terminal state.

---

## 8) Frontend Edge Cases to Handle

- `404` on resource fetches may mean **not found or not owned** (backend intentionally hides ownership details).
- `POST .../analyze` may return existing in-flight job; do not assume a brand-new job each click.
- `GET .../result` returning `409` is normal before completion.
- In current implementation, worker can only read `storagePath` values in `inline://...` format.
  - If file content is not inline-encoded and storage integration is not present, analysis can fail.
- WS event delivery is best-effort real-time; keep polling fallback until terminal state.

---

## 9) Frontend TypeScript Contract (Copy/Paste)

```ts
export type SourceType = "upload" | "github";
export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface ApiError {
  error: string;
}

export interface Playground {
  id: string;
  name: string;
  sourceType: SourceType;
}

export interface PlaygroundCreated extends Playground {
  createdAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  language: string;
}

export interface StartAnalysisResponse {
  jobId: string;
  status: Extract<JobStatus, "pending" | "running">;
}

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
}

export interface JobResultResponse {
  fileId: string;
  summary: Record<string, unknown>;
  findings: unknown[];
}

export type WsClientMessage =
  | { type: "subscribe"; jobId: string }
  | { type: "unsubscribe"; jobId: string }
  | { type: "ping" };

export type WsServerMessage =
  | { type: "connection.ready" }
  | { type: "subscribed"; jobId: string }
  | { type: "unsubscribed"; jobId: string }
  | { type: "pong" }
  | { type: "error"; message: string }
  | { type: "job.running"; jobId: string; status: "running" }
  | { type: "job.completed"; jobId: string; status: "completed"; engineLatencyMs?: number }
  | { type: "job.failed"; jobId: string; status: "failed" };
```

---

## 10) Minimal Integration Checklist

- Attach `Authorization: Bearer <JWT>` to all protected HTTP calls.
- Include `sub` claim in JWT; include `role=admin` only for admin queue route.
- Handle `401/403/404/409/422` explicitly in UI states.
- Use both WS subscription and HTTP polling for robust UX.
- Fetch result only after terminal status `completed`.
