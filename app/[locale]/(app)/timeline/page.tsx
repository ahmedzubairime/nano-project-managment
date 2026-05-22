"use client";

import * as React from "react";
import { useProject } from "@/lib/project-context";
import { useTranslations, useLocale } from "next-intl";
import {
  GanttChart as GanttChartIcon,
  Loader2,
  RefreshCw,
  BarChart3,
  CalendarDays,
  Building2,
  Layers,
  ZoomIn,
  ZoomOut,
  Clock,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
  X,
  Info,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseDriveUrl, normalizeDriveUrl } from "@/lib/drive-links";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Lazy load the Gantt chart to avoid SSR issues
const GanttChart = React.lazy(() =>
  import("@/components/timeline/gantt-chart").then((mod) => ({
    default: mod.GanttChart,
  }))
);

import type { GanttTask } from "@/components/timeline/gantt-chart";

// ─── Types ───────────────────────────────────────────────

type ViewType = "activity" | "session";
type GroupBy = "activity" | "center";
type ZoomLevel = "Week" | "Month" | "Quarter Year";

interface TimelineMeta {
  type: "activity" | "session";
  activityId: string;
  activityTitle: string;
  centerId?: string;
  centerName?: string;
  centerCity?: string;
  sessionStatus?: string;
  approvalStatus?: string;
  isLocked?: boolean;
  isManuallyAdjusted?: boolean;
  isDelayed?: boolean;
  notes?: string | null;
  documentationUrl?: string | null;
  scheduledDate?: string;
  isVolunteer?: boolean;
}

interface TimelineResponse {
  tasks: (GanttTask & { meta: TimelineMeta })[];
  projectStart: string;
  projectEnd: string;
  summary: {
    totalActivities: number;
    totalSessions: number;
    completedSessions: number;
    delayedSessions: number;
    pendingSessions: number;
  };
}

// ─── Page Component ──────────────────────────────────────

