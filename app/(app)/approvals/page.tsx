"use client";

import { ClipboardCheck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useProject } from "@/lib/project-context";

export default function ApprovalsPage() {
  const { activeProject } = useProject();

  if (!activeProject) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No project selected"
        description="Select a project to view pending approvals."
      />
    );
  }

  return (
    <div className="layout-section">
      <div className="layout-page-header">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Approvals</h1>
          <p className="text-sm text-text-muted">{activeProject.name}</p>
        </div>
      </div>
      <EmptyState
        icon={ClipboardCheck}
        title="No pending approvals"
        description="Session approval workflow and review queue will be displayed here."
      />
    </div>
  );
}
