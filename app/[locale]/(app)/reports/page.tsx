"use client";

import * as React from "react";
import {
  BarChart3,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  Building2,
  Calendar,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/empty-state";
import { useProject } from "@/lib/project-context";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ReportOverviewTab } from "@/components/reports/report-overview-tab";
import { ReportCentersTab } from "@/components/reports/report-centers-tab";
import { ReportTimelineTab } from "@/components/reports/report-timeline-tab";
import { ReportVolunteerTab } from "@/components/reports/report-volunteer-tab";

type ActiveTab = "overview" | "centers" | "timeline" | "volunteer";

export default function ReportsPage() {
  const { activeProject } = useProject();
  const { user } = useUser();
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");

  const role = (user?.publicMetadata?.role as string) || "VIEWER";
  const canAccessReports = role === "PROJECT_MANAGER" || role === "VIEWER";

  // Tab state
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("overview");

  // Filter state
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [centerId, setCenterId] = React.useState("");
  const [volunteerOnly, setVolunteerOnly] = React.useState(false);

  // Data state
  const [overviewData, setOverviewData] = React.useState<any>(null);
  const [centersData, setCentersData] = React.useState<any>(null);
  const [timelineData, setTimelineData] = React.useState<any>(null);
  const [volunteerData, setVolunteerData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  // Available centers for filter dropdown
  const [centers, setCenters] = React.useState<{ id: string; name: string }[]>([]);

  // Build query string from filters
  const buildQueryString = React.useCallback(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (centerId) params.set("centerId", centerId);
    if (volunteerOnly) params.set("volunteerOnly", "true");
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [dateFrom, dateTo, centerId, volunteerOnly]);

  // Fetch report data for the active tab
  const fetchReport = React.useCallback(async () => {
    if (!activeProject) return;
    setLoading(true);
    const qs = buildQueryString();
    const base = `/api/projects/${activeProject.id}/reports`;

    try {
      const [ov, ct, tl, vl] = await Promise.all([
        fetch(`${base}/overview${qs}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${base}/centers${qs}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${base}/timeline${qs}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${base}/volunteer${qs}`).then((r) => (r.ok ? r.json() : null)),
      ]);
      setOverviewData(ov);
      setCentersData(ct);
      setTimelineData(tl);
      setVolunteerData(vl);
    } catch (err: any) {
      toast.error(err.message || t("noReportData"));
    } finally {
      setLoading(false);
    }
  }, [activeProject, buildQueryString, t]);

  // Fetch centers list for filter
  React.useEffect(() => {
    if (!activeProject) return;
    fetch(`/api/projects/${activeProject.id}/centers`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const mapped = (data || []).map((pc: any) => ({
          id: pc.center?.id || pc.centerId,
          name: pc.center?.name || "Center",
        }));
        setCenters(mapped);
      })
      .catch(() => {});
  }, [activeProject]);

  // Initial load
  React.useEffect(() => {
    if (activeProject && canAccessReports) {
      fetchReport();
    }
  }, [activeProject, canAccessReports, fetchReport]);

  if (!activeProject) {
    return (
      <EmptyState
        icon={BarChart3}
        title={t("noProject")}
        description={t("noProjectDesc")}
      />
    );
  }

  if (!canAccessReports) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={t("accessDenied")}
        description={t("accessDeniedDesc")}
      />
    );
  }

  const isProjectArchived = activeProject.status === "ARCHIVED";

  return (
    <div className="layout-section space-y-6">
      {/* Page Header */}
      <div className="layout-page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" />
            {t("title")}
          </h1>
          <p className="text-sm text-text-muted">
            {t("subtitle")}{" "}
            <strong className="text-text-primary font-medium">{activeProject.name}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isProjectArchived && (
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 py-1 font-semibold uppercase text-[10px]">
              {tCommon("archivedReadOnly")}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            {tCommon("refresh")}
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="size-4 text-text-muted" />
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{t("reportFilters")}</span>
        </div>
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="grid gap-1.5 flex-1 min-w-0">
            <label className="text-[10px] font-semibold text-text-muted uppercase">{t("from")}</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs h-9"
            />
          </div>
          <div className="grid gap-1.5 flex-1 min-w-0">
            <label className="text-[10px] font-semibold text-text-muted uppercase">{t("to")}</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs h-9"
            />
          </div>
          <div className="grid gap-1.5 flex-1 min-w-0">
            <label className="text-[10px] font-semibold text-text-muted uppercase">{t("centerFilter")}</label>
            <select
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="">{t("allCenters")}</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Button
            variant={volunteerOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setVolunteerOnly(!volunteerOnly)}
            className="text-xs flex items-center gap-1.5 h-9 shrink-0"
          >
            <Sparkles className="size-3.5" />
            {t("volunteerOnly")}
          </Button>
          <Button
            size="sm"
            onClick={fetchReport}
            disabled={loading}
            className="text-xs h-9 shrink-0"
          >
            {t("applyFilters")}
          </Button>
        </div>
      </div>

      {/* Tabbed Report Views */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <Loader2 className="size-8 text-primary animate-spin" />
          <p className="text-sm text-text-muted">{t("compilingData")}</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="overview" className="text-xs gap-1.5">
              <BarChart3 className="size-3.5" />
              {t("overview")}
            </TabsTrigger>
            <TabsTrigger value="centers" className="text-xs gap-1.5">
              <Building2 className="size-3.5" />
              {t("centersReport")}
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs gap-1.5">
              <Calendar className="size-3.5" />
              {t("timelineReport")}
            </TabsTrigger>
            <TabsTrigger value="volunteer" className="text-xs gap-1.5">
              <Sparkles className="size-3.5" />
              {t("volunteerReport")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {overviewData ? (
              <ReportOverviewTab data={overviewData} />
            ) : (
              <p className="text-xs text-text-muted italic py-8 text-center">{t("noOverviewData")}</p>
            )}
          </TabsContent>

          <TabsContent value="centers" className="mt-6">
            {centersData ? (
              <ReportCentersTab data={centersData} />
            ) : (
              <p className="text-xs text-text-muted italic py-8 text-center">{t("noCentersData")}</p>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            {timelineData ? (
              <ReportTimelineTab data={timelineData} />
            ) : (
              <p className="text-xs text-text-muted italic py-8 text-center">{t("noTimelineData")}</p>
            )}
          </TabsContent>

          <TabsContent value="volunteer" className="mt-6">
            {volunteerData ? (
              <ReportVolunteerTab data={volunteerData} />
            ) : (
              <p className="text-xs text-text-muted italic py-8 text-center">{t("noVolunteerData")}</p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

