Read `AGENTS.md` before starting.

Build manual scheduling adjustment capabilities for project managers.

Automatic generation is the default planning mechanism.

However, project managers must be able to manually refine schedules after generation.

This feature introduces controlled manual overrides without breaking scheduling integrity.

## Objective

Allow project managers to:

- reschedule sessions
- reassign sessions between centers
- lock important sessions
- adjust generated planning safely

## Schema Updates

Add fields to `Session`:

- `isManuallyAdjusted`
- `isLocked`
- optional `manualAdjustmentReason`

Create migration.

## Permissions

Only:

- PROJECT_MANAGER

can modify generated schedules.

Center managers cannot modify scheduling.

## API Routes

Create:

### PATCH `/api/sessions/[sessionId]`

Supports:

- scheduled date updates
- center reassignment
- lock/unlock state

## Validation Rules

Enforce:

- adjusted dates remain inside project boundaries
- adjusted dates remain inside activity boundaries
- locked sessions cannot be auto-modified later
- archived projects remain readonly

## Adjustment Tracking

When a session is manually modified:

- mark `isManuallyAdjusted = true`

Preserve original generation consistency as much as possible.

## UI Requirements

Build:

- sessions management table
- session edit dialog
- lock/unlock controls
- adjustment indicators

## Sessions Table

Display:

- activity
- center
- scheduled date
- session status
- approval status
- locked state
- manually adjusted state

Support:

- filtering
- search
- sorting by date

## UX Rules

The adjustment workflow must feel operational.

Avoid:

- drag/drop calendar complexity
- spreadsheet-style editing

Use structured dialogs/forms.

## Conflict Warnings

Warn project managers when:

- moving sessions too close together
- creating high center concentration
- causing scheduling imbalance

Warnings are informational only.

Do not block edits unless invalid.

## Future Compatibility

Prepare scheduling system for future:

- regeneration logic
- locked session preservation
- partial redistribution

Do not implement regeneration yet.

## Constraints

Do not implement:

- gantt editing
- bulk schedule editing
- automatic conflict resolution

Focus only on safe manual overrides.

## Check When Done

- session editing works
- center reassignment works
- lock state works
- validation rules enforced
- manual adjustment indicators visible
- `npm run build` passes