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
- [x] Automatic page view event

### Event Ingestion

- [x] Event ingestion endpoint implemented.
- [x] Event payload validation implemented.
- [x] Visitor record creation and update implemented.
- [x] Session record creation and update implemented.
- [x] Event persistence implemented.
- [x] Database transaction handling implemented for event ingestion.
- [x] Duplicate event prevention implemented using a unique constraint and `ON CONFLICT`.
- [x] Event ID used as an idempotency key.

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

### Backend

- [ ] Implement analytics retrieval endpoints.
- [ ] Implement dashboard authentication and credential recovery flows.
- [ ] Add appropriate rate limiting and request safeguards.

### SDK

- [ ] Review session management behavior across multiple browser tabs.
- [ ] Improve event delivery reliability and retry handling.
- [ ] Add SDK documentation and usage examples.
- [ ] Request batching
- [ ] Retries

### Documentation

- [ ] Document API endpoints and request/response schemas.
- [ ] Document SDK installation and usage.
- [ ] Document database schema and relationships.
- [ ] Document event ingestion flow.
