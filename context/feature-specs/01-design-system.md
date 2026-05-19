Read `AGENTS.md` before starting.

Set up the shared design system foundations for the project management platform.

Install and configure `shadcn/ui`.

Add these shadcn components:

- Button
- Card
- Dialog
- Input
- Label
- Select
- Tabs
- Textarea
- ScrollArea
- DropdownMenu
- Sheet
- Badge
- Table
- Tooltip
- Calendar

Do not modify generated `components/ui/*` files.

Install:

- lucide-react
- next-themes

Create:

- `lib/utils.ts`

Add reusable `cn()` helper.

## Theme

Support:

- dark mode
- light mode

Use CSS variables in `globals.css`.

No hardcoded colors.

Prepare theme tokens for:

- background
- surface
- borders
- text
- status colors

Status tokens:

- pending
- in-progress
- completed
- delayed
- rejected
- approved

## Typography

Support Arabic and English.

Prepare font setup for:

- Arabic
- English

RTL must be supported globally.

## Check When Done

- all UI primitives import correctly
- no hardcoded colors
- theme switching works
- RTL layout works
- `npm run build` passes