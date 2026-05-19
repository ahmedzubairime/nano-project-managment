# UI Context

## Theme

Professional operational dashboard with bilingual support.

Support:

- Arabic (RTL)
- English (LTR)

Theme mode:

- Light and dark mode support

Primary design language:

- Clean enterprise dashboard
- Data-dense layouts
- Operational planning workspace

## Layout Patterns

### App Structure

- Top navigation bar
- Left sidebar navigation
- Main content workspace

### Project Context Model

The user first selects a project.

After project selection:

- dashboard
- analytics
- timeline
- activities
- sessions
- reports

all switch to project-scoped views.

## Core Screens

### Project Selector

Landing screen showing:

- active projects
- archived projects
- project health indicators

### Project Dashboard

Displays:

- project progress
- delayed sessions
- delayed activities
- center summaries
- upcoming deadlines
- notifications

### Gantt Timeline

Primary operational screen.

Displays:

- project activities
- sessions
- center distributions
- timeline allocations
- status indicators

Supports:

- filtering
- zoom levels
- date navigation

### Activities Screen

Displays:

- master activities
- session totals
- center allocations
- progress indicators

### Sessions Screen

Table view for:

- session execution
- approval queue
- documentation review

### Reports Screen

Access to:

- exports
- summaries
- analytics reports

## Components

Use:

- shadcn/ui
- Tailwind

Key components:

- Data tables
- Tabs
- Dialogs
- Date pickers
- Command menus
- Charts
- Cards

## Charts

Used for:

- project progress
- delay analysis
- center comparisons
- completion metrics

## Colors

Status colors:

- Pending
- In Progress
- Completed
- Delayed
- Rejected
- Approved

Must remain visually distinct in both themes.

## Typography

Arabic and English typography must both render correctly.

Recommended:

- Arabic: Tajawal or Cairo
- English: Inter or Geist

## Icons

Use Lucide React only.