"use client";

import { LayoutDashboard } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useProject } from "@/lib/project-context";

export default function DashboardPage() {
  const { activeProject } = useProject();

  if (!activeProject) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="No project selected"
        description="Select a project from the navbar to view its dashboard."
      />
    );
  }

  return (
    <div className="layout-section">
      <div className="layout-page-header">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted">{activeProject.name}</p>
        </div>
      </div>
      <EmptyState
        icon={LayoutDashboard}
        title="Dashboard coming soon"
        description="Project dashboard with progress, delays, and center summaries will be built in a future feature."
      />
    </div>
  );
}
