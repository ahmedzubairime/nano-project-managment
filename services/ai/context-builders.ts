/**
 * Reusable context builder functions for AI prompt injection.
 *
 * Each builder queries the database and returns a concise,
 * markdown-formatted string suitable for system prompt context.
 */

import { prisma } from "@/lib/prisma";

/**
 * Build a comprehensive project context string by aggregating
 * all relevant operational data for the AI assistant.
 */
export async function buildFullProjectContext(
  projectId: string
): Promise<string> {
  const [metrics, timeline, approvals, centers] = await Promise.all([
    buildProjectMetricsContext(projectId),
    buildTimelineSummaryContext(projectId),
    buildApprovalStatsContext(projectId),
    buildCenterPerformanceContext(projectId),
  ]);

  return [metrics, timeline, approvals, centers].filter(Boolean).join("\n\n");
}

/**
 * Project-level metrics: progress, sessions, delays.
 */
export async function buildProjectMetricsContext(
  projectId: string
): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      description: true,
    },
  });

  if (!project) return "Project not found.";

  const sessions = await prisma.session.findMany({
    where: { projectId },
    select: {
      status: true,
      approvalStatus: true,
      scheduledDate: true,
      activity: { select: { isVolunteer: true } },
    },
  });

  const now = new Date();
  let total = 0;
  let completed = 0;
  let delayed = 0;
  let pending = 0;
  let cancelled = 0;
  let coreTotal = 0;
  let coreCompleted = 0;
  let volTotal = 0;
  let volCompleted = 0;

  sessions.forEach((s) => {
    total++;
    const isCompleted =
      s.status === "COMPLETED" && s.approvalStatus === "APPROVED";
    const isCancelled = s.status === "CANCELLED";
    const isDelayed =
      s.status === "DELAYED" ||
      (!isCompleted &&
        !isCancelled &&
        s.status !== "COMPLETED" &&
        new Date(s.scheduledDate) < now);

    if (isCompleted) completed++;
    else if (isCancelled) cancelled++;
    else pending++;
    if (isDelayed) delayed++;

    const isVol = s.activity?.isVolunteer || false;
    if (isVol) {
      volTotal++;
      if (isCompleted) volCompleted++;
    } else {
      coreTotal++;
      if (isCompleted) coreCompleted++;
    }
  });

  const corePct =
    coreTotal > 0 ? Math.round((coreCompleted / coreTotal) * 100) : 0;
  const volPct =
    volTotal > 0 ? Math.round((volCompleted / volTotal) * 100) : 0;

  return `## Project Overview
- **Name:** ${project.name}
- **Status:** ${project.status}
- **Duration:** ${new Date(project.startDate).toLocaleDateString()} — ${new Date(project.endDate).toLocaleDateString()}
- **Description:** ${project.description || "None"}

## Session Metrics
- **Total Sessions:** ${total}
- **Completed (Approved):** ${completed}
- **Pending:** ${pending}
- **Delayed/Overdue:** ${delayed}
- **Cancelled:** ${cancelled}
- **Core Progress:** ${coreCompleted}/${coreTotal} (${corePct}%)
- **Volunteer Progress:** ${volCompleted}/${volTotal} (${volPct}%)`;
}

/**
 * Timeline summary: upcoming and overdue sessions.
 */
export async function buildTimelineSummaryContext(
  projectId: string
): Promise<string> {
  const now = new Date();

  const [upcoming, overdue] = await Promise.all([
    prisma.session.findMany({
      where: {
        projectId,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        scheduledDate: { gte: now },
      },
      orderBy: { scheduledDate: "asc" },
      take: 8,
      select: {
        scheduledDate: true,
        activity: { select: { title: true } },
        center: { select: { name: true, city: true } },
      },
    }),
    prisma.session.findMany({
      where: {
        projectId,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        scheduledDate: { lt: now },
      },
      orderBy: { scheduledDate: "asc" },
      take: 8,
      select: {
        scheduledDate: true,
        activity: { select: { title: true } },
        center: { select: { name: true, city: true } },
      },
    }),
  ]);

  const lines: string[] = ["## Timeline Summary"];

  if (overdue.length > 0) {
    lines.push(`\n### Overdue Sessions (${overdue.length} shown)`);
    overdue.forEach((s) => {
      lines.push(
        `- ${s.activity?.title || "Unknown"} @ ${s.center?.name || "Unassigned"} (${s.center?.city || ""}) — scheduled ${new Date(s.scheduledDate).toLocaleDateString()}`
      );
    });
  } else {
    lines.push("\n- No overdue sessions.");
  }

  if (upcoming.length > 0) {
    lines.push(`\n### Upcoming Sessions (${upcoming.length} shown)`);
    upcoming.forEach((s) => {
      lines.push(
        `- ${s.activity?.title || "Unknown"} @ ${s.center?.name || "Unassigned"} (${s.center?.city || ""}) — ${new Date(s.scheduledDate).toLocaleDateString()}`
      );
    });
  } else {
    lines.push("\n- No upcoming sessions.");
  }

  return lines.join("\n");
}

