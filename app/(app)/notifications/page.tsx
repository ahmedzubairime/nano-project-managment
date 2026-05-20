"use client";

import { Bell } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export default function NotificationsPage() {
  return (
    <div className="layout-section">
      <div className="layout-page-header">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Notifications
          </h1>
          <p className="text-sm text-text-muted">
            View alerts, reminders, and broadcasts
          </p>
        </div>
      </div>
      <EmptyState
        icon={Bell}
        title="No notifications"
        description="Automatic and manual notifications will appear here."
      />
    </div>
  );
}
