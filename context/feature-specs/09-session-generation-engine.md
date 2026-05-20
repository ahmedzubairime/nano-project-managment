Read `AGENTS.md` before starting.

Build the automatic session generation engine.

This is one of the most important systems in the entire application.

The engine converts:

- planned activities
- participating centers
- project duration
- optional activity constraints

into actual executable session records.

Sessions are the operational execution units used by center managers.

This feature is backend/business-logic focused.

Avoid complex UI.

## Objective

Automatically generate session records for an activity.

Input:

- project
- activity
- participating centers
- planned session count
- project date range
- optional activity date range

Output:

- real `Session` database records

## Architecture

Create:

- `services/session-generation/`
- `services/session-generation/generate-sessions.ts`

Keep logic isolated and deterministic.

Do not place scheduling logic inside API routes.

## Initial Generation Rules

Version 1 rules:

- distribute sessions evenly across participating centers
- distribute sessions across available date range
- generated dates must stay within allowed boundaries
- each generated session belongs to exactly one center

## Deterministic Behavior

Generation must be reproducible.

Same input should produce same distribution.

Avoid randomization entirely.

## Session Generation Trigger

Create API route:

### POST `/api/projects/[projectId]/activities/[activityId]/generate-sessions`

This route:

- validates permissions
- validates activity state
- triggers generation service

## Regeneration Rules

Prevent duplicate uncontrolled generation.

Rules:

- generation allowed only if activity has no sessions yet
- regeneration flow comes later

## Session Defaults

Generated sessions should default to:

### Session Status

- PENDING

### Approval Status

- NOT_SUBMITTED

## Validation Rules

Enforce:

- activity belongs to project
- project is active
- participating centers exist
- planned session count > 0
- generation cannot exceed project date range

## Logging

Add lightweight structured logging for:

- generation start
- generated session count
- validation failures

Do not add heavy audit systems.

## UI Requirements

Minimal UI only.

Add:

- “Generate Sessions” action button
- confirmation dialog
- success/error feedback

Do not build session editing yet.

## Constraints

Do not implement:

- manual adjustments
- drag/drop scheduling
- gantt integration
- approvals
- execution workflow

This feature only creates the initial session dataset.

## Check When Done

- sessions generate successfully
- sessions distributed across centers
- dates stay within boundaries
- duplicate generation prevented
- API validations enforced
- `npm run build` passes