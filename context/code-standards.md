# Code Standards

## General

* Keep modules focused on a single responsibility.
* Prefer simple and maintainable solutions over complex abstractions.
* Fix problems at the source instead of adding temporary workarounds.
* Separate business logic, database access, and API handling clearly.
* Follow the boundaries defined in `architecture-context.md`.
* Avoid unnecessary dependencies and over-engineering.
* Write code that is easy to test, debug, and extend.

## TypeScript

* Enable strict TypeScript mode across the project.
* Avoid using `any`.
* Use `interface` for data contracts and shared models.
* Validate external input before processing or storing it.
* Use enums or union types for statuses and roles.
* Keep types close to their related domain logic.
* Reuse shared types instead of duplicating definitions.

## Next.js

* Use App Router structure.
* Prefer React Server Components by default.
* Add `"use client"` only when interactivity or browser APIs are required.
* Keep route handlers small and focused.
* Move business logic into `services/` or `lib/`.
* Do not place database logic directly inside UI components.
* Use server actions or API routes consistently.

## Authentication & Authorization

* All protected routes must validate authentication.
* All mutations must validate user permissions.
* Role checks must be enforced server-side.
* Never trust client-side role validation alone.
* Project access must be verified before reading or updating data.

## API Routes

* Validate request payloads before executing logic.
* Return consistent API response structures.
* Handle errors with clear status codes and messages.
* Keep API routes thin and delegate logic to services.
* Avoid duplicated validation logic across routes.
* Use pagination for large datasets.

## Database & Prisma

* PostgreSQL is the source of truth for relational data.
* Use Prisma schema relations explicitly.
* Avoid deeply nested Prisma queries when unnecessary.
* Store:

  * Projects
  * Activities
  * Sessions
  * Outputs
  * Users
  * Progress records
  * Notifications
* Use transactions for multi-step updates.
* Never store large files directly in the database.
* Store only Google Drive URLs and attachment metadata.

## Session Distribution Logic

* Session totals must always remain accurate.
* Distribution calculations must be deterministic and reproducible.
* Manual overrides should not break total session counts.
* Progress calculations should update automatically after session changes.
* Date calculations must respect project boundaries.

## File Organization

* `app/`

  * Routes, layouts, pages, and API handlers

* `components/`

  * Reusable UI components only
  * No business logic

* `services/`

  * Business logic and workflow operations

* `lib/`

  * Shared utilities, helpers, validations, and Prisma client

* `prisma/`

  * Prisma schema and migrations

* `types/`

  * Shared TypeScript interfaces and enums

* `hooks/`

  * Custom React hooks

* `constants/`

  * Shared application constants and configuration

* `validators/`

  * Zod schemas and request validation logic

## Naming Conventions

* Use clear and descriptive names.
* Name files by responsibility, not implementation details.
* Use:

  * `create-project.ts`
  * `calculate-progress.ts`
  * `session-distribution.service.ts`

Instead of:

* `utils.ts`
* `helpers.ts`
* `dataManager.ts`

## Error Handling

* Handle expected and unexpected errors separately.
* Return user-friendly error messages.
* Log server-side errors consistently.
* Avoid exposing internal implementation details in API responses.
* Validate nullable and optional values explicitly.

## Performance

* Avoid unnecessary client-side rendering.
* Fetch only required fields from the database.
* Use pagination and filtering for reports and tables.
* Prevent duplicate calculations when possible.
* Optimize dashboard queries for large project datasets.

## Security

* Validate and sanitize all user input.
* Protect all sensitive routes and actions.
* Never expose secrets in the frontend.
* Use environment variables for credentials and configuration.
* Enforce ownership and permission checks on every mutation.

## Testing

* Test critical business logic:

  * Session distribution
  * Progress calculation
  * Permission validation
  * Deadline handling

* Add integration tests for:

  * API routes
  * Authentication flows
  * Project workflows

* Keep tests deterministic and isolated.

## Invariants

1. Authentication and permission checks must occur before any protected operation.
2. Session distribution totals must always equal the planned activity sessions.
3. Activities cannot exist outside project date ranges.
4. Progress values must always reflect real stored data.
5. Business logic should not live inside UI components.
6. Google Drive links are references only — files are not stored internally.
7. Database relationships must remain consistent between projects, activities, sessions, and outputs.
8. API routes should remain lightweight and delegate complex operations to services.
