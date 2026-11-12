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
- [x] Credential hashing before persistence implemented.
- [x] Original generated credentials returned in registration response.

### SDK (Current Implementation)

- [x] Browser bundle build configured with esbuild.
- [x] SDK initialization via script tag dataset (`data-website-id`) implemented.
- [x] Visitor ID persistence in localStorage implemented.
- [x] Session creation and expiration handling implemented.
- [x] Event payload creation through `track(...)` implemented.
