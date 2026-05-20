"use client";

import { GanttChart } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useProject } from "@/lib/project-context";

export default function TimelinePage() {
  const { activeProject } = useProject();

  if (!activeProject) {
    return (
      <EmptyState
        icon={GanttChart}
        title="No project selected"
        description="Select a project to view its timeline."
      />
    );
  }

  return (
    <div className="layout-section">
      <div className="layout-page-header">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Timeline</h1>
          <p className="text-sm text-text-muted">{activeProject.name}</p>
        </div>
      </div>
      <EmptyState
        icon={GanttChart}
        title="Timeline coming soon"
        description="Gantt chart with activities, sessions, and center distributions will be built here."
      />
    </div>
  );
}