/**
 * Approval stats: queue size, approval/rejection rates.
 */
export async function buildApprovalStatsContext(
  projectId: string
): Promise<string> {
  const sessions = await prisma.session.findMany({
    where: { projectId },
    select: { approvalStatus: true },
  });

  let pendingApproval = 0;
  let approved = 0;
  let rejected = 0;
  let notSubmitted = 0;

  sessions.forEach((s) => {
    switch (s.approvalStatus) {
      case "PENDING_APPROVAL":
        pendingApproval++;
        break;
      case "APPROVED":
        approved++;
        break;
      case "REJECTED":
        rejected++;
        break;
      default:
        notSubmitted++;
    }
  });

  const totalDecided = approved + rejected;
  const approvalRate =
    totalDecided > 0 ? Math.round((approved / totalDecided) * 100) : 0;

  return `## Approval Statistics
- **Pending Review:** ${pendingApproval}
- **Approved:** ${approved}
- **Rejected:** ${rejected}
- **Not Yet Submitted:** ${notSubmitted}
- **Approval Rate:** ${approvalRate}% (of decided)`;
}

/**
 * Center performance: per-center completion and delay metrics.
 */
export async function buildCenterPerformanceContext(
  projectId: string
): Promise<string> {
  const now = new Date();

  const [sessions, projectCenters] = await Promise.all([
    prisma.session.findMany({
      where: { projectId },
      select: {
        centerId: true,
        status: true,
        approvalStatus: true,
        scheduledDate: true,
        activity: { select: { isVolunteer: true } },
      },
    }),
    prisma.projectCenter.findMany({
      where: { projectId },
      include: {
        center: { select: { id: true, name: true, city: true } },
      },
    }),
  ]);

  const centerMap = new Map<
    string,
    {
      name: string;
      city: string;
      assigned: number;
      completed: number;
      delayed: number;
    }
  >();

  projectCenters.forEach((pc) => {
    if (pc.center) {
      centerMap.set(pc.center.id, {
        name: pc.center.name,
        city: pc.center.city,
        assigned: 0,
        completed: 0,
        delayed: 0,
      });
    }
  });

  sessions.forEach((s) => {
    if (!s.centerId) return;
    if (s.activity?.isVolunteer) return; // Only core sessions for performance

    const entry = centerMap.get(s.centerId);
    if (!entry) return;

    entry.assigned++;

    const isCompleted =
      s.status === "COMPLETED" && s.approvalStatus === "APPROVED";
    const isCancelled = s.status === "CANCELLED";
    const isDelayed =
      s.status === "DELAYED" ||
      (!isCompleted &&
        !isCancelled &&
        s.status !== "COMPLETED" &&
        new Date(s.scheduledDate) < now);

    if (isCompleted) entry.completed++;
    if (isDelayed) entry.delayed++;
  });

  if (centerMap.size === 0) return "## Center Performance\n- No centers assigned.";

  const lines: string[] = [
    "## Center Performance",
    "",
    "| Center | City | Assigned | Completed | Delayed | Completion % |",
    "|--------|------|----------|-----------|---------|--------------|",
  ];

  centerMap.forEach((stats) => {
    const pct =
      stats.assigned > 0
        ? Math.round((stats.completed / stats.assigned) * 100)
        : 0;
    lines.push(
      `| ${stats.name} | ${stats.city} | ${stats.assigned} | ${stats.completed} | ${stats.delayed} | ${pct}% |`
    );
  });

  return lines.join("\n");
}
