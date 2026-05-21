import { prisma } from "@/lib/prisma";

// ─── Shared Filter Interface ───────────────────────────────────────────────────

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  centerId?: string;
  activityId?: string;
  approvalStatus?: string;
  volunteerOnly?: boolean;
}

/**
 * Build Prisma `where` clause for session filtering based on report filters.
 */
function buildSessionWhere(projectId: string, filters: ReportFilters) {
  const where: Record<string, unknown> = { projectId };

  if (filters.dateFrom || filters.dateTo) {
    const scheduledDate: Record<string, Date> = {};
    if (filters.dateFrom) scheduledDate.gte = new Date(filters.dateFrom);
    if (filters.dateTo) scheduledDate.lte = new Date(filters.dateTo);
    where.scheduledDate = scheduledDate;
  }

  if (filters.centerId) {
    where.centerId = filters.centerId;
  }

  if (filters.activityId) {
    where.activityId = filters.activityId;
  }

  if (filters.approvalStatus) {
    where.approvalStatus = filters.approvalStatus;
  }

  if (filters.volunteerOnly) {
    where.activity = { isVolunteer: true };
  }

  return where;
}

// ─── Overview Report ───────────────────────────────────────────────────────────

export interface ActivityBreakdown {
  activityId: string;
  activityTitle: string;
  isVolunteer: boolean;
  totalSessions: number;
  completedSessions: number;
  delayedSessions: number;
  completionPercentage: number;
}

export interface OverviewReport {
  totalSessions: number;
  completedSessions: number;
  delayedSessions: number;
  cancelledSessions: number;
  pendingSessions: number;
  coreCompletionPercentage: number;
  volunteerCompletionPercentage: number;
  approvedCount: number;
  rejectedCount: number;
  pendingApprovalCount: number;
  approvalRate: number;
  activityBreakdown: ActivityBreakdown[];
}

export async function getOverviewReport(
  projectId: string,
  filters: ReportFilters
): Promise<OverviewReport> {
  const now = new Date();
  const where = buildSessionWhere(projectId, filters);

  const sessions = await prisma.session.findMany({
    where,
    include: {
      activity: {
        select: { id: true, title: true, isVolunteer: true },
      },
    },
  });

  let completedSessions = 0;
  let delayedSessions = 0;
  let cancelledSessions = 0;
  let pendingSessions = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  let pendingApprovalCount = 0;
  let coreTotal = 0;
  let coreCompleted = 0;
  let volTotal = 0;
  let volCompleted = 0;

  // Activity-level aggregation map
  const activityMap = new Map<
    string,
    {
      title: string;
      isVolunteer: boolean;
      total: number;
      completed: number;
      delayed: number;
    }
  >();

  sessions.forEach((s) => {
    const isCompleted =
      s.status === "COMPLETED" && s.approvalStatus === "APPROVED";
    const isCancelled = s.status === "CANCELLED";
    const isDelayed =
      s.status === "DELAYED" ||
      (!isCompleted &&
        !isCancelled &&
        s.status !== "COMPLETED" &&
        new Date(s.scheduledDate) < now);

    if (isCompleted) completedSessions++;
    else if (isCancelled) cancelledSessions++;
    else pendingSessions++;

    if (isDelayed) delayedSessions++;

    if (s.approvalStatus === "APPROVED") approvedCount++;
    else if (s.approvalStatus === "REJECTED") rejectedCount++;
    else if (s.approvalStatus === "PENDING_APPROVAL") pendingApprovalCount++;

    const isVol = s.activity?.isVolunteer || false;
    if (isVol) {
      volTotal++;
      if (isCompleted) volCompleted++;
    } else {
      coreTotal++;
      if (isCompleted) coreCompleted++;
    }

    // Activity-level
    const actId = s.activityId;
    const current = activityMap.get(actId) || {
      title: s.activity?.title || "Unknown",
      isVolunteer: isVol,
      total: 0,
      completed: 0,
      delayed: 0,
    };
    current.total++;
    if (isCompleted) current.completed++;
    if (isDelayed) current.delayed++;
    activityMap.set(actId, current);
  });

  const totalDecided = approvedCount + rejectedCount;
  const approvalRate =
    totalDecided > 0 ? Math.round((approvedCount / totalDecided) * 100) : 0;

  const activityBreakdown: ActivityBreakdown[] = Array.from(
    activityMap.entries()
  ).map(([activityId, stats]) => ({
    activityId,
    activityTitle: stats.title,
    isVolunteer: stats.isVolunteer,
    totalSessions: stats.total,
    completedSessions: stats.completed,
    delayedSessions: stats.delayed,
    completionPercentage:
      stats.total > 0
        ? Math.round((stats.completed / stats.total) * 100)
        : 0,
  }));

  return {
    totalSessions: sessions.length,
    completedSessions,
    delayedSessions,
    cancelledSessions,
    pendingSessions,
    coreCompletionPercentage:
      coreTotal > 0 ? Math.round((coreCompleted / coreTotal) * 100) : 0,
    volunteerCompletionPercentage:
      volTotal > 0 ? Math.round((volCompleted / volTotal) * 100) : 0,
    approvedCount,
    rejectedCount,
    pendingApprovalCount,
    approvalRate,
    activityBreakdown,
  };
}