export default function TimelinePage() {
  const { activeProject } = useProject();
  const t = useTranslations("timeline");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  // View controls
  const [viewType, setViewType] = React.useState<ViewType>("activity");
  const [groupBy, setGroupBy] = React.useState<GroupBy>("activity");
  const [zoom, setZoom] = React.useState<ZoomLevel>("Month");
  const [activityType, setActivityType] = React.useState<"all" | "core" | "volunteer">("all");

  // Data
  const [timelineData, setTimelineData] = React.useState<TimelineResponse | null>(null);
  const [sessionTasks, setSessionTasks] = React.useState<(GanttTask & { meta: TimelineMeta })[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Detail preview
  const [selectedTask, setSelectedTask] = React.useState<(GanttTask & { meta: TimelineMeta }) | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  // ─── Fetch timeline data ────────────────────────────────
  const fetchTimeline = React.useCallback(async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const typeParam = activityType !== "all" ? `&type=${activityType}` : "";
      const res = await fetch(
        `/api/projects/${activeProject.id}/timeline?groupBy=${groupBy}${typeParam}`
      );
      if (!res.ok) throw new Error(t("loadingTimeline"));
      const data: TimelineResponse = await res.json();
      setTimelineData(data);

      // For session view, also fetch individual session tasks
      if (viewType === "session") {
        const sessRes = await fetch(`/api/projects/${activeProject.id}/sessions`);
        if (sessRes.ok) {
          const sessions = await sessRes.json();
          const now = new Date();
          const mappedTasks = sessions
            .filter((s: any) => {
              if (s.status === "CANCELLED") return false;
              if (activityType === "core" && s.activity?.isVolunteer) return false;
              if (activityType === "volunteer" && !s.activity?.isVolunteer) return false;
              return true;
            })
            .map((s: any) => {
              const scheduledDate = new Date(s.scheduledDate);
              const endDate = new Date(scheduledDate);
              endDate.setDate(endDate.getDate() + 1);
              const isCompleted = s.status === "COMPLETED";
              const isDelayed =
                s.status === "DELAYED" ||
                (!isCompleted && scheduledDate < now);
              const effectiveStatus = isDelayed ? "DELAYED" : s.status;
              const isVol = s.activity?.isVolunteer || false;
              return {
                id: `session-${s.id}`,
                name: `${s.activity?.title || t("sessionDetails")} — ${s.center?.name || tCommon("none")}`,
                start: formatDate(scheduledDate),
                end: formatDate(endDate),
                progress: isCompleted ? 100 : 0,
                status: effectiveStatus,
                customClass: `gantt-status-${effectiveStatus.toLowerCase()}${isVol ? " gantt-volunteer" : ""}`,
                meta: {
                  type: "session" as const,
                  activityId: s.activityId,
                  activityTitle: s.activity?.title || "Unknown",
                  centerId: s.centerId,
                  centerName: s.center?.name || tCommon("none"),
                  centerCity: s.center?.city || "",
                  sessionStatus: s.status,
                  approvalStatus: s.approvalStatus,
                  isLocked: s.isLocked,
                  isManuallyAdjusted: s.isManuallyAdjusted,
                  isDelayed,
                  notes: s.notes,
                  documentationUrl: s.documentationUrl,
                  scheduledDate: formatDate(scheduledDate),
                  isVolunteer: isVol,
                },
              };
            });
          setSessionTasks(mappedTasks);
        }
      }
    } catch (err: any) {
      toast.error(err.message || t("loadingTimeline"));
    } finally {
      setLoading(false);
    }
  }, [activeProject, groupBy, viewType, activityType, t, tCommon]);

  React.useEffect(() => {
    if (activeProject) {
      fetchTimeline();
    }
  }, [activeProject, fetchTimeline]);

  // ─── Task click handler ─────────────────────────────────
  const handleTaskClick = React.useCallback((task: GanttTask) => {
    const taskWithMeta = task as GanttTask & { meta: TimelineMeta };
    setSelectedTask(taskWithMeta);
    setDetailOpen(true);
  }, []);

  // ─── Determine which tasks to display ───────────────────
  const displayTasks = React.useMemo(() => {
    if (viewType === "session") {
      return sessionTasks;
    }
    return timelineData?.tasks || [];
  }, [viewType, sessionTasks, timelineData]);

  // ─── No project selected ───────────────────────────────
  if (!activeProject) {
    return (
      <EmptyState
        icon={GanttChartIcon}
        title={t("noProject")}
        description={t("noProjectDesc")}
      />
    );
  }

  const summary = timelineData?.summary;

  return (
    <div className="layout-section">
      {/* ═══ Page Header ═══ */}
      <div className="layout-page-header flex-col sm:flex-row items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {t("title")}
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {t("subtitle")}{" "}
            <strong>{activeProject.name}</strong>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTimeline}
          disabled={loading}
          className="flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          {t("reload")}
        </Button>
      </div>

      {/* ═══ Summary Cards ═══ */}
      {summary && summary.totalSessions > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            icon={<Layers className="size-4" />}
            label={t("totalActivities")}
            value={summary.totalActivities}
            colorClass="text-brand-primary"
          />
          <SummaryCard
            icon={<CalendarDays className="size-4" />}
            label={t("totalSessions")}
            value={summary.totalSessions}
            colorClass="text-status-in-progress"
          />
          <SummaryCard
            icon={<CheckCircle className="size-4" />}
            label={t("completedLabel")}
            value={summary.completedSessions}
            colorClass="text-status-completed"
          />
          <SummaryCard
            icon={<AlertTriangle className="size-4" />}
            label={t("delayedLabel")}
            value={summary.delayedSessions}
            colorClass="text-status-delayed"
          />
        </div>
      )}

      {/* ═══ Toolbar ═══ */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between rounded-xl border border-border/60 bg-card/50 p-3">
        {/* Left side: View and Group controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Switcher */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            <ToolbarButton
              active={viewType === "activity"}
              onClick={() => setViewType("activity")}
              icon={<BarChart3 className="size-3.5" />}
              label={t("activityView")}
            />
            <ToolbarButton
              active={viewType === "session"}
              onClick={() => setViewType("session")}
              icon={<CalendarDays className="size-3.5" />}
              label={t("sessionView")}
            />
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border hidden sm:block" />

          {/* Grouping (only in activity view) */}
          {viewType === "activity" && (
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
              <ToolbarButton
                active={groupBy === "activity"}
                onClick={() => setGroupBy("activity")}
                icon={<Layers className="size-3.5" />}
                label={t("groupByActivity")}
              />
              <ToolbarButton
                active={groupBy === "center"}
                onClick={() => setGroupBy("center")}
                icon={<Building2 className="size-3.5" />}
                label={t("groupByCenter")}
              />
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-6 bg-border hidden sm:block" />

          {/* Type Filter (Core / Volunteer) */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            <ToolbarButton
              active={activityType === "all"}
              onClick={() => setActivityType("all")}
              icon={<Layers className="size-3.5" />}
              label={t("allTypes")}
            />
            <ToolbarButton
              active={activityType === "core"}
              onClick={() => setActivityType("core")}
              icon={<CheckCircle className="size-3.5" />}
              label={t("core")}
            />
            <ToolbarButton
              active={activityType === "volunteer"}
              onClick={() => setActivityType("volunteer")}
              icon={<Sparkles className="size-3.5" />}
              label={t("volunteer")}
            />
          </div>
        </div>

        {/* Right side: Zoom controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-medium hidden sm:inline">
            {t("zoom")}:
          </span>
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            <ToolbarButton
              active={zoom === "Week"}
              onClick={() => setZoom("Week")}
              icon={<ZoomIn className="size-3.5" />}
              label={t("week")}
            />
            <ToolbarButton
              active={zoom === "Month"}
              onClick={() => setZoom("Month")}
              icon={<Clock className="size-3.5" />}
              label={t("month")}
            />
            <ToolbarButton
              active={zoom === "Quarter Year"}
              onClick={() => setZoom("Quarter Year")}
              icon={<ZoomOut className="size-3.5" />}
              label={t("quarter")}
            />
          </div>
        </div>
      </div>

      {/* ═══ Gantt Chart Content ═══ */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="size-8 text-primary animate-spin" />
          <p className="text-sm text-text-muted">
            {t("loadingTimeline")}
          </p>
        </div>
      ) : displayTasks.length === 0 ? (
        <div className="py-16 bg-muted/5 border border-dashed border-border rounded-xl">
          <EmptyState
            icon={GanttChartIcon}
            title={t("noData")}
            description={t("noDataDesc")}
          />
        </div>
      ) : (
        <>
          {/* Desktop/Tablet: Gantt Chart */}
          <div className="layout-timeline hidden sm:block">
            <React.Suspense
              fallback={
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="size-6 text-primary animate-spin" />
                </div>
              }
            >
              <GanttChart
                tasks={displayTasks}
                viewMode={zoom}
                onTaskClick={handleTaskClick}
              />
            </React.Suspense>
          </div>

          {/* Mobile: Simplified list mode */}
          <div className="sm:hidden flex flex-col gap-2">
            <div className="flex items-center gap-2 px-1 py-2">
              <Info className="size-3.5 text-text-muted" />
              <span className="text-xs text-text-muted">
                {t("mobileNote")}
              </span>
            </div>
            {displayTasks.map((task) => (
              <MobileTaskCard
                key={task.id}
                task={task as GanttTask & { meta: TimelineMeta }}
                onClick={() => handleTaskClick(task)}
              />
            ))}
          </div>

          {/* ═══ Legend ═══ */}
          <div className="flex flex-wrap items-center gap-3 px-1 pt-2">
            <span className="text-xs text-text-muted font-medium">{t("legend")}:</span>
            <LegendItem color="bg-status-pending" label={t("pending")} />
            <LegendItem color="bg-status-completed" label={t("complete")} />
            <LegendItem color="bg-status-delayed" label={t("overdue")} />
            <LegendItem color="bg-status-in-progress" label={t("inProgress")} />
            <LegendItem color="bg-status-volunteer" label={t("volunteer")} />
          </div>
        </>
      )}

      {/* ═══ Detail Preview Dialog ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[420px]">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg leading-snug">
                  {selectedTask.meta?.type === "session"
                    ? t("sessionDetails")
                    : t("activityOverview")}
                </DialogTitle>
              </DialogHeader>
              <DetailPreview task={selectedTask} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub Components ──────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div className="layout-card-compact flex items-center gap-3">
      <div className={`${colorClass} opacity-80`}>{icon}</div>
      <div>
        <p className="text-lg font-bold text-text-primary leading-tight">
          {value}
        </p>
        <p className="text-[11px] text-text-muted font-medium">{label}</p>
      </div>
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
        transition-all duration-150 cursor-pointer
        ${
          active
            ? "bg-background text-text-primary shadow-sm border border-border/50"
            : "text-text-muted hover:text-text-secondary hover:bg-background/50"
        }
      `}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`size-2.5 rounded-full ${color}`} />
      <span className="text-[11px] text-text-muted">{label}</span>
    </div>
  );
}

function MobileTaskCard({
  task,
  onClick,
}: {
  task: GanttTask & { meta: TimelineMeta };
  onClick: () => void;
}) {
  const t = useTranslations("timeline");
  const meta = task.meta;
  const isDelayed = meta?.isDelayed;

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left layout-card-compact flex items-center gap-3
        hover:border-border-strong transition-colors cursor-pointer
        ${isDelayed ? "border-status-delayed/30 bg-status-delayed/5" : ""}
      `}
    >
      <div
        className={`
          size-2 rounded-full shrink-0
          ${isDelayed ? "bg-status-delayed" : task.status === "COMPLETED" ? "bg-status-completed" : "bg-status-pending"}
        `}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary truncate">
          {task.name}
        </p>
        <p className="text-[11px] text-text-muted">
          {task.start} → {task.end} · {task.progress}% {t("complete")}
        </p>
      </div>
      {isDelayed && (
        <AlertTriangle className="size-3.5 text-status-delayed shrink-0" />
      )}
    </button>
  );
}

function DetailPreview({
  task,
}: {
  task: GanttTask & { meta: TimelineMeta };
}) {
  const t = useTranslations("timeline");
  const locale = useLocale();
  const meta = task.meta;

  const parsedLink = React.useMemo(() => {
    return meta.documentationUrl ? parseDriveUrl(meta.documentationUrl) : null;
  }, [meta.documentationUrl]);

  return (

    <div className="space-y-4 py-2">
      {/* Title */}
      <div className="space-y-1">
        <h3 className="font-semibold text-text-primary text-base">
          {meta.activityTitle}
        </h3>
        {meta.centerName && (
          <div className="flex items-center gap-1.5 text-sm text-text-secondary">
            <Building2 className="size-3.5" />
            <span>
              {meta.centerName}
              {meta.centerCity ? ` (${meta.centerCity})` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {meta.sessionStatus && (
          <StatusBadge status={meta.sessionStatus} />
        )}
        {meta.approvalStatus && meta.approvalStatus !== "NOT_SUBMITTED" && (
          <ApprovalBadge status={meta.approvalStatus} />
        )}
        {meta.isDelayed && (
          <Badge
            variant="destructive"
            className="bg-status-delayed/15 text-status-delayed-foreground border-status-delayed/30 text-[10px] font-semibold"
          >
            <AlertTriangle className="size-2.5 mr-1" />
            {t("overdue")}
          </Badge>
        )}
      </div>

      {/* Details Grid */}
      <div className="bg-muted/30 border border-border/40 rounded-lg p-3 space-y-2 text-xs">
        {meta.scheduledDate && (
          <DetailRow
            label={t("scheduledDate")}
            value={new Date(meta.scheduledDate).toLocaleDateString(locale)}
          />
        )}
        <DetailRow label={t("dateRange")} value={`${task.start} → ${task.end}`} />
        <DetailRow label={t("progress")} value={`${task.progress}%`} />
        {meta.type === "session" && (
          <>
            <DetailRow
              label={t("lockState")}
              value={
                <span className="flex items-center gap-1">
                  {meta.isLocked ? (
                    <>
                      <Lock className="size-3 text-text-muted" /> {t("locked")}
                    </>
                  ) : (
                    <>
                      <Unlock className="size-3 text-text-muted" /> {t("unlocked")}
                    </>
                  )}
                </span>
              }
            />
            {meta.isManuallyAdjusted && (
              <DetailRow
                label={t("schedule")}
                value={
                  <Badge
                    variant="outline"
                    className="border-amber-300 text-amber-600 bg-amber-50/50 text-[10px]"
                  >
                    ✍️ {t("manuallyAdjusted")}
                  </Badge>
                }
              />
            )}
          </>
        )}
      </div>

      {/* Notes */}
      {meta.notes && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-text-secondary">{t("notes")}</p>
          <p className="text-xs text-text-muted bg-muted/20 rounded-md p-2 leading-relaxed">
            {meta.notes}
          </p>
        </div>
      )}

      {/* Documentation Link & Status */}
      <div className="space-y-2 pt-2 border-t border-border/40">
        <p className="text-xs font-semibold text-text-secondary">{t("documentationEvidence")}</p>
        {meta.documentationUrl ? (
          <div className="border border-border/80 bg-card rounded-lg p-2.5 text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {parsedLink?.isValid ? (
                <>
                  <Badge
                    className={`text-[9px] px-1.5 py-0.5 border shrink-0 font-semibold uppercase ${
                      parsedLink.type === "spreadsheet"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : parsedLink.type === "document"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        : parsedLink.type === "presentation"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : parsedLink.type === "form"
                        ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                        : parsedLink.type === "folder"
                        ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-500"
                        : parsedLink.type === "file"
                        ? "bg-teal-500/10 text-teal-600 border-teal-500/20"
                        : "bg-zinc-500/10 text-zinc-600 border-zinc-500/20"
                    }`}
                  >
                    {parsedLink.type}
                  </Badge>
                  <span className="truncate text-text-primary font-medium select-all pr-2">
                    {parsedLink.label}
                  </span>
                </>
              ) : (
                <>
                  <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[9px] py-0.5 uppercase shrink-0">
                    {t("invalidLink")}
                  </Badge>
                  <span className="truncate text-rose-600 font-mono select-all pr-2 max-w-[200px]">
                    {meta.documentationUrl}
                  </span>
                </>
              )}
            </div>
            <a
              href={normalizeDriveUrl(meta.documentationUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 bg-primary hover:bg-primary/95 text-primary-foreground rounded p-1.5 flex items-center justify-center transition-colors shadow-sm w-7 h-7"
              title={t("launchDrive")}
            >
              <ExternalLink className="size-3" />
            </a>
          </div>
        ) : (
          <div>
            {meta.sessionStatus === "COMPLETED" ? (
              <div className="border border-rose-500/20 bg-rose-500/5 rounded-lg p-2.5 text-xs text-rose-600 flex items-start gap-2 shadow-sm font-medium">
                <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                <span>{t("missingDocWarning")}</span>
              </div>
            ) : (
              <span className="text-xs text-text-muted italic">{t("noDocYet")}</span>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("timeline");
  const config: Record<string, { className: string; label: string }> = {
    PENDING: {
      className: "bg-status-pending/15 text-status-pending-foreground border-status-pending/30",
      label: t("pending"),
    },
    IN_PROGRESS: {
      className: "bg-status-in-progress/15 text-status-in-progress-foreground border-status-in-progress/30",
      label: t("inProgress"),
    },
    COMPLETED: {
      className: "bg-status-completed/15 text-status-completed-foreground border-status-completed/30",
      label: t("complete"),
    },
    DELAYED: {
      className: "bg-status-delayed/15 text-status-delayed-foreground border-status-delayed/30",
      label: t("overdue"),
    },
    CANCELLED: {
      className: "bg-muted/30 text-text-muted border-border",
      label: t("cancelled"),
    },
  };

  const c = config[status] || { className: "bg-muted", label: status };

  return (
    <Badge variant="outline" className={`${c.className} text-[10px] font-semibold`}>
      {c.label}
    </Badge>
  );
}

function ApprovalBadge({ status }: { status: string }) {
  const t = useTranslations("timeline");
  const config: Record<string, { className: string; label: string }> = {
    PENDING_APPROVAL: {
      className: "bg-status-warning/15 text-status-warning-foreground border-status-warning/30",
      label: t("awaitingApproval"),
    },
    APPROVED: {
      className: "bg-status-approved/15 text-status-approved-foreground border-status-approved/30",
      label: t("approved"),
    },
    REJECTED: {
      className: "bg-status-rejected/15 text-status-rejected-foreground border-status-rejected/30",
      label: t("rejected"),
    },
  };

  const c = config[status] || { className: "bg-muted", label: status };

  return (
    <Badge variant="outline" className={`${c.className} text-[10px] font-semibold`}>
      {c.label}
    </Badge>
  );
}

// ─── Helpers ─────────────────────────────────────────────

function formatDate(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
