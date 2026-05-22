Read `AGENTS.md` before starting.

Build the complete bilingual and RTL operational support layer.

The platform must support:

- Arabic
- English

Arabic is RTL-first.

The bilingual system must feel native and operational across the entire application.

## Objective

Create a production-ready bilingual architecture with proper RTL behavior.

The system must support:

- layout direction
- translations
- formatting
- operational readability

## Existing Foundation

The app already includes:

- bilingual typography
- basic RTL support
- language toggle

This feature completes the architecture and operational integration.

## Translation Architecture

Create:

- `messages/en.json`
- `messages/ar.json`

Use structured translation namespaces.

Recommended:

- navigation
- dashboard
- activities
- sessions
- approvals
- reports
- notifications
- forms
- validation

## Recommended Library

Use:

- `next-intl`

OR another App Router compatible i18n solution.

Avoid legacy Pages Router i18n patterns.

## Routing Rules

Support locale-aware routing.

Examples:

- `/en/dashboard`
- `/ar/dashboard`

Default locale:

- Arabic

## RTL Rules

Arabic mode must correctly support:

- layout mirroring
- text alignment
- spacing direction
- icon placement
- sidebar positioning
- table alignment

## Date & Number Formatting

Support locale-aware:

- dates
- numbers
- percentages

Arabic mode should use localized formatting where reasonable.

## UI Requirements

Translate all operational UI including:

- navbar
- sidebar
- dialogs
- forms
- dashboard labels
- reports
- tables
- statuses
- notifications

## Dynamic Content Rules

Do not auto-translate:

- project names
- center names
- custom notes
- documentation links

Only translate system UI.

## Validation Messages

Validation and error messages must support both languages.

## Accessibility Rules

RTL support must preserve:

- keyboard navigation
- accessibility semantics
- screen reader compatibility

## Performance Rules

Translations should remain:

- statically optimized where possible
- lightweight
- cache-friendly

## Constraints

Do not implement:

- automatic translation services
- per-user translation editing
- runtime AI translation

Focus only on stable bilingual support.

## Check When Done

- Arabic and English work across all pages
- RTL layouts behave correctly
- locale-aware formatting works
- validation messages translated
- navigation locale-aware
- `npm run build` passes