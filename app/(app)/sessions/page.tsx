"use client";

import { CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useProject } from "@/lib/project-context";

export default function SessionsPage() {
  const { activeProject } = useProject();

  if (!activeProject) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No project selected"
        description="Select a project to view its sessions."
      />
    );
  }

  return (
    <div className="layout-section">
      <div className="layout-page-header">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Sessions</h1>
          <p className="text-sm text-text-muted">{activeProject.name}</p>
        </div>
      </div>
      <EmptyState
        icon={CalendarDays}
        title="No sessions yet"
        description="Session execution and approval queue will be displayed here."
      />
    </div>
  );
}
