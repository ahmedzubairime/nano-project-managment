"use client";

import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useProject } from "@/lib/project-context";

export default function ReportsPage() {
  const { activeProject } = useProject();

  if (!activeProject) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No project selected"
        description="Select a project to view its reports."
      />
    );
  }

  return (
    <div className="layout-section">
      <div className="layout-page-header">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Reports</h1>
          <p className="text-sm text-text-muted">{activeProject.name}</p>
        </div>
      </div>
      <EmptyState
        icon={BarChart3}
        title="No reports available"
        description="Project reports, analytics, and exports will be accessible here."
      />
    </div>
  );
}
