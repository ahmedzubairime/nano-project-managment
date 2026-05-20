Read `AGENTS.md` before starting.

Build the operational notifications system.

Notifications support:

- execution reminders
- approval updates
- delay warnings
- operational announcements

The system must support both:

- automatic notifications
- manual manager broadcasts

Notifications are project-scoped.

## Objective

Create a centralized operational notification system integrated across the platform.

## Notification Types

Support:

- INFO
- WARNING
- DEADLINE
- DELAY
- ANNOUNCEMENT

## Automatic Notifications

Automatically generate notifications for:

- overdue sessions
- rejected approvals
- upcoming sessions
- pending approvals

## Manual Notifications

Project managers can manually send announcements to:

- one center
- multiple centers
- all project centers

## Schema Updates

Extend notification architecture if needed.

Support:

- targeted centers
- sender
- read state
- delivery timestamps

Keep schema operational and explicit.

## API Routes

Create:

### GET `/api/notifications`

Returns notifications visible to current user.

### POST `/api/projects/[projectId]/notifications`

Creates manual announcement.

### PATCH `/api/notifications/[notificationId]/read`

Marks notification as read.

## Notification Visibility Rules

Center managers should only see:

- notifications related to their centers
- project-wide broadcasts

Project managers see:

- all project notifications

## UI Requirements

Build:

- notifications center page
- notification dropdown panel
- unread badge counts
- announcement creation dialog

## Notifications Center

Display:

- title
- message
- type
- timestamp
- read/unread state

Support:

- filtering
- unread-only mode
- pagination-ready structure

## Navbar Integration

Navbar notification icon must display:

- unread count
- quick recent notifications preview

## UX Rules

Notifications should feel:

- operational
- lightweight
- non-intrusive

Avoid chat-style interfaces.

## Future Compatibility

Prepare architecture for future:

- email delivery
- push notifications
- scheduled reminders

Do not implement external delivery providers yet.

## Constraints

Do not implement:

- real-time sockets
- email sending
- push providers
- notification preferences system

Focus only on internal in-app notifications.

## Check When Done

- automatic notifications generate correctly
- manual broadcasts work
- unread counts update correctly
- read/unread state persists
- permissions enforced correctly
- `npm run build` passes