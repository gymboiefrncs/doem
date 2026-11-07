# System Architecture

## Overview

DOEM is designed as a monorepo containing three independently deployable applications and one shared package.

The three applications are:

1. Backend API
2. Browser SDK
3. Dashboard

The shared package contains reusable types and validation schemas.

## System Components

### 1. Backend (`apps/backend`)

The backend is responsible for the platform's server-side operations.

Responsibilities:

- Register websites.
- Generate website credentials.
- Validate incoming requests.
- Receive analytics events.
- Manage visitors and sessions.
- Query analytics data.
- Handle dashboard authentication and recovery.

**Technology:** Node.js, TypeScript, Fastify, PostgreSQL, and `pg`.

The backend communicates with PostgreSQL and exposes HTTP API endpoints.

### 2. SDK (`apps/sdk`)

The SDK is a JavaScript tracking library installed on customer websites.

Its responsibilities will include:

- Generate or retrieve an anonymous Visitor ID.
- Manage visitor sessions.
- Track page views.
- Allow developers to track custom events.
- Send collected events to the backend API.

The SDK will be written in TypeScript and bundled into browser-compatible JavaScript using esbuild.

It will be hosted separately from the backend, such as through a CDN.

Example installation:

```html
<script src="https://cdn.yourdomain.com/sdk.js" data-website-id="CUSTOMER_WEBSITE_ID"></script>
```

The Website ID identifies the property receiving analytics data. It is not an authentication credential.

### 3. Dashboard (`apps/dashboard`)

The dashboard will provide website owners with an interface for viewing their analytics.

Planned responsibilities:

- Display website analytics.
- Show daily page views and visitor statistics.
- Display custom event statistics.

**Planned technology:** Next.js and TypeScript.

The dashboard will communicate with the backend API.

There will be no traditional email-and-password user accounts in the initial design. Access will use anonymous credentials.

### 4. Shared (`packages/shared`)

This package contains code shared between applications.

Responsibilities:

- Shared TypeScript types.
- Request and response schemas.
- Zod validation schemas.
- Common API contracts.

Keeping shared schemas in one location prevents different applications from defining inconsistent versions of the same data structures.

## Communication Flow

### Website Registration

1. Website owner submits a website name and domain.
2. Backend validates the submitted information.
3. Backend generates a Website ID.
4. Backend generates a dashboard token and recovery key.
5. Backend hashes both credentials.
6. Backend stores the website information and credential hashes in PostgreSQL.
7. Backend returns the original credentials to the website owner.

### Future Analytics Collection

1. Customer installs the SDK on their website.
2. SDK identifies the website using its Website ID.
3. SDK collects page views and visitor activity.
4. SDK sends events to the backend API.
5. Backend validates incoming events.
6. Backend stores events in PostgreSQL.
7. Dashboard requests analytics data from the backend.

## Security Principles

- Website IDs are public identifiers, not secrets.
- Dashboard tokens are secret credentials.
- Recovery keys are separate secret credentials.

## Current Scope

Only the backend and website registration feature are being developed initially.

The SDK, dashboard, event collection, visitor management, session management, and analytics queries are planned future components.
