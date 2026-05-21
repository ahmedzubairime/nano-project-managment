Read `AGENTS.md` before starting.

Improve Google Drive documentation handling across the platform.

Documentation links are core operational artifacts for session verification and auditing.

The system stores references only.

No files are uploaded internally.

## Objective

Create a consistent, validated, user-friendly Google Drive documentation workflow.

## Documentation Rules

Each session supports:

- one Google Drive URL

The URL may represent:

- folder
- file
- shared document
- evidence package

## Validation Rules

Validate:

- valid URL format
- Google Drive domain compatibility

Reject clearly invalid URLs.

Do not attempt external API validation.

## Supported URL Types

Allow:

- drive.google.com
- docs.google.com

## Metadata Extraction

Create lightweight helper parsing utilities for:

- URL normalization
- display-friendly filenames
- document type hints

Do not call external APIs.

## Backend

Create:

- `lib/drive-links.ts`

Include reusable validators and parsers.

## UI Requirements

Improve documentation UI across:

- session execution
- approvals
- timeline previews
- reports

## UX Improvements

Display:

- clickable documentation links
- recognizable document type badges
- normalized labels

## Security Rules

Always render external links safely.

Use:

- `target="_blank"`
- `rel="noopener noreferrer"`

## Approval Integration

Approval dialogs should provide quick-open documentation access.

## Timeline Integration

Timeline preview dialogs should display documentation state.

## Reporting Integration

Reports should indicate:

- documented sessions
- missing documentation rates

## Constraints

Do not implement:

- Google OAuth Drive integrations
- file uploads
- previews
- document syncing

Focus only on operational URL handling.

## Check When Done

- URL validation works correctly
- invalid links rejected safely
- documentation links normalized consistently
- operational UIs improved
- reports show documentation status correctly
- `npm run build` passes