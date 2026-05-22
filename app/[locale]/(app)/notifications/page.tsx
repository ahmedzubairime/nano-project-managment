"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { useProject } from "@/lib/project-context";
import {
  Bell,
  Info,
  AlertTriangle,
  Clock,
  Megaphone,
  Check,
  Plus,
  Inbox,
  Filter,
  CheckSquare,
  Square,
  Send,
  Loader2,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { getLocalizedValue } from "@/lib/utils";

interface NotificationItem {
  id: string;
  projectId: string;
  sessionId?: string | null;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "DEADLINE" | "DELAY" | "ANNOUNCEMENT";
  createdAt: string;
  read: boolean;
  sender?: { email: string; role: string } | null;
  centers: Array<{ id: string; name: string; city: string }>;
  session?: { id: string; activityTitle: string; centerName: string } | null;
}

interface CenterItem {
  id: string;
  name: string;
  city: string;
}

export default function NotificationsPage() {
  const { user } = useUser();
  const { activeProject } = useProject();
  const t = useTranslations("notifications");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const role = (user?.publicMetadata?.role as string) || "VIEWER";
  const isPM = role === "PROJECT_MANAGER";

  // State
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [centers, setCenters] = React.useState<CenterItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Filter states
  const [activeTab, setActiveTab] = React.useState("ALL"); // ALL, INFO, WARNING, DEADLINES, ANNOUNCEMENT
  const [unreadOnly, setUnreadOnly] = React.useState(false);

  // Broadcast modal state
  const [isOpen, setIsOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newMessage, setNewMessage] = React.useState("");
  const [selectedCenterIds, setSelectedCenterIds] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch notifications
  const loadNotifications = React.useCallback(async () => {
    if (!activeProject?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/notifications?projectId=${activeProject.id}&unreadOnly=${unreadOnly}`
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        toast.error(t("errorLoading"));
      }
    } catch (error) {
      console.error("Load notifications error:", error);
      toast.error(t("errorConnecting"));
    } finally {
      setIsLoading(false);
    }
  }, [activeProject?.id, unreadOnly, t]);

  // Load project centers (for broadcast targeting)
  const loadCenters = React.useCallback(async () => {
    if (!activeProject?.id || !isPM) return;
    try {
      const res = await fetch(`/api/projects/${activeProject.id}/centers`);
      if (res.ok) {
        const data = await res.json();
        // Extract center from projectCenter relation payload
        const mappedCenters = data.map((item: any) => item.center).filter(Boolean);
        setCenters(mappedCenters);
      }
    } catch (error) {
      console.error("Load centers error:", error);
    }
  }, [activeProject?.id, isPM]);

  // Initial loads
  React.useEffect(() => {
    loadNotifications();
    loadCenters();
  }, [loadNotifications, loadCenters]);

  // Mark notification as read
  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        toast.success(t("markedAsRead"));
      } else {
        toast.error(t("errorUpdatingStatus"));
      }
    } catch (error) {
      toast.error(t("errorConnecting"));
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      const promises = unreadIds.map((id) =>
        fetch(`/api/notifications/${id}/read`, { method: "PATCH" })
      );
      await Promise.all(promises);

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success(t("allMarkedRead"));
    } catch (error) {
      toast.error(t("errorMarkingAll"));
    }
  };

  // Submit manual announcement broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error(t("errorNoTitle"));
      return;
    }
    if (!newMessage.trim()) {
      toast.error(t("errorNoMessage"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${activeProject?.id}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          message: newMessage.trim(),
          centerIds: selectedCenterIds,
        }),
      });

      if (res.ok) {
        toast.success(t("broadcastSent"));
        setNewTitle("");
        setNewMessage("");
        setSelectedCenterIds([]);
        setIsOpen(false);
        loadNotifications(); // Reload list
      } else {
        const errData = await res.json();
        toast.error(errData.error || t("errorSending"));
      }
    } catch (error) {
      toast.error(t("errorConnecting"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Center toggle handler
  const handleToggleCenter = (centerId: string) => {
    setSelectedCenterIds((prev) =>
      prev.includes(centerId) ? prev.filter((id) => id !== centerId) : [...prev, centerId]
    );
  };

  const handleSelectAllCenters = () => {
    if (selectedCenterIds.length === centers.length) {
      setSelectedCenterIds([]);
    } else {
      setSelectedCenterIds(centers.map((c) => c.id));
    }
  };

  // Filter notifications logic
  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === "INFO" && notif.type !== "INFO") return false;
    if (activeTab === "WARNING" && notif.type !== "WARNING") return false;
    if (activeTab === "ANNOUNCEMENT" && notif.type !== "ANNOUNCEMENT") return false;
    if (activeTab === "DEADLINES" && notif.type !== "DEADLINE" && notif.type !== "DELAY") return false;
    return true;
  });

  // Get matching config per type
  const getTypeStyles = (type: string) => {
    switch (type) {
      case "WARNING":
        return {
          icon: AlertTriangle,
          bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30",
          iconBg: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
          badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
          label: t("warningLabel"),
        };
      case "DELAY":
        return {
          icon: AlertTriangle,
          bg: "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30",
          iconBg: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
          badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
          label: t("delayAlert"),
        };
      case "DEADLINE":
        return {
          icon: Clock,
          bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30",
          iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
          badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
          label: t("deadline"),
        };
      case "ANNOUNCEMENT":
        return {
          icon: Megaphone,
          bg: "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/30",
          iconBg: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
          badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
          label: t("announcement"),
        };
      default:
        return {
          icon: Info,
          bg: "bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800",
          iconBg: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
          badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
          label: t("infoAlert"),
        };
    }
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh]">
        <Bell className="h-10 w-10 text-text-muted mb-4 animate-pulse" />
        <h3 className="font-semibold text-text-primary text-lg">{t("noActiveProject")}</h3>
        <p className="text-sm text-text-muted max-w-sm mt-1">
          {t("noActiveProjectDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">{t("title")}</h1>
          <p className="text-text-muted text-sm mt-1.5 font-medium">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* PM Broadcast Trigger Button */}
          {isPM && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger render={<Button className="gap-2 shadow-sm font-semibold rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground" />}>
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> {t("createBroadcast")}
                </span>
              </DialogTrigger>
              <DialogContent className="max-w-lg shadow-xl border border-border">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-text-primary">
                    <Megaphone className="h-5 w-5 text-primary" /> {t("createManualAnnouncement")}
                  </DialogTitle>
                  <DialogDescription className="text-text-muted text-xs">
                    {t("broadcastDesc")}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSendBroadcast} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="text-text-primary font-semibold text-xs">
                      {t("announcementTitle")}
                    </Label>
                    <Input
                      id="title"
                      placeholder={t("titlePlaceholder")}
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      className="border-input text-text-primary rounded-md"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-text-primary font-semibold text-xs">
                      {t("announcementMessage")}
                    </Label>
                    <Textarea
                      id="message"
                      rows={4}
                      placeholder={t("messagePlaceholder")}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      required
                      className="border-input text-text-primary rounded-md leading-relaxed resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-text-primary font-semibold text-xs">
                        {t("targetCenters")}
                      </Label>
                      {centers.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSelectAllCenters}
                          className="text-[10px] font-semibold text-primary hover:underline"
                        >
                          {selectedCenterIds.length === centers.length
                            ? t("deselectAll")
                            : t("selectAllCenters")}
                        </button>
                      )}
                    </div>
                    
                    {centers.length === 0 ? (
                      <p className="text-[10px] text-text-muted italic">
                        {t("noCentersAssigned")}
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-border rounded-md bg-muted/20">
                        {centers.map((center) => (
                          <div
                            key={center.id}
                            className="flex items-center space-x-2 p-1.5 hover:bg-muted/40 rounded transition-colors"
                          >
                            <Checkbox
                              id={`center-${center.id}`}
                              checked={selectedCenterIds.includes(center.id)}
                              onCheckedChange={() => handleToggleCenter(center.id)}
                            />
                            <Label
                              htmlFor={`center-${center.id}`}
                              className="text-[11px] font-medium text-text-primary truncate cursor-pointer select-none"
                            >
                              {center.name} ({center.city})
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <DialogFooter className="pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                      disabled={isSubmitting}
                      className="rounded-md font-semibold text-text-muted border-input hover:bg-muted"
                    >
                      {tCommon("cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-md gap-2 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> {t("sending")}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" /> {t("sendAnnouncement")}
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="gap-2 text-xs font-semibold rounded-lg border-input hover:bg-muted text-text-muted hover:text-text-primary"
            >
              <Check className="h-4 w-4" /> {t("markAllRead")}
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
        {/* Left Side: Filter Panels */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-sm border border-border">
            <CardHeader className="p-4 pb-2 border-b border-border">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-primary" /> {t("filters")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Unread Switcher */}
              <div className="flex flex-col gap-2">
                <Label className="text-text-primary font-semibold text-xs">{t("readStatus")}</Label>
                <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-muted border border-border">
                  <button
                    onClick={() => setUnreadOnly(false)}
                    className={`text-xs py-1.5 px-2 rounded-md font-semibold transition-all ${
                      !unreadOnly
                        ? "bg-background text-text-primary shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {t("allAlerts")}
                  </button>
                  <button
                    onClick={() => setUnreadOnly(true)}
                    className={`text-xs py-1.5 px-2 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      unreadOnly
                        ? "bg-background text-text-primary shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {t("unread")}
                    {unreadCount > 0 && (
                      <Badge className="bg-rose-500 hover:bg-rose-500 text-white text-[9px] px-1 py-0 h-4 min-w-4 flex items-center justify-center font-bold">
                        {unreadCount}
                      </Badge>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Indicator Legend */}
              <div className="border-t border-border pt-4">
                <Label className="text-text-primary font-semibold text-xs">{t("severityTypes")}</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                    <span className="text-[11px] font-semibold text-text-primary">{t("infoOps")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                    <span className="text-[11px] font-semibold text-text-primary">{t("warningRejection")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                    <span className="text-[11px] font-semibold text-text-primary">{t("deadlinePlanned")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                    <span className="text-[11px] font-semibold text-text-primary">{t("delayOverdue")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-400"></span>
                    <span className="text-[11px] font-semibold text-text-primary">{t("broadcastManual")}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Tab List & Notification Feed */}
        <div className="lg:col-span-3 space-y-4">
          {/* Main category Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 sm:grid-cols-5 p-1 bg-muted rounded-lg border border-border">
              <TabsTrigger value="ALL" className="text-xs font-semibold rounded-md">
                {t("all")}
              </TabsTrigger>
              <TabsTrigger value="INFO" className="text-xs font-semibold rounded-md hidden sm:inline-flex">
                {t("reminders")}
              </TabsTrigger>
              <TabsTrigger value="DEADLINES" className="text-xs font-semibold rounded-md">
                {t("deadlines")}
              </TabsTrigger>
              <TabsTrigger value="WARNING" className="text-xs font-semibold rounded-md">
                {t("warnings")}
              </TabsTrigger>
              <TabsTrigger value="ANNOUNCEMENT" className="text-xs font-semibold rounded-md">
                {t("broadcasts")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Feed Content */}
          <div className="space-y-3.5">
            {isLoading ? (
              // Loading states
              Array.from({ length: 4 }).map((_, idx) => (
                <Card key={idx} className="animate-pulse shadow-sm border border-border">
                  <div className="flex gap-4 p-4 items-start">
                    <div className="rounded-full bg-muted h-10 w-10 flex-shrink-0" />
                    <div className="flex-1 space-y-2 mt-1">
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </Card>
              ))
            ) : filteredNotifications.length === 0 ? (
              // Empty feed state
              <Card className="shadow-sm border border-border p-12 text-center">
                <CardContent className="flex flex-col items-center justify-center pt-6">
                  <div className="rounded-full bg-muted p-4 mb-3">
                    <Inbox className="h-6 w-6 text-text-muted" />
                  </div>
                  <h3 className="font-semibold text-text-primary text-base">{t("noNotifications")}</h3>
                  <p className="text-text-muted text-xs max-w-sm mt-1 leading-relaxed">
                    {t("noNotificationsDesc")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              // Real notifications feed
              filteredNotifications.map((notif) => {
                const styles = getTypeStyles(notif.type);
                const IconComp = styles.icon;
                return (
                  <Card
                    key={notif.id}
                    className={`shadow-sm border border-border transition-all duration-300 hover:shadow relative ${
                      styles.bg
                    } ${!notif.read ? "border-l-4 border-l-primary" : ""}`}
                  >
                    <CardContent className="flex gap-4 p-4.5 items-start">
                      {/* Left icon wrapper */}
                      <div className={`rounded-full p-2.5 flex-shrink-0 flex items-center justify-center ${styles.iconBg}`}>
                        <IconComp className="h-5 w-5" />
                      </div>

                      {/* Content panel */}
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`text-sm font-bold text-text-primary tracking-tight ${
                            !notif.read ? "font-extrabold text-[14.5px]" : ""
                          }`}>
                            {getLocalizedValue(notif.title, locale)}
                          </h4>
                          <Badge className={`text-[10px] font-semibold tracking-wide ${styles.badge}`}>
                            {styles.label}
                          </Badge>
                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-rose-500" title={t("unread")} />
                          )}
                        </div>

                        <p className="text-text-primary text-xs leading-relaxed mt-2 font-medium break-words">
                          {getLocalizedValue(notif.message, locale)}
                        </p>

                        {/* Metadatas and Targets */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3.5 border-t border-border/40 text-[10.5px] text-text-muted font-medium">
                          <span>{formatFullDate(notif.createdAt)}</span>
                          
                          {notif.sender && (
                            <>
                              <span>•</span>
                              <span>
                                {t("sentBy")}: <span className="font-semibold">{notif.sender.email}</span>
                              </span>
                            </>
                          )}

                          {notif.centers.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[250px]" title={notif.centers.map(c => c.name).join(", ")}>
                                {t("target")}: <span className="font-semibold text-text-primary">{notif.centers.map(c => c.name).join(", ")}</span>
                              </span>
                            </>
                          )}

                          {notif.centers.length === 0 && (
                            <>
                              <span>•</span>
                              <span>
                                {t("target")}: <span className="font-semibold text-text-primary">{t("projectWide")}</span>
                              </span>
                            </>
                          )}

                          {notif.session && (
                            <>
                              <span>•</span>
                              <span>
                                {t("linkedTo")}: <span className="font-semibold text-text-primary">"{notif.session.activityTitle}" {t("atLabel")} {notif.session.centerName}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right top actions: Mark Read */}
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          title={t("markAsRead")}
                          className="absolute right-4 top-4.5 h-7 w-7 flex items-center justify-center rounded-full border border-border bg-background hover:bg-muted text-text-muted hover:text-text-primary shadow-sm transition-all"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
