"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { useProject } from "@/lib/project-context";
import {
  Activity,
  Plus,
  Search,
  Calendar,
  Building2,
  Trash2,
  Edit2,
  CheckCircle,
  HelpCircle,
  Loader2,
  Eye,
  EyeOff,
  User,
  Info,
  MapPin,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { Link } from "@/i18n/routing";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useTranslations, useLocale } from "next-intl";

interface DBUser {
  id: string;
  email: string;
  role: string;
}

interface Center {
  id: string;
  name: string;
  city: string;
  manager?: DBUser | null;
}

interface ProjectCenter {
  id: string;
  centerId: string;
  center: Center;
}

interface ActivityCenterRelation {
  id: string;
  centerId: string;
  center: Center;
}

interface ActivityItem {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  plannedSessionCount: number;
  isVolunteer: boolean;
  startDate: string | null;
  endDate: string | null;
  archivedAt: string | null;
  createdAt: string;
  activityCenters: ActivityCenterRelation[];
  _count?: {
    sessions: number;
  };
}

export default function ActivitiesPage() {
  const { user } = useUser();
  const { activeProject } = useProject();

  const t = useTranslations("activities");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  // Access check
  const role = (user?.publicMetadata?.role as string) || "VIEWER";
  const isProjectManager = role === "PROJECT_MANAGER";
  const isProjectArchived = activeProject?.status === "ARCHIVED";
  const canModify = isProjectManager && !isProjectArchived;

  // States
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [projectCenters, setProjectCenters] = React.useState<ProjectCenter[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingCenters, setLoadingCenters] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | "core" | "volunteer">("all");
  const [showArchived, setShowArchived] = React.useState(false);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = React.useState(false);
  const [selectedActivity, setSelectedActivity] = React.useState<ActivityItem | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = React.useState("");
  const [formDesc, setFormDesc] = React.useState("");
  const [formSessionCount, setFormSessionCount] = React.useState(1);
  const [formIsVolunteer, setFormIsVolunteer] = React.useState(false);
  const [formStartDate, setFormStartDate] = React.useState("");
  const [formEndDate, setFormEndDate] = React.useState("");
  const [selectedCenterIds, setSelectedCenterIds] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  // Fetch project activities
  const fetchActivities = React.useCallback(async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${activeProject.id}/activities`);
      if (!res.ok) throw new Error(t("loadError"));
      const data = await res.json();
      setActivities(data);
    } catch (err: any) {
      toast.error(err.message || t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [activeProject, t]);

  // Fetch project centers
  const fetchProjectCenters = React.useCallback(async () => {
    if (!activeProject) return;
    setLoadingCenters(true);
    try {
      const res = await fetch(`/api/projects/${activeProject.id}/centers`);
      if (!res.ok) throw new Error(t("loadCentersError"));
      const data = await res.json();
      setProjectCenters(data);
    } catch (err: any) {
      console.error("Error loading project centers:", err);
    } finally {
      setLoadingCenters(false);
    }
  }, [activeProject, t]);

  // Initial load
  React.useEffect(() => {
    if (activeProject) {
      fetchActivities();
      fetchProjectCenters();
    }
  }, [activeProject, fetchActivities, fetchProjectCenters]);

  // Handle open create modal
  function handleOpenCreate() {
    setFormTitle("");
    setFormDesc("");
    setFormSessionCount(1);
    setFormIsVolunteer(false);
    setFormStartDate("");
    setFormEndDate("");
    // Select all project centers by default
    setSelectedCenterIds(projectCenters.map((pc) => pc.centerId));
    setIsCreateOpen(true);
  }

  // Handle open edit modal
  function handleOpenEdit(activity: ActivityItem) {
    setSelectedActivity(activity);
    setFormTitle(activity.title);
    setFormDesc(activity.description || "");
    setFormSessionCount(activity.plannedSessionCount);
    setFormIsVolunteer(activity.isVolunteer);
    setFormStartDate(activity.startDate ? activity.startDate.split("T")[0] : "");
    setFormEndDate(activity.endDate ? activity.endDate.split("T")[0] : "");
    setSelectedCenterIds(activity.activityCenters.map((ac) => ac.centerId));
    setIsEditOpen(true);
  }

  // Handle Create Activity submit
  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProject || !canModify) return;

    if (!formTitle.trim()) {
      toast.error(t("titleRequired"));
      return;
    }

    if (formSessionCount <= 0) {
      toast.error(t("sessionCountError"));
      return;
    }

    if (selectedCenterIds.length === 0) {
      toast.error(t("centersRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${activeProject.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDesc.trim() || undefined,
          plannedSessionCount: formSessionCount,
          isVolunteer: formIsVolunteer,
          startDate: formStartDate || undefined,
          endDate: formEndDate || undefined,
          centerIds: selectedCenterIds,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || t("createError"));
      }

      toast.success(t("planSuccess"));
      setIsCreateOpen(false);
      fetchActivities();
    } catch (err: any) {
      toast.error(err.message || t("createError"));
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Edit Activity submit
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProject || !selectedActivity || !canModify) return;

    if (!formTitle.trim()) {
      toast.error(t("titleRequired"));
      return;
    }

    if (formSessionCount <= 0) {
      toast.error(t("sessionCountError"));
      return;
    }

    if (selectedCenterIds.length === 0) {
      toast.error(t("centersRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/projects/${activeProject.id}/activities/${selectedActivity.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDesc.trim() || null,
            plannedSessionCount: formSessionCount,
            isVolunteer: formIsVolunteer,
            startDate: formStartDate || null,
            endDate: formEndDate || null,
            centerIds: selectedCenterIds,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || t("updateError"));
      }

      toast.success(t("updateSuccess"));
      setIsEditOpen(false);
      fetchActivities();
    } catch (err: any) {
      toast.error(err.message || t("updateError"));
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Delete/Archive Activity submit
  async function handleDeleteSubmit() {
    if (!activeProject || !selectedActivity || !canModify) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/projects/${activeProject.id}/activities/${selectedActivity.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || t("archiveError"));
      }

      toast.success(t("archiveSuccess"));
      setIsDeleteOpen(false);
      setSelectedActivity(null);
      fetchActivities();
    } catch (err: any) {
      toast.error(err.message || t("archiveError"));
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Generate Sessions
  async function handleGenerateSubmit() {
    if (!activeProject || !selectedActivity || !canModify) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/projects/${activeProject.id}/activities/${selectedActivity.id}/generate-sessions`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || t("generateError"));
      }

      const resData = await response.json();
      toast.success(resData.message || t("generateSuccess"));
      setIsGenerateOpen(false);
      setSelectedActivity(null);
      fetchActivities();
    } catch (err: any) {
      toast.error(err.message || t("generateError"));
    } finally {
      setSubmitting(false);
    }
  }

  // Multi-select helpers
  function toggleCenterSelection(centerId: string) {
    setSelectedCenterIds((prev) =>
      prev.includes(centerId) ? prev.filter((id) => id !== centerId) : [...prev, centerId]
    );
  }

  // Pre-calculate distribution info for preview inside generator confirmation dialog
  const distributionInfo = React.useMemo(() => {
    if (!selectedActivity) return null;

    const plannedCount = selectedActivity.plannedSessionCount;
    const centers = selectedActivity.activityCenters || [];
    
    if (plannedCount <= 0 || centers.length === 0) return null;

    // Sort centers deterministically
    const sortedCenters = [...centers].sort((a, b) => 
      a.center.id.localeCompare(b.center.id)
    );

    const counts: Record<string, number> = {};
    sortedCenters.forEach((c) => {
      counts[c.center.name] = 0;
    });

    for (let i = 0; i < plannedCount; i++) {
      const center = sortedCenters[i % sortedCenters.length];
      counts[center.center.name] = (counts[center.center.name] || 0) + 1;
    }

    const uniqueCounts = new Set(Object.values(counts));
    const isImperfect = uniqueCounts.size > 1;

    // Dates boundary preview
    const startStr = selectedActivity.startDate || activeProject?.startDate;
    const endStr = selectedActivity.endDate || activeProject?.endDate;
    
    const formattedRange = startStr && endStr 
      ? `${new Date(startStr).toLocaleDateString(locale)} ${tCommon("to")} ${new Date(endStr).toLocaleDateString(locale)}`
      : t("noConstraint");

    return {
      counts,
      isImperfect,
      formattedRange,
      plannedCount,
      centersCount: centers.length,
    };
  }, [selectedActivity, activeProject, locale, t, tCommon]);

  // Filters computed
  const filteredActivities = React.useMemo(() => {
    return activities.filter((act) => {
      // Archive Filter
      if (!showArchived && act.archivedAt) return false;
      if (showArchived && !act.archivedAt) return false;

      // Type Filter
      if (typeFilter === "volunteer" && !act.isVolunteer) return false;
      if (typeFilter === "core" && act.isVolunteer) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          act.title.toLowerCase().includes(q) ||
          (act.description && act.description.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [activities, showArchived, typeFilter, searchQuery]);

  if (!activeProject) {
    return (
      <EmptyState
        icon={Activity}
        title={t("selectProject")}
        description={t("selectProjectDesc")}
      />
    );
  }

  const hasNoCentersAssigned = projectCenters.length === 0;

  return (
    <div className="layout-section">
      <div className="layout-page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">{t("title")}</h1>
          <p className="text-sm text-text-muted mt-1">
            {t("subtitle")} <strong>{activeProject.name}</strong>.
          </p>
        </div>
        {isProjectManager && !hasNoCentersAssigned && (
          <Button
            onClick={handleOpenCreate}
            disabled={isProjectArchived}
            title={isProjectArchived ? t("archivedReadOnly") : t("planActivity")}
            className="flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Plus className="size-4" />
            {t("planActivity")}
          </Button>
        )}
      </div>

      {hasNoCentersAssigned && !loadingCenters ? (
        <div className="mt-8 p-6 border border-dashed border-amber-300 rounded-xl bg-amber-50/10 flex flex-col items-center justify-center text-center gap-3">
          <Building2 className="size-8 text-amber-500" />
          <div className="space-y-1 max-w-md">
            <h3 className="font-semibold text-text-primary text-base">{t("noCentersTitle")}</h3>
            <p className="text-xs text-text-muted">
              {t("noCentersDesc")}
            </p>
          </div>
          <Link href="/settings" passHref>
            <Button size="sm" className="flex items-center gap-1.5 mt-2">
              <Settings className="size-4" />
              {t("configureSettings")}
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mt-8 pb-4 border-b border-border/40">
            <div className="flex flex-1 flex-col sm:flex-row gap-3 items-stretch sm:items-center max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 size-4 text-text-muted" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="flex h-9 w-full sm:w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-zinc-950 dark:text-zinc-50"
              >
                <option value="all">{t("allScopes")}</option>
                <option value="core">{t("coreRequired")}</option>
                <option value="volunteer">{t("volunteerActivities")}</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived((prev) => !prev)}
              className="flex items-center gap-1.5 shrink-0 h-9"
            >
              {showArchived ? (
                <>
                  <Eye className="size-4" />
                  {t("viewActive")}
                </>
              ) : (
                <>
                  <EyeOff className="size-4" />
                  {t("viewArchived")}
                </>
              )}
            </Button>
          </div>

          {/* Activities List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="size-8 text-primary animate-spin" />
              <p className="text-sm text-text-muted">{t("loadingActivities")}</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="py-16 bg-muted/5 border border-dashed border-border rounded-xl mt-6">
              <EmptyState
                icon={Activity}
                title={
                  searchQuery
                    ? t("noSearchResults")
                    : showArchived
                    ? t("noArchivedActivities")
                    : t("noActivitiesPlanned")
                }
                description={
                  searchQuery
                    ? t("noSearchResultsDesc", { query: searchQuery })
                    : showArchived
                    ? t("archivedDesc")
                    : t("noActivitiesDesc")
                }
              >
                {isProjectManager && !showArchived && !searchQuery && (
                  <Button
                    onClick={handleOpenCreate}
                    disabled={isProjectArchived}
                    title={isProjectArchived ? t("archivedReadOnly") : t("planFirstActivity")}
                    size="sm"
                    className="mt-3 flex items-center gap-1.5"
                  >
                    <Plus className="size-4" />
                    {t("planFirstActivity")}
                  </Button>
                )}
              </EmptyState>
            </div>
          ) : (
            <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-xs py-3.5">{t("activityParams")}</TableHead>
                    <TableHead className="font-semibold text-xs py-3.5">{t("plannedSessions")}</TableHead>
                    <TableHead className="font-semibold text-xs py-3.5">{t("participatingCenters")}</TableHead>
                    <TableHead className="font-semibold text-xs py-3.5">{t("schedulingConstraint")}</TableHead>
                    <TableHead className="font-semibold text-xs py-3.5">{t("operationalScope")}</TableHead>
                    <TableHead className="font-semibold text-xs py-3.5">{t("dateCreated")}</TableHead>
                    <TableHead className="text-right font-semibold text-xs py-3.5 pr-6">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TooltipProvider delay={150}>
                    {filteredActivities.map((act) => {
                      const isArchived = !!act.archivedAt;
                      return (
                        <TableRow key={act.id} className={isArchived ? "opacity-60 bg-muted/20" : ""}>
                          <TableCell className="py-4 font-medium pl-6">
                            <div className="space-y-0.5">
                              <span className="text-sm font-semibold text-text-primary block">{act.title}</span>
                              {act.description && (
                                <span className="text-xs text-text-muted font-normal block max-w-md truncate">
                                  {act.description}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-sm font-semibold text-text-secondary">
                            <div>
                              <span>{act.plannedSessionCount} {act.plannedSessionCount === 1 ? t("session") : t("sessions")}</span>
                              {act._count?.sessions ? (
                                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-0.5" title={`${act._count.sessions} ${t("sessions")} ${t("generated")}`}>
                                  <CheckCircle className="size-3 text-emerald-500 fill-emerald-50" />
                                  {t("generated")}
                                </span>
                              ) : (
                                <span className="block text-[11px] text-text-muted font-normal mt-0.5">
                                  {t("notGenerated")}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-sm">
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <span className="inline-flex items-center gap-1 cursor-help hover:text-primary transition-colors" />
                                }
                              >
                                <Building2 className="size-3.5 text-text-muted" />
                                <span className="font-semibold">{act.activityCenters.length}</span>
                                <span className="text-text-muted text-xs">
                                  {act.activityCenters.length === 1 ? t("center") : t("centers")}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[280px]">
                                <div className="space-y-1.5 p-1">
                                  <p className="text-xs font-semibold border-b border-border/30 pb-1">
                                    {t("participatingBranches")}
                                  </p>
                                  <ul className="text-xs space-y-1">
                                    {act.activityCenters.map((ac) => (
                                      <li key={ac.id} className="flex items-center gap-1.5">
                                        <MapPin className="size-3 text-text-muted" />
                                        <span>{ac.center.name} ({ac.center.city})</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="py-4 text-sm text-text-secondary">
                            {act.startDate || act.endDate ? (
                              <div className="flex items-center gap-1 text-xs">
                                <Calendar className="size-3.5 text-text-muted" />
                                <span>
                                  {act.startDate ? new Date(act.startDate).toLocaleDateString(locale) : tCommon("any")}
                                  {" → "}
                                  {act.endDate ? new Date(act.endDate).toLocaleDateString(locale) : tCommon("any")}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-text-muted italic">{t("noConstraint")}</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4 text-sm">
                            {act.isVolunteer ? (
                              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px] font-semibold">
                                {t("volunteer")}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-border text-[11px] font-semibold text-text-secondary">
                                {t("coreRequired")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-4 text-xs text-text-muted">
                            {new Date(act.createdAt).toLocaleDateString(locale)}
                          </TableCell>
                          <TableCell className="py-4 text-right pr-6">
                            <div className="flex items-center justify-end gap-1.5">
                              {isProjectManager && !isArchived ? (
                                <>
                                  {!act._count?.sessions && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedActivity(act);
                                        setIsGenerateOpen(true);
                                      }}
                                      disabled={isProjectArchived}
                                      title={isProjectArchived ? t("archivedReadOnly") : t("generateSessions")}
                                      className="h-8 text-xs font-semibold px-2.5 flex items-center gap-1 border-border/80 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                                    >
                                      <CheckCircle className="size-3.5 text-text-muted" />
                                      {t("generate")}
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenEdit(act)}
                                    disabled={isProjectArchived}
                                    title={isProjectArchived ? t("archivedReadOnly") : t("editActivity")}
                                    className="size-8 text-text-muted hover:text-text-primary hover:bg-muted disabled:opacity-50"
                                  >
                                    <Edit2 className="size-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedActivity(act);
                                      setIsDeleteOpen(true);
                                    }}
                                    disabled={isProjectArchived}
                                    title={isProjectArchived ? t("archivedReadOnly") : t("archiveActivity")}
                                    className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <span className="text-xs text-text-muted italic">{t("readOnly")}</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TooltipProvider>
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* CREATE ACTIVITY DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>{t("planActivityDialog")}</DialogTitle>
              <DialogDescription>
                {t("planActivityDesc")}{" "}
                <strong>{activeProject.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="grid gap-1.5">
                <Label htmlFor="create-title">{t("activityTitleLabel")}</Label>
                <Input
                  id="create-title"
                  placeholder={t("activityTitlePlaceholder")}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="create-desc">{t("descriptionLabel")}</Label>
                <Textarea
                  id="create-desc"
                  placeholder={t("descriptionPlaceholder")}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="min-h-[70px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="create-session-count">{t("plannedSessionCount")}</Label>
                  <Input
                    id="create-session-count"
                    type="number"
                    min={1}
                    value={formSessionCount}
                    onChange={(e) => setFormSessionCount(parseInt(e.target.value, 10))}
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="create-volunteer"
                    type="checkbox"
                    checked={formIsVolunteer}
                    onChange={(e) => setFormIsVolunteer(e.target.checked)}
                    className="size-4.5 rounded border-input text-primary focus:ring-primary/40 focus:ring-offset-background"
                  />
                  <Label htmlFor="create-volunteer" className="text-sm font-medium cursor-pointer">
                    {t("volunteerInitiative")}
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="create-start">{t("startDateOptional")}</Label>
                  <Input
                    id="create-start"
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="create-end">{t("endDateOptional")}</Label>
                  <Input
                    id="create-end"
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2 border-t border-border/40 pt-3">
                <Label className="text-sm font-semibold">{t("participatingCentersLabel")}</Label>
                <p className="text-[11px] text-text-muted mt-0.5 mb-1.5">
                  {t("participatingCentersDesc")}
                </p>
                <div className="grid gap-2 max-h-[140px] overflow-y-auto border border-border rounded-lg p-2.5 bg-muted/10">
                  {projectCenters.map((pc) => (
                    <div
                      key={pc.centerId}
                      onClick={() => toggleCenterSelection(pc.centerId)}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCenterIds.includes(pc.centerId)}
                        onChange={() => {}} // Controlled by onClick on parent div
                        className="size-4.5 rounded border-input text-primary"
                      />
                      <div className="text-xs">
                        <p className="font-semibold text-text-primary">{pc.center.name}</p>
                        <p className="text-text-muted text-[10px]">{pc.center.city}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border/40 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={submitting}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? t("planning") : t("planActivity")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT ACTIVITY DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>{t("editActivityTitle")}</DialogTitle>
              <DialogDescription>
                {t("editActivityDesc")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-title">{t("activityTitleLabel")}</Label>
                <Input
                  id="edit-title"
                  placeholder={t("activityTitlePlaceholder")}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-desc">{t("descriptionLabel")}</Label>
                <Textarea
                  id="edit-desc"
                  placeholder={t("descriptionPlaceholder")}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="min-h-[70px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-session-count">{t("plannedSessionCount")}</Label>
                  <Input
                    id="edit-session-count"
                    type="number"
                    min={1}
                    value={formSessionCount}
                    onChange={(e) => setFormSessionCount(parseInt(e.target.value, 10))}
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="edit-volunteer"
                    type="checkbox"
                    checked={formIsVolunteer}
                    onChange={(e) => setFormIsVolunteer(e.target.checked)}
                    className="size-4.5 rounded border-input text-primary focus:ring-primary/40 focus:ring-offset-background"
                  />
                  <Label htmlFor="edit-volunteer" className="text-sm font-medium cursor-pointer">
                    {t("volunteerInitiative")}
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-start">{t("startDateOptional")}</Label>
                  <Input
                    id="edit-start"
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-end">{t("endDateOptional")}</Label>
                  <Input
                    id="edit-end"
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2 border-t border-border/40 pt-3">
                <Label className="text-sm font-semibold">{t("participatingCentersLabel")}</Label>
                <p className="text-[11px] text-text-muted mt-0.5 mb-1.5">
                  {t("participatingCentersDesc")}
                </p>
                <div className="grid gap-2 max-h-[140px] overflow-y-auto border border-border rounded-lg p-2.5 bg-muted/10">
                  {projectCenters.map((pc) => (
                    <div
                      key={pc.centerId}
                      onClick={() => toggleCenterSelection(pc.centerId)}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCenterIds.includes(pc.centerId)}
                        onChange={() => {}} // Controlled by parent div click
                        className="size-4.5 rounded border-input text-primary"
                      />
                      <div className="text-xs">
                        <p className="font-semibold text-text-primary">{pc.center.name}</p>
                        <p className="text-text-muted text-[10px]">{pc.center.city}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border/40 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={submitting}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? t("saving") : t("saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE / ARCHIVE ALERT DIALOG */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("archiveActivityTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedActivity && t("archiveActivityDesc", { title: selectedActivity.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteSubmit();
              }}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? t("archiving") : t("archiveActivity")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* GENERATE SESSIONS ALERT DIALOG */}
      <AlertDialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("generateTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedActivity && t("generateDesc", {
                count: selectedActivity.plannedSessionCount,
                centers: selectedActivity.activityCenters.length,
              })}
              <br />

              {distributionInfo && (
                <div className="mt-4 space-y-3.5 border-t border-border/40 pt-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">{t("schedulingBoundaries")}</span>
                    <div className="flex items-center gap-1.5 text-xs text-text-primary mt-0.5">
                      <Calendar className="size-3.5 text-primary" />
                      <span>{distributionInfo.formattedRange}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">{t("centerAllocationPreview")}</span>
                    <div className="grid gap-2 border border-border/50 rounded-lg p-2.5 bg-muted/10 max-h-[160px] overflow-y-auto mt-0.5">
                      {Object.entries(distributionInfo.counts).map(([name, count]) => (
                        <div key={name} className="flex justify-between items-center text-xs">
                          <span className="font-medium text-text-primary text-[11px]">{name}</span>
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{count} {count === 1 ? t("session") : t("sessions")}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {distributionInfo.isImperfect && (
                    <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-600 dark:text-amber-400 mt-1">
                      <Info className="size-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-[10px] uppercase tracking-wider mb-0.5">{t("imbalancedNotice")}</p>
                        <p className="leading-relaxed text-[10px]">
                          {t("imbalancedDesc", {
                            count: distributionInfo.plannedCount,
                            centers: distributionInfo.centersCount,
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <br />
              <span className="text-xs text-text-muted">{t("permanentNote")}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleGenerateSubmit();
              }}
              disabled={submitting}
              className="bg-primary text-primary-foreground hover:bg-primary/95"
            >
              {submitting ? t("generating") : t("generateSessions")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
