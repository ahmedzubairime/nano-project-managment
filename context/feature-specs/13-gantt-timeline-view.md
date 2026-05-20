Read `AGENTS.md` before starting.

Build the operational Gantt timeline view.

The timeline is one of the primary planning and monitoring interfaces for project managers.

It visualizes:

- activities
- sessions
- center distribution
- scheduling density
- delays
- project progression

The timeline must use real scheduling data.

Avoid fake planning visuals.

## Objective

Create a real project timeline powered by generated and manually adjusted session data.

The timeline must support operational planning visibility.

## Timeline Scope

Display:

- activities
- generated sessions
- session dates
- center assignments
- completion states
- delayed sessions

## Recommended Library

Use:

- `frappe-gantt`

OR another lightweight React-compatible gantt library.

Do not build custom gantt rendering from scratch.

## Timeline Modes

Support:

### Activity View

High-level activity bars.

### Session View

Detailed per-session breakdown.

## Grouping

Allow grouping by:

- activity
- center

## Timeline Range

Support:

- week
- month
- quarter

Month view is default.

## Color Rules

Use semantic design tokens only.

Session colors should reflect:

- pending
- completed
- delayed
- approved
- rejected

No hardcoded colors.

## Data Source

Use real session scheduling data.

Timeline must reflect:

- generated schedules
- manual adjustments
- lock states
- approval states

## Interaction Rules

Support:

- session click
- activity click
- quick detail preview

Do not support drag/drop editing yet.

## UI Requirements

Build:

- timeline toolbar
- view switcher
- grouping controls
- zoom controls

## Performance Rules

Timeline must remain usable with:

- large projects
- many sessions
- many centers

Avoid excessive rerenders.

Use memoization where necessary.

## Delay Visualization

Clearly show:

- overdue sessions
- delayed execution
- scheduling bottlenecks

## Responsive Rules

Desktop-first experience.

Tablet support required.

Mobile may fall back to simplified list mode.

## Constraints

Do not implement:

- drag/drop editing
- inline session editing
- dependency arrows
- advanced timeline analytics

Focus on operational visibility only.

## Check When Done

- gantt renders real project data
- grouping works
- zoom controls work
- delay visualization works
- performance acceptable on large datasets
- `npm run build` passes