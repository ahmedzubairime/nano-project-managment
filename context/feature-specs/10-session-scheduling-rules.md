Read `AGENTS.md` before starting.

Extend the session generation system with formal scheduling and distribution rules.

This feature defines the operational planning logic of the platform.

The goal is to make session scheduling:

- deterministic
- balanced
- explainable
- maintainable

This is business-logic heavy.

Keep logic isolated from UI.

## Objective

Improve generated session scheduling quality.

The engine must intelligently distribute sessions across:

- participating centers
- project duration
- activity constraints

while respecting operational rules.

## Architecture

Create:

- `services/session-scheduling/`
- `services/session-scheduling/distribute-sessions.ts`
- `services/session-scheduling/date-allocation.ts`
- `services/session-scheduling/validation.ts`

The generation engine from Feature 09 should delegate scheduling decisions into these services.

## Scheduling Rules

### Date Boundaries

Sessions must never exist outside:

- project start/end dates
- activity start/end dates (if provided)

## Even Distribution

Distribute sessions as evenly as possible across:

- centers
- available timeline

Avoid clustering sessions unnecessarily.

## Center Balancing

Prevent one center from receiving disproportionate session concentration unless mathematically unavoidable.

## Chronological Ordering

Generated sessions must follow chronological ordering.

Avoid unordered generation.

## Gap Distribution

Prefer healthy spacing between sessions instead of consecutive-day clustering.

Basic spacing heuristics are enough for now.

Do not implement advanced optimization algorithms.

## Deterministic Results

Scheduling must always produce the same output for identical inputs.

Do not use randomness.

## Delayed Session Detection Foundation

Create reusable utilities for future delay detection.

Prepare helper logic for:

- overdue sessions
- expected completion windows
- timeline comparisons

Do not build notifications yet.

## Validation Rules

Enforce:

- no duplicate generated dates for same center/activity when avoidable
- no invalid date overflow
- generation failure returns safe errors

## API Updates

Update generation APIs to use the new scheduling layer.

Do not create new endpoints unless necessary.

## UI Requirements

Minimal UI only.

Add:

- generated session distribution summary
- center allocation counts
- generation warnings when distribution is imperfect

Do not build gantt/timeline yet.

## Logging

Add structured logs for:

- distribution decisions
- scheduling ranges
- balancing results
- validation failures

## Constraints

Do not implement:

- manual drag/drop scheduling
- session editing
- gantt timeline
- approvals
- execution workflows

This feature is scheduling infrastructure only.

## Check When Done

- sessions distribute evenly
- date boundaries enforced
- scheduling deterministic
- balancing works correctly
- scheduling services isolated cleanly
- `npm run build` passes