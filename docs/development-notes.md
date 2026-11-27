# Development Notes

## Current Status (Implemented)

### Workspace and Tooling

- [x] pnpm monorepo initialized.
- [x] TypeScript base configuration set up.
- [x] Backend, shared package, and SDK package configured in workspace.

### Backend Foundation

- [x] Fastify server setup implemented.
- [x] Environment variable loading and validation implemented.
- [x] PostgreSQL connection plugin configured.
- [x] Migration tooling configured and used.

### Website Registration

- [x] `websites` table created via migration.
- [x] Unique constraint for website domain added.
- [x] `POST /api/v1/websites` endpoint implemented.
- [x] Request and response validation implemented with shared Zod schemas.
- [x] Website ID generation implemented through database default (`uuidv7()`).
- [x] Dashboard access token generation implemented.
- [x] Recovery key generation implemented.
- [x] Credential hashing before persistence implemented using HMAC-SHA-256.
- [x] Original generated credentials returned in registration response.

### Database Schema

- [x] `visitors` table created via migration.
- [x] `sessions` table created via migration.
- [x] `events` table created via migration.
- [x] Visitor uniqueness constraint added per website.
- [x] Session uniqueness constraint added per website.
- [x] Event uniqueness constraint added per website.
- [x] Foreign key relationships between website, visitor, session, and event records configured.

### SDK

- [x] Browser bundle build configured with esbuild.
- [x] SDK initialization via script tag dataset (`data-website-id`) implemented.
- [x] Visitor ID generation and persistence in localStorage implemented.
- [x] Session ID generation and persistence implemented.
- [x] Session expiration handling implemented (30-minute inactivity threshold).
- [x] Event ID generation implemented.
- [x] Event payload creation through `track(...)` implemented.
- [x] Event submission to the backend implemented.
- [x] Automatic page view event implemented.

### Event Ingestion

- [x] Event ingestion endpoint implemented.
- [x] Event payload validation implemented.
- [x] Visitor record creation and update implemented.
- [x] Session record creation and update implemented.
- [x] Event persistence implemented.
- [x] Database transaction handling implemented for event ingestion.
- [x] Duplicate event prevention implemented using a unique constraint and `ON CONFLICT`.
- [x] Event ID used as an idempotency key.

### SDK Persistent Storage (IndexedDB)

- [x] IndexedDB database initialization implemented.
- [x] `events` object store created with compound key `[websiteId, eventId]`.
- [x] `batches` object store created with `batchId` as the key.
- [x] Storage factory implemented to encapsulate IndexedDB operations.
- [x] Event persistence implemented through `addEvent()`.
- [x] Batch creation implemented through `createBatch()`.
- [x] Pending event retrieval implemented through `getPendingEvents()`.
- [x] Pending batch retrieval implemented through `getPendingBatches()`.
- [x] Batch event retrieval implemented through `getBatchEvents()`.
- [x] Batch status updates implemented through `updateBatchStatus()`.

## Upcoming / To Do

### Testing

- [x] Configure testing environment and test tooling.
- [x] Add unit tests for backend services.
- [x] Add API integration tests for website registration.
- [x] Add API integration tests for event ingestion.
- [x] Test transaction rollback behavior.
- [x] Test duplicate event submissions and idempotency.
- [ ] Test concurrent event ingestion.
- [ ] Add SDK tests for visitor and session management.
- [ ] Test SDK event payload generation and submission.
- [ ] Add IndexedDB storage tests.
- [ ] Add batcher unit tests.

### Backend

- [ ] Implement analytics retrieval endpoints.
- [ ] Implement dashboard authentication and credential recovery flows.
- [ ] Add appropriate rate limiting and request safeguards.
- [ ] Adapt event ingestion to support batch requests.

### SDK

#### Request Batching

- [ ] Implement batcher factory and storage integration.
- [ ] Persist incoming events before attempting delivery.
- [ ] Implement batch creation and retrieval.
- [ ] Implement hybrid flushing strategy:
  - Flush when the batch reaches 10 events.
  - Flush every 5 seconds if the threshold has not been reached.
- [ ] Implement transport support for sending event batches.
- [ ] Implement batch status transitions.
- [ ] Delete successfully delivered batches and their events.
- [ ] Prevent overlapping flush operations.
- [ ] Integrate batcher with SDK initialization and `track(...)`.

#### Reliability and Delivery

- [ ] Implement basic recovery for batches left in the `sending` state after an interrupted session.
- [ ] Implement retry handling for failed deliveries.
- [ ] Review session management behavior across multiple browser tabs.
- [ ] Improve event delivery reliability and retry handling.

#### Documentation

- [ ] Add SDK documentation and usage examples.

### Documentation

- [ ] Document API endpoints and request/response schemas.
- [ ] Document SDK installation and usage.
- [ ] Document database schema and relationships.
- [ ] Document event ingestion flow.
- [ ] Document event batching and delivery behavior.
