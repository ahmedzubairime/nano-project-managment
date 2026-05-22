"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { useProject } from "@/lib/project-context";

import { useTranslations } from "next-intl";

export function ArchiveBanner() {
  const { activeProject } = useProject();
  const t = useTranslations("archiveBanner");

  if (activeProject?.status !== "ARCHIVED") {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
      <Lock className="size-3.5 shrink-0" />
      <span>
        <strong>{t("projectArchived")}</strong> {t("readOnlyMessage", { name: activeProject.name })}
      </span>
    </div>
  );
}
