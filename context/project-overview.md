# Field Project Management System

## Overview

Field Project Management System is a multi-project operations management platform designed for organizations running field programs across multiple centers, branches, or cities.

A project manager creates projects with fixed durations, defines project activities and required sessions, and the system automatically distributes sessions across participating centers based on project timelines and selected centers.

Center managers are responsible for executing assigned sessions, uploading documentation links, and submitting execution records for approval.

The system provides planning, scheduling, approval workflows, progress tracking, delay detection, reporting, and project-level operational visibility.

## Goals

1. Allow project managers to create and manage multiple field projects.
2. Support projects operating across multiple centers with independent center managers.
3. Automatically distribute planned sessions across centers and project timelines.
4. Track execution at the session level with approval workflows.
5. Provide project progress tracking, delay monitoring, and operational analytics.
6. Support center-level volunteer activities alongside planned project work.
7. Provide bilingual Arabic and English support.

## Core User Flow

1. Project manager signs in.
2. Project manager creates or selects a project.
3. Project manager defines:
   - project duration
   - participating centers
   - center managers
   - project activities
   - required session counts
4. Project manager selects which centers each activity applies to.
5. System automatically distributes sessions across:
   - selected centers
   - available project dates
6. Project manager reviews and confirms the generated schedule.
7. Center managers access assigned sessions.
8. Center managers execute sessions and submit:
   - completion updates
   - documentation links
9. Submitted sessions enter approval review.
10. Project manager approves or rejects submissions.
11. System updates project progress, analytics, and delay indicators.

## User Roles

### Project Manager

Can:

- Create and manage projects
- Configure centers and managers
- Define activities and sessions
- Review automatic scheduling
- Manually adjust schedules
- Approve or reject session execution
- Send manual notifications
- View analytics and reports
- Access AI assistant tools

### Center Manager

Can:

- Access assigned project centers
- View scheduled sessions
- Update execution status
- Upload Google Drive documentation links
- Submit sessions for approval
- Create volunteer activities with full activity/session workflow

Cannot:

- Modify project planning or scheduling

### Viewer

Can:

- View project dashboards and reports
- Access read-only project information

## Features

### Project Management

- Multi-project support
- Project lifecycle management
- Project archive mode (read-only after completion)

### Centers and Managers

- Independent center records
- Per-project participating centers
- Center manager assignments

### Activity Planning

- Project-level master activities
- Activity targeting by center
- Session count planning
- Manual scheduling overrides

### Automatic Session Distribution

- Timeline-aware scheduling
- Distribution across selected centers
- Deterministic scheduling rules
- Manual review before activation

### Session Execution

Each session is an executable unit containing:

- assigned center
- scheduled date
- status
- documentation link
- notes
- approval state

### Approval Workflow

Session lifecycle:

- Pending
- In Progress
- Completed
- Delayed
- Cancelled

Submission states:

- Pending Approval
- Approved
- Rejected

Rejected submissions require review feedback.

### Volunteer Activities

Center managers can create volunteer activities that include:

- activities
- sessions
- documentation
- approvals
- timeline visibility

Volunteer work contributes to reporting without altering baseline required project totals.

### Notifications

Automatic notifications:

- delayed sessions
- delayed activities
- upcoming deadlines

Manual notifications:

- project manager broadcasts to selected centers

### Reporting and Analytics

Reports:

- project report
- center report
- activity report
- delay report
- monthly progress report

Analytics:

- progress percentages
- delay indicators
- completion summaries
- center comparisons

### AI Assistant

Project manager only.

Capabilities:

- progress queries
- project summaries
- delay analysis
- schedule insights
- operational data entry assistance

Powered through OpenRouter.

## Scope

### In Scope

- authentication and role permissions
- multi-project support
- center management
- activity and session planning
- automatic session distribution
- approval workflows
- progress tracking
- Gantt timeline views
- notifications
- reporting
- AI assistant
- bilingual support

### Out Of Scope

- billing systems
- public project creation
- external file uploads
- internal file storage
- mobile-native apps
- advanced enterprise permission hierarchies

## Success Criteria

1. Project manager can create and configure projects.
2. Activities can be distributed automatically across centers and dates.
3. Center managers can execute and document sessions.
4. Project manager can approve or reject submitted sessions.
5. Progress and delays are calculated automatically.
6. Project dashboards accurately reflect operational status.