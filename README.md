# Website Analytics Platform

An anonymous website analytics platform built with TypeScript. It allows website owners to track visitors, sessions, page views, and custom events without requiring traditional user accounts.

This project is being developed as a learning project focused on backend engineering, system architecture, database design, and API development.

## Project Goals

- Build a lightweight website analytics platform.
- Collect anonymous visitor and website activity data.
- Provide website owners with a private analytics dashboard.
- Avoid traditional email-and-password accounts.
- Learn backend engineering through a practical project.

## Tech Stack

TypeScript - Primary programming language
Node.js - JavaScript runtime
Fastify - Backend HTTP framework
PostgreSQL - Primary database
pg - PostgreSQL client for Node.js
Zod - Data validation and shared schemas
pnpm - Package manager and monorepo workspace management
node-pg-migrate - Database migration management
esbuld - SDK bundler
Next.js - Frontend framework

## Architecture

The project uses a monorepo structure containing separate applications and shared packages.

- **Backend:** Handles website registration, event ingestion, authentication, and analytics queries.
- **SDK:** A browser JavaScript library installed on customer websites to collect analytics data.
- **Dashboard:** A web interface where website owners can view analytics.
- **Packages/Shared:** Contains reusable TypeScript types and validation schemas.

## Project Structure

```text
analytics-platform/
├── apps/
│   ├── backend/
│   ├── sdk/
│   └── dashboard/
├── packages/
│   └── shared/
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── decisions.md
│   └── development-notes.md
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── tsconfig.base.json
```

Some applications and documentation describe planned functionality that has not yet been implemented.

## Current Development Scope

The first development phase focuses on the backend.

Initial feature:

1. Website registration.

During registration, the backend will generate:

- A Website ID.
- A dashboard access token.
- A recovery key.

The dashboard token and recovery key will be stored as hashes in PostgreSQL. Their original values will be returned to the website owner once.

## Development Philosophy

Build the project incrementally.

Avoid introducing unnecessary infrastructure or complexity before it is needed. Understand the purpose of each component before implementing it.

See the `docs/` directory for architecture, database design, technical decisions, and development notes.
