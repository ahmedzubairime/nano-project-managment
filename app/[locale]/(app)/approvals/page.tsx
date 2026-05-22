"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import {
  ClipboardCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Calendar,
  ExternalLink,
  ChevronRight,
  Loader2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { EmptyState } from "@/components/empty-state";
import { useProject } from "@/lib/project-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ReviewDialog } from "@/components/approvals/review-dialog";

interface DBUser {
  id: string;
  email: string;
  role: string;
}

interface SessionItem {
  id: string;
  scheduledDate: string;
  status: string;
  approvalStatus: string;
  documentationUrl: string | null;
  notes: string | null;
  submittedAt?: string | null;
  activity?: {
    id: string;
    title: string;
    description: string | null;
    isVolunteer?: boolean;
  };
  center?: {
    id: string;
    name: string;
    city: string;
    manager?: {
      id: string;
      email: string;
    } | null;
  };
}

interface HistoryItem {
  id: string;
  status: string;
  reviewNotes: string | null;
  reviewedAt: string;
  session?: {
    id: string;
    scheduledDate: string;
    status: string;
    documentationUrl: string | null;
    activity?: {
      title: string;
      isVolunteer?: boolean;
    };
    center?: {
      name: string;
      city: string;
    };
  };
  reviewer?: {
    id: string;
    email: string;
  };
}

