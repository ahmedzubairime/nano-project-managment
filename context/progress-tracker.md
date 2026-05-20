# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Complete

## Current Goal

- Feature 02: App Shell & Navigation — ✅ Completed

## Completed

- Feature 01: Design System (shadcn/ui, tokens, theme, fonts, RTL foundations, layout standards)
- Feature 02: App Shell & Navigation
  - [x] Install @clerk/nextjs and @clerk/ui
  - [x] Set up ClerkProvider in root layout with shadcn theme
  - [x] Create proxy.ts for Clerk middleware (protects all routes except /, sign-in, sign-up)
  - [x] Create app shell layout (`(app)/layout.tsx`) with navbar + sidebar + workspace
  - [x] Create Navbar (project selector, language switcher, theme toggle, notifications, Clerk UserButton)
  - [x] Create Sidebar navigation (9 items with Lucide icons, active state, RTL-compatible)
  - [x] Create mobile sidebar (Sheet overlay, auto-closes on navigation)
  - [x] Create Project Selector component with placeholder data (Command-based, searchable, grouped by status)
  - [x] Create project context provider (`lib/project-context.tsx` with placeholder projects)
  - [x] Create reusable EmptyState component (icon, title, description, action slot)
  - [x] Create 9 placeholder route pages (dashboard, activities, sessions, timeline, centers, approvals, reports, notifications, settings)
  - [x] Responsive behavior: fixed sidebar desktop, Sheet overlay mobile
  - [x] RTL: language toggle in navbar, border-e for sidebar, text-start for triggers
  - [x] `npm run build` passes with zero errors

## In Progress

- None.

## Next Up

- Feature 03 (next feature spec)

## Open Questions

- None currently.

## Architecture Decisions

- Feature 01: shadcn base-nova style, Tailwind v4, Inter + Cairo fonts, oklch tokens
- Feature 02: Route group `(app)` for shell-wrapped routes; project context via React context; base-ui uses `render` prop (not `asChild`); Clerk proxy.ts for auth middleware; sidebar uses `border-e` for RTL compatibility

## Session Notes

- Clerk env vars already configured in .env.local
- Project uses base-ui (not radix) — triggers use `render` prop pattern instead of `asChild`
- ClerkProvider placed inside `<body>` with `dynamic` prop and shadcn theme
- All 9 routes render as dynamic (ƒ) due to Clerk middleware
