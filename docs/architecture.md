# System Architecture

## Overview

DOEM is a monorepo containing one backend application and two packages used by that backend and the browser SDK.

Current workspace components:

1. Backend API
2. Browser SDK package
3. Shared package

The shared package contains reusable schemas and types used across packages.

## System Components

### 1. Backend (`apps/backend`)

The backend handles the currently implemented server-side operations.

Responsibilities:

- Register websites.
- Generate website credentials.
- Validate incoming requests.

**Technology:** Node.js, TypeScript, Fastify, PostgreSQL, and `pg`.

The backend communicates with PostgreSQL and exposes HTTP API endpoints.

### 2. SDK (`packages/sdk`)

The SDK is a JavaScript tracking library installed on customer websites.

Current responsibilities:

- Generate or retrieve an anonymous Visitor ID.
- Manage visitor sessions.
- Build event payload objects for tracking calls.

The SDK is written in TypeScript and bundled into browser-compatible JavaScript using esbuild.

It initializes from a script tag by reading `data-website-id`.

Example installation:

```html
<script src="https://cdn.yourdomain.com/sdk.js" data-website-id="CUSTOMER_WEBSITE_ID"></script>
```

The Website ID identifies the property receiving analytics data. It is not an authentication credential.

### 3. Shared (`packages/shared`)

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

## Security Principles

- Website IDs are public identifiers, not secrets.
- Dashboard tokens are secret credentials.
- Recovery keys are separate secret credentials.
