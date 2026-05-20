Read `AGENTS.md` before starting.

Build the core relational database schema and Prisma infrastructure for the Field Project Management System.

This system is heavily schedule-driven and relational.

The database architecture is the foundation of:

- project planning
- session distribution
- execution tracking
- approvals
- reporting
- notifications

Design the schema carefully and avoid unnecessary abstraction.

## Prisma Structure

Organize Prisma schema using modular files.

Create:

- `prisma/schema.prisma`
- `prisma/models/*.prisma`

Recommended model split:

- user.prisma
- project.prisma
- center.prisma
- activity.prisma
- session.prisma
- approval.prisma
- notification.prisma

## Database Provider

Use:

- PostgreSQL

Prisma is already installed.

## Core Models

### User

Represents authenticated Clerk users.

Fields:

- id
- clerkUserId
- email
- role
- timestamps

Constraints:

- `clerkUserId` unique
- `email` unique

## Project

Fields:

- id
- ownerId
- name
- optional description
- startDate
- endDate
- status
- archivedAt
- timestamps

Relations:

- owner
- activities
- sessions
- projectCenters
- notifications

Indexes:

- ownerId
- status
- startDate
- endDate

## Center

Centers are reusable entities across projects.

Fields:

- id
- name
- city
- managerId
- timestamps

Relations:

- manager
- projectCenters
- sessions

Indexes:

- managerId
- city

## ProjectCenter

Join table between:

- project
- center

Purpose:

- per-project center participation
- future project-specific center metadata

Fields:

- id
- projectId
- centerId
- timestamps

Constraints:

- unique(projectId, centerId)

## Activity

Project-level planning entity.

Fields:

- id
- projectId
- title
- optional description
- plannedSessionCount
- isVolunteer
- timestamps

Relations:

- project
- sessions

Indexes:

- projectId
- isVolunteer

## Session

The primary executable operational unit.

Every generated session must exist as a real database record.

Fields:

- id
- projectId
- activityId
- centerId
- scheduledDate
- status
- approvalStatus
- documentationUrl
- optional notes
- submittedAt
- approvedAt
- timestamps

Relations:

- project
- activity
- center
- approvals

Indexes:

- projectId
- centerId
- scheduledDate
- status
- approvalStatus

## ApprovalRecord

Tracks approval workflow history.

Fields:

- id
- sessionId
- reviewerId
- status
- optional reviewNotes
- reviewedAt
- timestamps

Relations:

- session
- reviewer

Indexes:

- sessionId
- reviewerId
- status

## Notification

Supports:

- automatic notifications
- manual broadcasts

Fields:

- id
- projectId
- title
- message
- type
- readAt
- timestamps

Indexes:

- projectId
- type
- readAt

## Enums

Create enums:

### Role

- PROJECT_MANAGER
- CENTER_MANAGER
- VIEWER

### ProjectStatus

- DRAFT
- ACTIVE
- ARCHIVED

### SessionStatus

- PENDING
- IN_PROGRESS
- COMPLETED
- DELAYED
- CANCELLED

### ApprovalStatus

- NOT_SUBMITTED
- PENDING_APPROVAL
- APPROVED
- REJECTED

### NotificationType

- INFO
- WARNING
- DEADLINE
- DELAY
- ANNOUNCEMENT

## Prisma Client

Create:

- `lib/prisma.ts`

Requirements:

- cached singleton
- safe hot reload handling
- single Prisma instance globally

## Validation Rules

Enforce:

- sessions cannot exist outside project date range
- archived projects are readonly
- session approval timestamps only exist after approval

Do not implement business logic yet.

Schema only.

## Migration

Run:

- initial migration
- Prisma client generation

## Constraints

Do not:

- add unnecessary generic tables
- introduce polymorphic abstractions
- add audit systems yet
- add soft delete systems yet

Keep schema operational and explicit.

## Check When Done

- schema compiles successfully
- relations are valid
- indexes exist
- migration runs successfully
- Prisma client generates correctly
- `npm run build` passes