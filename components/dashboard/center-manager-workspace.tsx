"use client";

import * as React from "react";
import {
  Building2,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Search,
  SlidersHorizontal,
  Info,
  BadgeAlert,
  Layers,
  Sparkles,
  ClipboardList,
  RefreshCw,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import type {
  CenterDashboardData,
  CenterSessionData,
  CenterActionItem,
} from "@/services/center-dashboard/center-dashboard.service";
import { SessionExecutionDialog } from "@/components/sessions/session-execution-dialog";
import { useTranslations, useLocale } from "next-intl";

interface CenterManagerWorkspaceProps {
  userId: string;
}

export function CenterManagerWorkspace({ userId }: CenterManagerWorkspaceProps) {
  const [data, setData] = React.useState<CenterDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Filter and search states
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [approvalFilter, setApprovalFilter] = React.useState("ALL");
  const [dateFilter, setDateFilter] = React.useState("ALL");

  // Execution modal states
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null);
  const [isExecuteOpen, setIsExecuteOpen] = React.useState<boolean>(false);

  // Translations
  const t = useTranslations("centerWorkspace");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const selectedSession = React.useMemo(() => {
    if (!data || !selectedSessionId) return null;
    const s = data.sessions.find((x) => x.id === selectedSessionId);
    if (!s) return null;
    return {
      id: s.id,
      activityTitle: s.activityTitle,
      centerName: s.centerName,
      status: s.status,
      approvalStatus: s.approvalStatus,
      documentationUrl: s.documentationUrl,
      notes: s.notes,
      isLocked: s.isLocked,
      isProjectArchived: s.projectStatus === "ARCHIVED",
      scheduledDate: s.scheduledDate,
      center: {
        id: s.centerId,
        name: s.centerName,
        city: s.city,
        managerId: userId,
      },
    };
  }, [data, selectedSessionId, userId]);

  const handleOpenExecute = (id: string) => {
    setSelectedSessionId(id);
    setIsExecuteOpen(true);
  };

  const fetchDashboardData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/center/dashboard");
      if (!res.ok) throw new Error(t("errorLoading"));
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      toast.error(err.message || t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Client-side filtering logic for assigned sessions table
  const filteredSessions = React.useMemo(() => {
    if (!data) return [];
    const now = new Date();

    return data.sessions.filter((session) => {
      // 1. Search Query
      const matchesSearch = session.activityTitle
        .toLowerCase()
        .includes(search.toLowerCase());

      // 2. Status Filter
      const matchesStatus =
        statusFilter === "ALL" || session.status === statusFilter;

      // 3. Approval Filter
      const matchesApproval =
        approvalFilter === "ALL" || session.approvalStatus === approvalFilter;

      // 4. Date Filter
      let matchesDate = true;
      const sDate = new Date(session.scheduledDate);
      if (dateFilter === "TODAY") {
        matchesDate = sDate.toDateString() === now.toDateString();
      } else if (dateFilter === "WEEK") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        matchesDate = sDate >= startOfWeek && sDate <= endOfWeek;
      } else if (dateFilter === "OVERDUE") {
        matchesDate = session.isDelayed;
      }

      return matchesSearch && matchesStatus && matchesApproval && matchesDate;
    });
  }, [data, search, statusFilter, approvalFilter, dateFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-sm text-text-muted">{t("loadingWorkspace")}</p>
      </div>
    );
  }

  if (!data || data.overview.centers.length === 0) {
    return (
      <div className="layout-section max-w-lg mx-auto py-12">
        <EmptyState
          icon={Building2}
          title={t("noCentersTitle")}
          description={t("noCentersDesc")}
        />
      </div>
    );
  }

  const { overview, actionQueue, progressSummary } = data;

  return (
    <div className="space-y-6">
      {/* ═══ Workspace Header ═══ */}
      <div className="layout-page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {t("title")}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {t("operationalDashboardFor")}{" "}
            <strong>
              {overview.centers.map((c) => `${c.name} (${c.city})`).join(", ")}
            </strong>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          {tCommon("refresh")}
        </Button>
      </div>

      {/* ═══ Center Overview Cards ═══ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewCard
          icon={<Layers className="size-4.5 text-brand-primary" />}
          label={t("assignedProjects")}
          value={overview.assignedProjects.length}
          subtext={
            overview.assignedProjects.length > 0
              ? overview.assignedProjects.map((p) => p.name).join(", ")
              : t("noActiveProjects")
          }
        />
        <OverviewCard
          icon={<TrendingUp className="size-4.5 text-emerald-500" />}
          label={t("completionProgress")}
          value={`${overview.completionPercentage}%`}
          subtext={t("sessionsOf", { completed: overview.completedSessions, total: overview.totalSessions })}
        />
        <OverviewCard
          icon={<AlertTriangle className={`size-4.5 ${overview.delayedSessions > 0 ? "text-rose-500 animate-pulse" : "text-text-muted"}`} />}
          label={t("overdueMissed")}
          value={overview.delayedSessions}
          subtext={overview.delayedSessions > 0 ? t("needsImmediateCompletion") : t("allOnTrack")}
        />
        <OverviewCard
          icon={<FileCheck className="size-4.5 text-amber-500" />}
          label={t("pendingApprovals")}
          value={overview.pendingApprovals}
          subtext={t("awaitingPmReview")}
        />
      </div>

      {/* ═══ Progress & Action Queue Grid ═══ */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Progress & Volunteer contribution summary */}
        <div className="space-y-4 lg:col-span-1">
          <div className="p-5 bg-card border border-border/80 rounded-xl shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-text-primary pb-2 border-b border-border/40 flex items-center gap-1.5">
              <TrendingUp className="size-4 text-primary" />
              {t("progressSummary")}
            </h3>

            {/* Overall center completion rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">{t("centerCompletionRate")}</span>
                <span className="font-semibold text-text-primary">
                  {progressSummary.centerCompletionRate}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressSummary.centerCompletionRate}%` }}
                />
              </div>
            </div>

            {/* Volunteer initiative progress */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted font-medium flex items-center gap-1">
                  <Sparkles className="size-3.5 text-purple-500" />
                  {t("volunteerContributions")}
                </span>
                <Badge variant="outline" className="border-purple-200 text-purple-600 bg-purple-50/50 text-[10px] py-0">
                  {t("volunteers")}
                </Badge>
              </div>
              {progressSummary.volunteerSessionsCount === 0 ? (
                <p className="text-xs text-text-muted italic">
                  {t("noVolunteerActivities")}
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">{t("volunteerCompletion")}</span>
                    <span className="font-semibold text-text-primary">
                      {t("volunteerOf", { completed: progressSummary.volunteerCompletedCount, total: progressSummary.volunteerSessionsCount, percentage: progressSummary.volunteerCompletionPercentage })}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressSummary.volunteerCompletionPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Info notice */}
            <div className="flex gap-2 p-3 bg-muted/30 border border-border/40 rounded-lg text-xs leading-normal text-text-muted">
              <Info className="size-4 shrink-0 text-text-secondary mt-0.5" />
              <span>
                {t("infoNotice")}
              </span>
            </div>
          </div>
        </div>

        {/* Action Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 bg-card border border-border/80 rounded-xl shadow-xs space-y-4 h-full flex flex-col">
            <h3 className="text-sm font-semibold text-text-primary pb-2 border-b border-border/40 flex items-center gap-1.5">
              <ClipboardList className="size-4 text-primary" />
              {t("actionQueue")}
            </h3>

            {actionQueue.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <FileCheck className="size-8 text-emerald-500 mb-2" />
                <p className="text-sm font-medium text-text-primary">{t("actionQueueEmpty")}</p>
                <p className="text-xs text-text-muted">
                  {t("actionQueueEmptyDesc")}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 flex-1">
                {actionQueue.map((item) => (
                  <ActionQueueCard
                    key={item.id}
                    item={item}
                    onClick={() => handleOpenExecute(item.id)}
                    t={t}
                    locale={locale}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Assigned Sessions Table ═══ */}
      <div className="p-5 bg-card border border-border/80 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-border/40 gap-3">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
            <Calendar className="size-4 text-primary" />
            {t("assignedSessions")}
          </h3>
          <span className="text-xs text-text-muted">
            {t("displayingSessions", { filtered: filteredSessions.length, total: data.sessions.length })}
          </span>
        </div>

        {/* Filters and search toolbar */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 items-center">
          {/* Search activity */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-2.5 top-2.5 size-4 text-text-muted" />
            <Input
              placeholder={t("searchByActivity")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Session Status filter */}
          <div>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder={t("sessionStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
                <SelectItem value="PENDING">{t("pending")}</SelectItem>
                <SelectItem value="IN_PROGRESS">{t("inProgress")}</SelectItem>
                <SelectItem value="COMPLETED">{t("completed")}</SelectItem>
                <SelectItem value="DELAYED">{t("delayed")}</SelectItem>
                <SelectItem value="CANCELLED">{t("cancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Approval State filter */}
          <div>
            <Select value={approvalFilter} onValueChange={(val) => setApprovalFilter(val || "ALL")}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder={t("approvalStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allApprovals")}</SelectItem>
                <SelectItem value="NOT_SUBMITTED">{t("notSubmitted")}</SelectItem>
                <SelectItem value="PENDING_APPROVAL">{t("pendingApproval")}</SelectItem>
                <SelectItem value="APPROVED">{t("approved")}</SelectItem>
                <SelectItem value="REJECTED">{t("rejected")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date range filter */}
          <div>
            <Select value={dateFilter} onValueChange={(val) => setDateFilter(val || "ALL")}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder={t("dateTarget")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allDates")}</SelectItem>
                <SelectItem value="TODAY">{t("scheduledToday")}</SelectItem>
                <SelectItem value="WEEK">{t("thisWeek")}</SelectItem>
                <SelectItem value="OVERDUE">{t("overdueDelayed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sessions Datatable */}
        {filteredSessions.length === 0 ? (
          <div className="py-12 border border-dashed border-border rounded-xl">
            <EmptyState
              icon={Calendar}
              title={t("noSessionsMatch")}
              description={t("noSessionsMatchDesc")}
            />
          </div>
        ) : (
          <div className="overflow-x-auto border border-border/60 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40 font-semibold text-text-muted border-b border-border/60">
                  <th className="py-2.5 px-4 font-semibold">{t("activityColumn")}</th>
                  <th className="py-2.5 px-4 font-semibold">{t("projectColumn")}</th>
                  <th className="py-2.5 px-4 font-semibold">{t("centerBranch")}</th>
                  <th className="py-2.5 px-4 font-semibold">{t("scheduledDate")}</th>
                  <th className="py-2.5 px-4 font-semibold text-center">{t("statusColumn")}</th>
                  <th className="py-2.5 px-4 font-semibold text-center">{t("approvalState")}</th>
                  <th className="py-2.5 px-4 font-semibold text-right pr-6">{t("actionsColumn")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-4 font-semibold text-text-primary">
                      {session.activityTitle}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {session.projectName}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {session.centerName}
                    </td>
                    <td className="py-3 px-4 text-text-secondary font-medium">
                      {new Date(session.scheduledDate).toLocaleDateString(locale)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={session.status} isDelayed={session.isDelayed} t={t} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ApprovalBadge status={session.approvalStatus} t={t} />
                    </td>
                    <td className="py-3 px-4 text-right pr-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenExecute(session.id)}
                        className="text-xs h-7 text-primary hover:text-primary-hover font-semibold px-2.5"
                      >
                        {t("execute")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session Execution Dialog Modal */}
      <SessionExecutionDialog
        session={selectedSession}
        isOpen={isExecuteOpen}
        onOpenChange={setIsExecuteOpen}
        onSuccess={fetchDashboardData}
        currentUserId={userId}
        currentUserRole="CENTER_MANAGER"
        isProjectArchived={selectedSession?.isProjectArchived}
      />
    </div>
  );
}

// ─── Component Helpers ────────────────────────────────────

function OverviewCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subtext: string;
}) {
  return (
    <div className="p-5 bg-card border border-border/80 rounded-xl shadow-xs flex flex-col justify-between min-h-36">
      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          {label}
        </span>
        {icon}
      </div>
      <div className="mt-2">
        <span className="text-2xl font-bold text-text-primary">{value}</span>
      </div>
      <p className="text-xs text-text-muted mt-2 truncate w-full" title={subtext}>
        {subtext}
      </p>
    </div>
  );
}

function ActionQueueCard({
  item,
  onClick,
  t,
  locale,
}: {
  item: CenterActionItem;
  onClick?: () => void;
  t: ReturnType<typeof useTranslations>;
  locale: string;
}) {
  const config = {
    EXECUTION: {
      border: "border-status-pending/30 bg-status-pending/5",
      icon: <BadgeAlert className="size-4.5 text-status-pending shrink-0" />,
      label: t("requiresExecution"),
      sub: t("requiresExecutionDesc"),
    },
    DOCUMENTATION: {
      border: "border-status-warning/30 bg-status-warning/5",
      icon: <Info className="size-4.5 text-status-warning shrink-0" />,
      label: t("awaitingDocumentation"),
      sub: t("awaitingDocumentationDesc"),
    },
    REVISION: {
      border: "border-status-rejected/30 bg-status-rejected/5",
      icon: <AlertCircle className="size-4.5 text-status-rejected shrink-0" />,
      label: t("revisionNeeded"),
      sub: item.reason ? t("revisionFeedback", { reason: item.reason }) : t("revisionDefaultDesc"),
    },
  };

  const c = config[item.type];

  return (
    <div
      onClick={onClick}
      className={`p-3.5 border rounded-lg flex gap-3 ${c.border} leading-snug cursor-pointer transition-all hover:border-primary/40 hover:shadow-xs active:scale-[0.99]`}
    >
      {c.icon}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-xs text-text-primary truncate">
            {item.activityTitle}
          </span>
          <span className="text-[10px] font-semibold text-text-muted shrink-0 bg-background/50 border px-1.5 py-0.5 rounded">
            {new Date(item.scheduledDate).toLocaleDateString(locale)}
          </span>
        </div>
        <p className="text-[11px] font-medium text-text-secondary">{c.label}</p>
        <p className="text-[10px] text-text-muted leading-relaxed line-clamp-2">
          {c.sub}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status, isDelayed, t }: { status: string; isDelayed: boolean; t: ReturnType<typeof useTranslations> }) {
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
      label: t("completed"),
    },
    DELAYED: {
      className: "bg-status-delayed/15 text-status-delayed-foreground border-status-delayed/30",
      label: t("delayed"),
    },
    CANCELLED: {
      className: "bg-muted text-text-muted border-border",
      label: t("cancelled"),
    },
  };

  const effectiveStatus = isDelayed ? "DELAYED" : status;
  const c = config[effectiveStatus] || { className: "bg-muted", label: status };

  return (
    <Badge variant="outline" className={`${c.className} text-[10px] font-semibold`}>
      {c.label}
    </Badge>
  );
}

function ApprovalBadge({ status, t }: { status: string; t: ReturnType<typeof useTranslations> }) {
  const config: Record<string, { className: string; label: string }> = {
    NOT_SUBMITTED: {
      className: "bg-muted text-text-muted border-border",
      label: t("notSubmitted"),
    },
    PENDING_APPROVAL: {
      className: "bg-status-warning/15 text-status-warning-foreground border-status-warning/30",
      label: t("pendingReview"),
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
