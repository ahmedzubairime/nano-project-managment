Read `AGENTS.md` before starting.

Build the AI Assistant operational shell.

The AI assistant is an optional operational helper for project managers.

The assistant should feel integrated into the platform without replacing core workflows.

This feature builds the infrastructure and UI shell only.

No advanced AI orchestration yet.

## Objective

Create the AI assistant framework and conversational UI.

The assistant will later support:

- project insights
- operational summaries
- scheduling analysis
- reporting assistance
- workflow guidance

## AI Scope

Only PROJECT_MANAGER users can access AI functionality.

Center managers and viewers cannot access AI features.

## Provider Architecture

The system uses:

- OpenRouter

Create provider abstraction layers for future model flexibility.

## Backend Architecture

Create:

- `services/ai/`
- `services/ai/openrouter.ts`
- `services/ai/prompts/`

## Environment Variables

Add:

- `OPENROUTER_API_KEY`

Do not expose server secrets client-side.

## API Routes

Create:

### POST `/api/ai/chat`

Accepts:

- projectId
- conversation messages

Returns:

- assistant response

## Security Rules

Enforce:

- authenticated users only
- PROJECT_MANAGER role required
- project membership validation

## UI Requirements

Build:

- AI sidebar panel
- assistant conversation area
- prompt input
- loading states
- empty state suggestions

## Suggested Prompt Examples

Examples only:

- "What sessions are delayed?"
- "Summarize project progress."
- "Which centers are underperforming?"
- "Show approval bottlenecks."

## UX Rules

The assistant should feel:

- operational
- concise
- informative

Avoid chat-app aesthetics.

## Context Injection

Prepare reusable context builders for:

- project metrics
- timeline summaries
- approval stats
- center performance

Do not build advanced agent workflows yet.

## Persistence Rules

Conversation persistence is optional for now.

Simple in-memory client state is acceptable initially.

## Constraints

Do not implement:

- autonomous AI actions
- automatic scheduling edits
- AI approvals
- AI-generated reports
- embeddings/vector databases

Focus only on the assistant shell and request pipeline.

## Check When Done

- AI sidebar works
- OpenRouter requests function correctly
- permissions enforced
- loading/error states handled
- project context injection prepared
- `npm run build` passes