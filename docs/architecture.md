# System Architecture

## Overview

DOEM is a monorepo containing one backend application and two packages used by the backend and browser SDK.

Current workspace components:

1. Backend API
2. Browser SDK package
3. Shared package

The shared package contains reusable schemas and types used across packages.

## System Components

### 1. Backend (`apps/backend`)

The backend handles server-side operations.

Responsibilities:

- Register websites.
- Generate website credentials.
- Validate incoming requests.
- Receive and process analytics events.
- Manage visitor and session records.
- Store analytics events.

**Technology:** Node.js, TypeScript, Fastify, PostgreSQL, and `pg`.

The backend communicates with PostgreSQL and exposes HTTP API endpoints.

### 2. SDK (`packages/sdk`)

The SDK is a JavaScript tracking library installed on customer websites.

Responsibilities:

- Initialize using the Website ID.
- Generate or retrieve an anonymous Visitor ID.
- Manage visitor sessions.
- Track custom events.
- Build and send event payloads to the backend.

The SDK is written in TypeScript and bundled into browser-compatible JavaScript using esbuild.

It initializes from a script tag by reading `data-website-id`.

Example installation:

```html
<script src="https://cdn.yourdomain.com/tracker.js" data-website-id="CUSTOMER_WEBSITE_ID"></script>
```

The Website ID identifies the property receiving analytics data.

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

### Event Tracking and Ingestion

1. SDK initializes using the Website ID.
2. SDK generates or retrieves the Visitor ID.
3. SDK generates or retrieves the Session ID.
4. SDK generates an Event ID and builds the event payload.
5. SDK sends the event to the backend.
6. Backend validates the incoming event.
7. Backend creates or updates the visitor record.
8. Backend creates or updates the session record.
9. Backend inserts the event into PostgreSQL.

## Security Principles

- Website IDs are public identifiers, not secrets.
- Dashboard tokens are secret credentials.
- Recovery keys are separate secret credentials.
- Dashboard tokens and recovery keys are stored as hashes.

# Project Limitations

## Anonymity

DOEM is designed to provide website analytics without requiring traditional user accounts or collecting personally identifiable information (PII) from website visitors.

However, anonymity introduces certain limitations in visitor identification, analytics capabilities, and website management.

### 1. Visitor Identification

DOEM uses anonymous identifiers to recognize returning visitors and associate their activities across sessions.

Limitations:

- Visitor identification relies on browser-side storage.
- Clearing browser storage may generate a new Visitor ID.
- Using a different browser or device results in a different visitor identity.
- Private browsing sessions may prevent persistent visitor identification.
- Visitors cannot be reliably identified across multiple devices or browsers.
- Multiple people sharing the same browser may be treated as one visitor.

DOEM cannot guarantee that multiple anonymous identifiers belong to the same individual.

### 2. Website Owner Authentication

DOEM does not implement traditional user authentication or user accounts.

Website access is managed through generated credentials consisting of a Dashboard Token and Recovery Key.

Limitations:

- There is no email-based account recovery.
- Website ownership cannot be independently verified through an existing user account.
- Losing both the Dashboard Token and Recovery Key may result in permanent loss of dashboard access.
- There is no built-in account management or multi-user access.
- Website properties are managed independently rather than through centralized user accounts.

### 3. Cross-Device and Cross-Browser Tracking

Because DOEM does not use authenticated visitor identities, it cannot reliably associate activities across different devices and browsers.

For example, a visitor accessing the same website through a desktop browser and a mobile browser will be counted as two separate visitors.

This limits the ability to calculate accurate cross-device visitor statistics.

### 4. Browser Storage Limitations

DOEM depends on browser-side storage to maintain anonymous visitor and session identifiers.

Limitations:

- Browser storage can be cleared manually.
- Browser privacy settings may restrict storage.
- Content blockers may prevent the tracking script from executing.
- Browser restrictions may affect tracking behavior.
- Visitors using different browsers maintain separate identifiers.

These limitations may result in incomplete analytics data.

### 6. No Guaranteed Visitor Identity

DOEM's anonymous identifiers are pseudonymous identifiers rather than proof of individual identity.

A Visitor ID identifies a browser-side tracking identity, not necessarily a unique human being.

As a result:

- Visitor counts represent tracked anonymous identities.
- Returning visitor statistics may be affected by cleared storage.
- Session counts represent recorded browsing sessions.
- Analytics data may not perfectly represent actual individual visitors.

### 7. Website Access and Credential Management

Since DOEM does not use traditional user accounts, website access depends on the credentials generated during registration.

Limitations:

- Credentials must be stored securely by the website owner.
- There is no centralized identity management.
- There is no built-in password reset mechanism.
- Credential recovery depends on possession of the Recovery Key.
- Credential compromise may allow unauthorized dashboard access until credentials are rotated.

## Summary

DOEM prioritizes anonymous website analytics over individual visitor identification and traditional account management.

Its anonymous architecture provides the following trade-offs:

- Visitor tracking is limited to browser-side anonymous identities.
- Cross-device and cross-browser identification is not supported.
- Visitor statistics may be affected by browser storage restrictions.
- Website owners manage access through generated credentials.
- Traditional account recovery and multi-user management are not available.
- Analytics data represents observed browser activity rather than verified individual identities.

These limitations are intentional consequences of DOEM's current design and scope.
