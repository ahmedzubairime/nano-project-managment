Read `AGENTS.md` before starting.

Build the core application shell and navigation architecture.

This application is fully project-scoped.

The selected project defines the operational context for:

- dashboards
- activities
- sessions
- timeline
- approvals
- reports
- notifications

The shell must support heavy daily operational usage.

## Layout Structure

Create persistent application shell with:

- top navigation bar
- left sidebar navigation
- main content workspace

The shell must remain consistent across protected routes.

## Navbar

Navbar responsibilities:

- active project selection
- language switcher
- theme toggle
- notifications access
- authenticated user menu

Add:

- Clerk `UserButton`

Do not customize Clerk internals.

## Project Selector

The project selector is a critical global control.

Requirements:

- visible in navbar
- supports switching between projects
- updates active application context
- prepared for future search support

No backend integration yet.

Use temporary placeholder project data.

## Sidebar Navigation

Sidebar must include:

- Dashboard
- Activities
- Sessions
- Timeline
- Centers
- Approvals
- Reports
- Notifications
- Settings

Each navigation item must support:

- active state
- icon
- RTL compatibility
- responsive behavior

Use Lucide icons only.

## Responsive Behavior

Desktop:

- fixed sidebar
- persistent navbar

Mobile:

- sidebar becomes sheet overlay
- navbar remains fixed

The app must remain fully usable on tablets.

## Workspace Rules

The main workspace area must support:

- dashboards
- large tables
- gantt/timeline layouts
- analytics
- forms
- approval queues

Do not constrain workspace width unnecessarily.

Avoid centered marketing-style layouts.

## Routes

Create placeholder route pages:

- `/dashboard`
- `/activities`
- `/sessions`
- `/timeline`
- `/centers`
- `/approvals`
- `/reports`
- `/notifications`
- `/settings`

Placeholder pages only.

No business logic yet.

## Empty States

Create reusable empty state pattern for:

- no project selected
- empty datasets
- unavailable data

Keep empty states operational and minimal.

Do not use illustration-heavy designs.

## State Management

Prepare project context architecture.

Preferred structure:

- URL-driven active project
- synchronized app context

Do not introduce heavy global state libraries yet.

## Constraints

Do not:

- fetch real backend data
- add mock analytics
- build fake dashboards
- introduce business logic

Focus only on shell architecture and navigation foundations.

## Check When Done

- app shell renders correctly
- navbar and sidebar persist correctly
- responsive behavior works
- placeholder routes render correctly
- project selector UI exists
- RTL layout works correctly
- `npm run build` passes