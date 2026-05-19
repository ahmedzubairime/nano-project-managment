# Architecture Context

## Stack

| Layer | Technology | Role |
|---|---|---|
| Framework | Next.js 16 + TypeScript | Full-stack application |
| UI | Tailwind + shadcn/ui | Dashboard UI |
| Auth | Clerk | Authentication and role management |
| Database | Prisma + PostgreSQL | Core relational data |
| AI | OpenRouter | AI assistant access |
| Charts | Recharts | Analytics visualizations |

## System Boundaries

- `app/` routes and layouts
- `app/api/` request handlers
- `services/` business logic
- `lib/` shared utilities
- `prisma/` schema and migrations
- `validators/` input validation
- `types/` shared contracts

## Core Domain Model

### Project

Contains:

- metadata
- duration
- status
- participating centers

### Center

Contains:

- name
- city
- manager assignment
- metadata

Centers are reusable across projects.

### ProjectCenter

Join entity connecting:

- project
- center
- center manager assignment

Per-project center participation.

### Activity

Project-level master definition.

Contains:

- title
- type
- target centers
- planned session count
- scheduling rules

### Session

Primary executable unit.

Contains:

- activity
- project
- center
- scheduled date
- status
- documentation link
- notes
- approval state

Each planned session exists as an independent database record.

### Volunteer Activity

Same model as standard activities.

Flag:

- `isVolunteer`

Volunteer records are included in analytics separately.

### Notification

Supports:

- automatic notifications
- manual broadcasts

### Approval Record

Tracks:

- submitted by
- reviewed by
- approved/rejected
- review notes
- timestamps

## Scheduling Model

Workflow:

1. Project manager defines activities.
2. Selects target centers.
3. Defines session counts.
4. System distributes sessions across:
   - centers
   - project date range

Scheduling rules:

- deterministic
- reproducible
- manually overridable

Generated sessions are persisted as records.

## Progress Model

Progress derives from approved session completion.

Rules:

- session completion updates activity progress
- activity progress updates project progress

Volunteer work contributes to reporting separately.

## Archive Model

Completed projects can be archived.

Archive behavior:

- read-only
- accessible in reporting

## Permissions

### Project Manager

Full project access.

### Center Manager

Restricted to:

- assigned centers
- execution
- documentation
- volunteer activities

### Viewer

Read-only access.

## File Strategy

No internal file storage.

Only store:

- Google Drive URLs

Database stores metadata only.

## AI Boundaries

AI access restricted to project managers.

Use cases:

- progress queries
- summaries
- delay analysis
- scheduling insights

AI does not directly mutate database state without explicit confirmation.

## Invariants

1. All protected actions require authentication.
2. All mutations validate project permissions.
3. Sessions are the source of truth for execution.
4. Project progress derives from stored approved sessions.
5. Scheduling remains deterministic.
6. Volunteer activities do not modify baseline project requirements.
7. Archived projects are immutable.
8. Documentation is stored as external Drive links only.