// ─── Centers Report ────────────────────────────────────────────────────────────

export interface CenterReportMetric {
  centerId: string;
  centerName: string;
  city: string;
  assignedSessions: number;
  completedSessions: number;
  delayedSessions: number;
  completionRate: number;
  delayRate: number;
  volunteerSessions: number;
  volunteerCompleted: number;
  avgApprovalTurnaroundHours: number | null;
}

export interface CentersReport {
  centers: CenterReportMetric[];
}

export async function getCentersReport(
  projectId: string,
  filters: ReportFilters
): Promise<CentersReport> {
  const now = new Date();
  const where = buildSessionWhere(projectId, filters);

  const [sessions, participatingCenters] = await Promise.all([
    prisma.session.findMany({
      where,
      include: {
        activity: { select: { isVolunteer: true } },
        center: { select: { id: true, name: true, city: true } },
        approvals: {
          select: { reviewedAt: true },
          orderBy: { reviewedAt: "desc" as const },
          take: 1,
        },
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
      volSessions: number;
      volCompleted: number;
      turnaroundSums: number[];
    }
  >();

  // Seed map with all participating centers
  participatingCenters.forEach((pc) => {
    if (pc.center) {
      centerMap.set(pc.center.id, {
        name: pc.center.name,
        city: pc.center.city,
        assigned: 0,
        completed: 0,
        delayed: 0,
        volSessions: 0,
        volCompleted: 0,
        turnaroundSums: [],
      });
    }
  });

  sessions.forEach((s) => {
    if (!s.centerId) return;
    const isCompleted =
      s.status === "COMPLETED" && s.approvalStatus === "APPROVED";
    const isCancelled = s.status === "CANCELLED";
    const isDelayed =
      s.status === "DELAYED" ||
      (!isCompleted &&
        !isCancelled &&
        s.status !== "COMPLETED" &&
        new Date(s.scheduledDate) < now);
    const isVol = s.activity?.isVolunteer || false;

    const entry = centerMap.get(s.centerId) || {
      name: s.center?.name || "Unknown",
      city: s.center?.city || "",
      assigned: 0,
      completed: 0,
      delayed: 0,
      volSessions: 0,
      volCompleted: 0,
      turnaroundSums: [],
    };

    if (isVol) {
      entry.volSessions++;
      if (isCompleted) entry.volCompleted++;
    } else {
      entry.assigned++;
      if (isCompleted) entry.completed++;
      if (isDelayed) entry.delayed++;
    }

    // Approval turnaround calculation
    if (s.submittedAt && s.approvals.length > 0) {
      const reviewedAt = s.approvals[0].reviewedAt;
      const hours =
        (new Date(reviewedAt).getTime() - new Date(s.submittedAt).getTime()) /
        (1000 * 60 * 60);
      if (hours >= 0) entry.turnaroundSums.push(hours);
    }

    centerMap.set(s.centerId, entry);
  });

  const centers: CenterReportMetric[] = Array.from(
    centerMap.entries()
  ).map(([centerId, stats]) => {
    const avgTurnaround =
      stats.turnaroundSums.length > 0
        ? Math.round(
            (stats.turnaroundSums.reduce((a, b) => a + b, 0) /
              stats.turnaroundSums.length) *
              10
          ) / 10
        : null;

    return {
      centerId,
      centerName: stats.name,
      city: stats.city,
      assignedSessions: stats.assigned,
      completedSessions: stats.completed,
      delayedSessions: stats.delayed,
      completionRate:
        stats.assigned > 0
          ? Math.round((stats.completed / stats.assigned) * 100)
          : 0,
      delayRate:
        stats.assigned > 0
          ? Math.round((stats.delayed / stats.assigned) * 100)
          : 0,
      volunteerSessions: stats.volSessions,
      volunteerCompleted: stats.volCompleted,
      avgApprovalTurnaroundHours: avgTurnaround,
    };
  });

  return { centers };
}

// ─── Timeline Report ───────────────────────────────────────────────────────────

export interface WeeklyBucket {
  weekLabel: string;
  weekStart: string;
  totalSessions: number;
  completedSessions: number;
  overdueSessions: number;
}

export interface TimelineReport {
  weeklyBuckets: WeeklyBucket[];
  bottleneckWeeks: string[];
  totalOverdue: number;
  totalScheduled: number;
}

export async function getTimelineReport(
  projectId: string,
  filters: ReportFilters
): Promise<TimelineReport> {
  const now = new Date();
  const where = buildSessionWhere(projectId, filters);

  const [sessions, project] = await Promise.all([
    prisma.session.findMany({
      where,
      select: {
        scheduledDate: true,
        status: true,
        approvalStatus: true,
      },
    }),
    prisma.project.findUnique({
      where: { id: projectId },
      select: { startDate: true, endDate: true },
    }),
  ]);

  if (!project) {
    return {
      weeklyBuckets: [],
      bottleneckWeeks: [],
      totalOverdue: 0,
      totalScheduled: 0,
    };
  }

  // Build weekly buckets from project start to end
  const bucketMap = new Map<
    string,
    {
      weekStart: Date;
      total: number;
      completed: number;
      overdue: number;
    }
  >();

  // Override date range if filters provided
  const rangeStart = filters.dateFrom
    ? new Date(filters.dateFrom)
    : new Date(project.startDate);
  const rangeEnd = filters.dateTo
    ? new Date(filters.dateTo)
    : new Date(project.endDate);

  // Generate weekly slots
  const weekCursor = new Date(rangeStart);
  // Align to Monday
  weekCursor.setDate(weekCursor.getDate() - ((weekCursor.getDay() + 6) % 7));
  while (weekCursor <= rangeEnd) {
    const key = weekCursor.toISOString().split("T")[0];
    bucketMap.set(key, {
      weekStart: new Date(weekCursor),
      total: 0,
      completed: 0,
      overdue: 0,
    });
    weekCursor.setDate(weekCursor.getDate() + 7);
  }

  let totalOverdue = 0;

  sessions.forEach((s) => {
    const schedDate = new Date(s.scheduledDate);
    // Find the week bucket this session belongs to
    const weekStart = new Date(schedDate);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const key = weekStart.toISOString().split("T")[0];

    const isCompleted =
      s.status === "COMPLETED" && s.approvalStatus === "APPROVED";
    const isCancelled = s.status === "CANCELLED";
    const isOverdue =
      s.status === "DELAYED" ||
      (!isCompleted &&
        !isCancelled &&
        s.status !== "COMPLETED" &&
        schedDate < now);

    const bucket = bucketMap.get(key);
    if (bucket) {
      bucket.total++;
      if (isCompleted) bucket.completed++;
      if (isOverdue) bucket.overdue++;
    }

    if (isOverdue) totalOverdue++;
  });

  const weeklyBuckets: WeeklyBucket[] = Array.from(bucketMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, bucket]) => {
      const weekEnd = new Date(bucket.weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return {
        weekLabel: `${bucket.weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        weekStart: bucket.weekStart.toISOString().split("T")[0],
        totalSessions: bucket.total,
        completedSessions: bucket.completed,
        overdueSessions: bucket.overdue,
      };
    });

  // Identify bottleneck weeks (top 3 by overdue count, if > 0)
  const bottleneckWeeks = weeklyBuckets
    .filter((w) => w.overdueSessions > 0)
    .sort((a, b) => b.overdueSessions - a.overdueSessions)
    .slice(0, 3)
    .map((w) => w.weekLabel);

  return {
    weeklyBuckets,
    bottleneckWeeks,
    totalOverdue,
    totalScheduled: sessions.length,
  };
}

// ─── Volunteer Report ──────────────────────────────────────────────────────────

export interface VolunteerCenterMetric {
  centerId: string;
  centerName: string;
  city: string;
  volunteerSessions: number;
  volunteerCompleted: number;
  completionRate: number;
}

export interface VolunteerReport {
  totalVolunteerSessions: number;
  completedVolunteerSessions: number;
  overallCompletionRate: number;
  centerBreakdown: VolunteerCenterMetric[];
}

export async function getVolunteerReport(
  projectId: string,
  filters: ReportFilters
): Promise<VolunteerReport> {
  // Force volunteer filter
  const volFilters = { ...filters, volunteerOnly: true };
  const where = buildSessionWhere(projectId, volFilters);

  const sessions = await prisma.session.findMany({
    where,
    include: {
      center: { select: { id: true, name: true, city: true } },
    },
  });

  let totalVol = 0;
  let completedVol = 0;

  const centerMap = new Map<
    string,
    {
      name: string;
      city: string;
      total: number;
      completed: number;
    }
  >();

  sessions.forEach((s) => {
    const isCompleted =
      s.status === "COMPLETED" && s.approvalStatus === "APPROVED";
    totalVol++;
    if (isCompleted) completedVol++;

    if (s.centerId) {
      const entry = centerMap.get(s.centerId) || {
        name: s.center?.name || "Unknown",
        city: s.center?.city || "",
        total: 0,
        completed: 0,
      };
      entry.total++;
      if (isCompleted) entry.completed++;
      centerMap.set(s.centerId, entry);
    }
  });

  const centerBreakdown: VolunteerCenterMetric[] = Array.from(
    centerMap.entries()
  ).map(([centerId, stats]) => ({
    centerId,
    centerName: stats.name,
    city: stats.city,
    volunteerSessions: stats.total,
    volunteerCompleted: stats.completed,
    completionRate:
      stats.total > 0
        ? Math.round((stats.completed / stats.total) * 100)
        : 0,
  }));

  return {
    totalVolunteerSessions: totalVol,
    completedVolunteerSessions: completedVol,
    overallCompletionRate:
      totalVol > 0 ? Math.round((completedVol / totalVol) * 100) : 0,
    centerBreakdown,
  };
}
