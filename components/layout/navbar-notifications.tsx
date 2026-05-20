"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Info, AlertTriangle, Clock, Megaphone, Check } from "lucide-react";
import { useProject } from "@/lib/project-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "DEADLINE" | "DELAY" | "ANNOUNCEMENT";
  createdAt: string;
  read: boolean;
  sender?: { email: string; role: string } | null;
  centers?: Array<{ id: string; name: string; city: string }>;
}

export function NavbarNotifications() {
  const { activeProject } = useProject();
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch notifications
  const fetchNotifications = React.useCallback(async () => {
    if (!activeProject?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/notifications?projectId=${activeProject.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeProject?.id]);

  // Fetch on mount or when active project changes
  React.useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds for live operational feeling
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refetch when dropdown opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchNotifications();
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid closing dropdown if clicking the check mark
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        toast.success("Notification marked as read");
      }
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      const promises = unreadIds.map((id) =>
        fetch(`/api/notifications/${id}/read`, { method: "PATCH" })
      );
      await Promise.all(promises);
      
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  // Get matching icon and color classes based on notification type
  const getNotificationConfig = (type: string) => {
    switch (type) {
      case "WARNING":
        return {
          icon: AlertTriangle,
          bg: "bg-amber-100 dark:bg-amber-900/30",
          text: "text-amber-600 dark:text-amber-400",
        };
      case "DELAY":
        return {
          icon: AlertTriangle,
          bg: "bg-rose-100 dark:bg-rose-900/30",
          text: "text-rose-600 dark:text-rose-400",
        };
      case "DEADLINE":
        return {
          icon: Clock,
          bg: "bg-blue-100 dark:bg-blue-900/30",
          text: "text-blue-600 dark:text-blue-400",
        };
      case "ANNOUNCEMENT":
        return {
          icon: Megaphone,
          bg: "bg-purple-100 dark:bg-purple-900/30",
          text: "text-purple-600 dark:text-purple-400",
        };
      default:
        return {
          icon: Info,
          bg: "bg-slate-100 dark:bg-slate-900/30",
          text: "text-slate-600 dark:text-slate-400",
        };
    }
  };

  // Format date helper
  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger render={<button className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")} aria-label="Notifications" />}>
        <Bell className="h-[1.2rem] w-[1.2rem]" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
        )}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[380px] p-0 shadow-lg border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="px-1.5 py-0.5 text-[10px] font-medium leading-none">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-[11px] h-7 px-2 hover:bg-muted font-medium text-text-muted hover:text-text-primary"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Scrollable list */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
          {isLoading && notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-muted">
              Loading alerts...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-muted p-3 mb-2">
                <Bell className="h-5 w-5 text-text-muted" />
              </div>
              <p className="text-xs font-medium text-text-primary">No new notifications</p>
              <p className="text-[11px] text-text-muted max-w-[200px] mt-1">
                You will be notified when session approvals or delays occur.
              </p>
            </div>
          ) : (
            notifications.slice(0, 5).map((notification) => {
              const config = getNotificationConfig(notification.type);
              const IconComp = config.icon;
              return (
                <div
                  key={notification.id}
                  className={`flex gap-3 p-3.5 hover:bg-muted/45 transition-colors relative ${
                    !notification.read ? "bg-primary/5 dark:bg-primary/10" : ""
                  }`}
                >
                  {/* Left Icon */}
                  <div className={`flex-shrink-0 rounded-full p-2 h-9 w-9 flex items-center justify-center ${config.bg}`}>
                    <IconComp className={`h-4.5 w-4.5 ${config.text}`} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-6">
                    <p className={`text-xs font-semibold leading-relaxed truncate text-text-primary ${
                      !notification.read ? "font-bold" : ""
                    }`}>
                      {notification.title}
                    </p>
                    <p className="text-[11px] text-text-muted mt-1 leading-relaxed break-words font-medium">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-text-muted font-medium">
                        {timeAgo(notification.createdAt)}
                      </span>
                      {notification.sender && (
                        <>
                          <span className="text-[10px] text-text-muted">•</span>
                          <span className="text-[10px] font-medium text-text-muted italic truncate max-w-[120px]">
                            by {notification.sender.email.split("@")[0]}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action: Mark as read */}
                  {!notification.read && (
                    <button
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                      title="Mark as read"
                      className="absolute right-3.5 top-3.5 h-6 w-6 flex items-center justify-center rounded-full border border-border bg-background hover:bg-muted text-text-muted hover:text-text-primary transition-all shadow-sm"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border bg-muted/20 text-center">
          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full text-xs text-primary font-medium")}
          >
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
