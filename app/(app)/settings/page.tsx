"use client";

import { Settings } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export default function SettingsPage() {
  return (
    <div className="layout-section">
      <div className="layout-page-header">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
          <p className="text-sm text-text-muted">
            Account and application preferences
          </p>
        </div>
      </div>
      <EmptyState
        icon={Settings}
        title="Settings coming soon"
        description="Account settings, language preferences, and notification configuration."
      />
    </div>
  );
}
