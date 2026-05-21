Read `AGENTS.md` before starting.

Build the operational reporting and analytics system.

Reports are used by project managers to evaluate:

- execution performance
- center performance
- approval efficiency
- scheduling health
- volunteer contribution

Reports must use real operational data only.

Avoid vanity analytics.

## Objective

Create a reporting system that provides actionable operational insights across projects.

## Report Categories

Support:

### Project Progress Reports

Display:

- total sessions
- completed sessions
- delayed sessions
- approval rates
- completion percentages

## Center Performance Reports

Display per-center:

- assigned sessions
- completion rate
- delay rate
- volunteer participation
- approval turnaround

## Timeline Health Reports

Display:

- overdue trends
- execution density
- bottleneck periods
- scheduling distribution

## Volunteer Reports

Display:

- volunteer activity totals
- volunteer completion rates
- center volunteer engagement

## Approval Reports

Display:

- pending approvals
- rejection rates
- approval turnaround times

## Backend Architecture

Create:

- `services/reports/`

Split aggregation logic into reusable report services.

## API Routes

Create:

### GET `/api/projects/[projectId]/reports/overview`

### GET `/api/projects/[projectId]/reports/centers`

### GET `/api/projects/[projectId]/reports/timeline`

### GET `/api/projects/[projectId]/reports/volunteer`

## Performance Rules

Optimize aggregation carefully.

Avoid:

- deeply nested Prisma queries
- loading full session trees unnecessarily

Prefer aggregate queries and grouped calculations.

## UI Requirements

Build:

- reports dashboard page
- report cards
- operational charts
- export-ready tables

## Visualization Rules

Use lightweight charts only where useful.

Recommended:

- bar charts
- line trends
- stacked progress indicators

Avoid:

- flashy analytics visuals
- animated dashboards

## Filtering

Support filtering by:

- date range
- center
- activity
- approval state
- volunteer-only mode

## Export Preparation

Structure report data for future export compatibility.

Do not implement exports yet.

## Responsive Rules

Desktop-first.

Tablet support required.

## Constraints

Do not implement:

- PDF exports
- Excel exports
- AI-generated summaries
- predictive analytics

Focus only on operational reporting.

## Check When Done

- reports use real aggregated data
- center metrics accurate
- volunteer reporting separated correctly
- charts render correctly
- queries optimized
- `npm run build` passes