export default function ApprovalsPage() {
  const { activeProject } = useProject();
  const { user } = useUser();
  const t = useTranslations("approvals");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  // State Management
  const [dbUser, setDbUser] = React.useState<DBUser | null>(null);
  const [loadingUser, setLoadingUser] = React.useState<boolean>(true);
  const [loadingData, setLoadingData] = React.useState<boolean>(false);
  const [queue, setQueue] = React.useState<SessionItem[]>([]);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [activityTypeFilter, setActivityTypeFilter] = React.useState<string>("ALL");
  const [overdueFilter, setOverdueFilter] = React.useState<boolean>(false);

  // Modal Control
  const [selectedSession, setSelectedSession] = React.useState<SessionItem | null>(null);
  const [isReviewOpen, setIsReviewOpen] = React.useState<boolean>(false);

  // 1. Fetch authenticated Database User profile
  React.useEffect(() => {
    async function fetchMe() {
      if (!user) return;
      try {
        const res = await fetch("/api/users");
        if (!res.ok) return;
        const users = await res.json();
        const me = users.find((u: any) => u.clerkUserId === user.id);
        if (me) {
          setDbUser(me);
        }
      } catch (err) {
        console.error("Error loading db user:", err);
      } finally {
        setLoadingUser(false);
      }
    }
    fetchMe();
  }, [user]);

  // 2. Fetch approvals queue and recent history
  const fetchApprovals = React.useCallback(async () => {
    if (!activeProject || !dbUser || dbUser.role !== "PROJECT_MANAGER") return;
    setLoadingData(true);
    try {
      const response = await fetch(`/api/projects/${activeProject.id}/approvals`);
      if (response.ok) {
        const data = await response.json();
        setQueue(data.queue || []);
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("Failed to load approvals queue data:", error);
    } finally {
      setLoadingData(false);
    }
  }, [activeProject, dbUser]);

  React.useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  if (!activeProject) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title={t("noProject")}
        description={t("noProjectDesc")}
      />
    );
  }

  // Auth Guard Screen
  if (loadingUser) {
    return (
      <div className="h-[450px] flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dbUser || dbUser.role !== "PROJECT_MANAGER") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={t("accessDenied")}
        description={t("accessDeniedDesc")}
      />
    );
  }

  // 3. Client Side Filtering Rules
  const filteredQueue = queue.filter((session) => {
    const activityTitle = session.activity?.title?.toLowerCase() || "";
    const centerName = session.center?.name?.toLowerCase() || "";
    const matchesSearch =
      activityTitle.includes(searchTerm.toLowerCase()) ||
      centerName.includes(searchTerm.toLowerCase());

    const isVol = session.activity?.isVolunteer || false;
    const matchesActivityType =
      activityTypeFilter === "ALL" ||
      (activityTypeFilter === "CORE" && !isVol) ||
      (activityTypeFilter === "VOLUNTEER" && isVol);

    const isOverdue = new Date(session.scheduledDate) < new Date();
    const matchesOverdue = !overdueFilter || isOverdue;

    return matchesSearch && matchesActivityType && matchesOverdue;
  });

  // Calculate Metrics from history
  const approvedHistoryCount = history.filter((h) => h.status === "APPROVED").length;
  const rejectedHistoryCount = history.filter((h) => h.status === "REJECTED").length;

  const isProjectArchived = activeProject.status === "ARCHIVED";

  function handleOpenReview(session: SessionItem) {
    setSelectedSession(session);
    setIsReviewOpen(true);
  }

  return (
    <div className="layout-section space-y-6">
      {/* ═══ Page Header ═══ */}
      <div className="layout-page-header flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <ClipboardCheck className="size-5 text-primary" />
            <span>{t("title")}</span>
          </h1>
          <p className="text-sm text-text-muted">
            {t("subtitle")} <strong className="text-text-primary font-medium">{activeProject.name}</strong>.
          </p>
        </div>
        {isProjectArchived && (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 py-1 font-semibold uppercase text-[10px]">
            {tCommon("archivedReadOnly")}
          </Badge>
        )}
      </div>

      {/* ═══ Performance metrics ribbon ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Pending */}
        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <Clock className="size-5 text-amber-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">{t("awaitingReview")}</span>
            <span className="text-2xl font-bold text-text-primary">{queue.length}</span>
          </div>
        </div>

        {/* Metric 2: Approved */}
        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">{t("approvedTotal")}</span>
            <span className="text-2xl font-bold text-text-primary">{approvedHistoryCount}</span>
          </div>
        </div>

        {/* Metric 3: Rejected */}
        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="size-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
            <XCircle className="size-5 text-rose-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">{t("revisionsRequested")}</span>
            <span className="text-2xl font-bold text-text-primary">{rejectedHistoryCount}</span>
          </div>
        </div>
      </div>

      {/* ═══ Main Double-Column Layout ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Active review queue (70% width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border/40">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                {t("pendingQueue")} ({filteredQueue.length})
              </h2>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 size-4 text-text-muted" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              {/* Activity Type Dropdown */}
              <div className="relative">
                <select
                  value={activityTypeFilter}
                  onChange={(e) => setActivityTypeFilter(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-zinc-950 dark:text-zinc-50"
                >
                  <option value="ALL">{t("allTypes")}</option>
                  <option value="CORE">{t("coreSessions")}</option>
                  <option value="VOLUNTEER">{t("volunteerSessions")}</option>
                </select>
              </div>

              {/* Overdue/Delayed Toggle button */}
              <Button
                variant={overdueFilter ? "default" : "outline"}
                size="sm"
                onClick={() => setOverdueFilter(!overdueFilter)}
                className="text-xs flex items-center gap-1.5 h-9"
              >
                <AlertCircle className="size-3.5" />
                <span>{t("overdueOnly")}</span>
              </Button>
            </div>

            {/* Queue Table */}
            {loadingData ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-xs text-text-muted">{t("fetchingQueue")}</span>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <ClipboardCheck className="size-12 text-text-muted/40 mb-3" />
                <span className="text-sm font-semibold text-text-secondary">{t("noQueue")}</span>
                <p className="text-xs text-text-muted max-w-[340px] mt-1 leading-normal">
                  {t("noQueueDesc")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/80 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                      <th className="p-3">{t("activity")}</th>
                      <th className="p-3">{t("center")}</th>
                      <th className="p-3">{t("scheduledDate")}</th>
                      <th className="p-3">{t("submittedDate")}</th>
                      <th className="p-3">{t("evidence")}</th>
                      <th className="p-3 text-right">{tCommon("actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQueue.map((session) => {
                      const isOverdue = new Date(session.scheduledDate) < new Date();
                      const isVol = session.activity?.isVolunteer || false;
                      return (
                        <tr
                          key={session.id}
                          className="border-b border-border/40 hover:bg-muted/10 transition-colors"
                        >
                          {/* Activity info */}
                          <td className="p-3">
                            <span className="font-semibold text-text-primary block truncate max-w-[150px]">
                              {session.activity?.title}
                            </span>
                            <Badge
                              className={`text-[9px] px-1.5 py-0.2 mt-0.5 border ${
                                isVol
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : "bg-primary/10 text-primary border-primary/20"
                              }`}
                            >
                              {isVol ? t("volunteer") : t("core")}
                            </Badge>
                          </td>

                          {/* Center info */}
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Building2 className="size-3 text-text-muted shrink-0" />
                              <span className="font-medium text-text-secondary truncate max-w-[120px]">
                                {session.center?.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-text-muted block pl-4">
                              {session.center?.city}
                            </span>
                          </td>

                          {/* Scheduled Date */}
                          <td className="p-3">
                            <span className={isOverdue ? "text-rose-600 font-medium" : "text-text-secondary"}>
                              {new Date(session.scheduledDate).toLocaleDateString(locale)}
                            </span>
                            {isOverdue && (
                              <span className="text-[9px] text-rose-500 block font-medium">{t("overdue")}</span>
                            )}
                          </td>

                          {/* Submission Date */}
                          <td className="p-3 text-text-secondary">
                            {session.submittedAt
                              ? new Date(session.submittedAt).toLocaleDateString(locale)
                              : "N/A"}
                          </td>

                          {/* Evidence Documentation Badge */}
                          <td className="p-3">
                            {session.documentationUrl ? (
                              <a
                                href={session.documentationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 rounded px-1.5 py-0.5 font-medium transition-colors"
                              >
                                <span>{t("drive")}</span>
                                <ExternalLink className="size-2.5 shrink-0" />
                              </a>
                            ) : (
                              <span className="text-text-muted italic">{t("missing")}</span>
                            )}
                          </td>

                          {/* Review Button trigger */}
                          <td className="p-3 text-right">
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/95 text-white font-semibold text-[11px] px-3.5 py-1 flex items-center gap-1 ml-auto"
                              onClick={() => handleOpenReview(session)}
                            >
                              <span>{t("review")}</span>
                              <ChevronRight className="size-3" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Decisions History Log (30% width) */}
        <div className="space-y-4">
          <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-3 border-b border-border/40">
              {t("recentHistory")}
            </h2>

            {loadingData ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="size-5 animate-spin text-text-muted" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-text-muted">
                <span className="text-xs">{t("noHistoryLogs")}</span>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                {history.map((record) => {
                  const isApproved = record.status === "APPROVED";
                  const activityTitle = record.session?.activity?.title || "Session";
                  const centerName = record.session?.center?.name || "Center";
                  return (
                    <div
                      key={record.id}
                      className="border border-border/50 bg-muted/10 rounded-xl p-3 text-xs space-y-2 relative"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          {isApproved ? (
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="size-4 text-rose-600 shrink-0" />
                          )}
                          <span className={`font-bold ${isApproved ? "text-emerald-700" : "text-rose-700"}`}>
                            {isApproved ? t("approved") : t("revisionRequested")}
                          </span>
                        </div>
                        <span className="text-[10px] text-text-muted">
                          {new Date(record.reviewedAt).toLocaleDateString(locale)}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="font-semibold text-text-primary block truncate" title={activityTitle}>
                          {activityTitle}
                        </span>
                        <span className="text-[10px] text-text-secondary block truncate" title={centerName}>
                          {t("branchLabel")}: {centerName}
                        </span>
                      </div>

                      {record.reviewNotes && (
                        <div className="bg-background/80 border-l-[3px] border-border rounded p-2 text-[11px] leading-relaxed text-text-secondary italic">
                          "{record.reviewNotes}"
                        </div>
                      )}

                      <div className="pt-1.5 border-t border-border/20 flex justify-between items-center text-[10px] text-text-muted">
                        <span>{t("byLabel")}: {record.reviewer?.email.split("@")[0]}</span>
                        {record.session?.documentationUrl && (
                          <a
                              href={record.session.documentationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-0.5"
                          >
                            {t("docs")} <ExternalLink className="size-2" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Modal review dialog ═══ */}
      <ReviewDialog
        session={selectedSession}
        isOpen={isReviewOpen}
        onOpenChange={setIsReviewOpen}
        onSuccess={fetchApprovals}
        isProjectArchived={isProjectArchived}
      />
    </div>
  );
}
