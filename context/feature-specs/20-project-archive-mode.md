Read `AGENTS.md` before starting.

Build full archive-mode behavior across the platform.

Archived projects become operationally readonly while preserving all historical data.

The archive system must be enforced consistently across:

- APIs
- UI
- execution workflows
- approvals
- scheduling

## Objective

Ensure archived projects are safely preserved and protected from further operational modification.

## Archive Rules

Archived projects:

- remain visible
- remain searchable
- remain reportable
- become readonly

## Protected Operations

When archived:

Prevent:

- session execution
- approval actions
- scheduling changes
- activity creation
- center assignment changes
- notifications creation

## Readonly UI Behavior

All readonly actions must display:

- disabled controls
- readonly indicators
- explanatory messaging

Avoid silently hiding functionality.

## Backend Enforcement

Enforce readonly checks server-side.

UI checks alone are insufficient.

## API Validation

All mutation routes must validate:

- project archive state

before executing modifications.

## UI Requirements

Build:

- archive state badges
- readonly banners
- disabled operational controls

## Dashboard Behavior

Archived projects still display:

- dashboards
- reports
- timelines
- documentation

## Timeline Behavior

Timeline becomes fully readonly.

## Execution Flow Behavior

Execution dialogs become readonly previews.

## Approval Behavior

Approvals cannot be reviewed or modified.

## Notification Behavior

No new notifications generated for archived projects.

Existing notifications remain visible.

## Search & Filtering

Allow filtering:

- active projects
- archived projects

## Constraints

Do not implement:

- archive restore workflows
- soft partial archives
- automatic archiving

Focus only on readonly operational preservation.

## Check When Done

- archived projects readonly everywhere
- backend protections enforced consistently
- readonly UI states visible clearly
- reports remain accessible
- timelines remain viewable
- `npm run build` passes