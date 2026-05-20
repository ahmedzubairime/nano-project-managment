"use client";

import * as React from "react";

/** Placeholder project type — will be replaced with Prisma model */
export interface Project {
  id: string;
  name: string;
  status: "active" | "archived";
  startDate: string;
  endDate: string;
}

/** Placeholder project data for shell development */
export const PLACEHOLDER_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "Youth Development Program 2026",
    status: "active",
    startDate: "2026-01-15",
    endDate: "2026-06-30",
  },
  {
    id: "proj-2",
    name: "Community Outreach Initiative",
    status: "active",
    startDate: "2026-03-01",
    endDate: "2026-09-30",
  },
  {
    id: "proj-3",
    name: "Skills Training Project Q1",
    status: "archived",
    startDate: "2025-10-01",
    endDate: "2026-01-31",
  },
];

interface ProjectContextValue {
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  projects: Project[];
}

const ProjectContext = React.createContext<ProjectContextValue | undefined>(
  undefined
);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [activeProject, setActiveProject] = React.useState<Project | null>(
    PLACEHOLDER_PROJECTS[0]
  );

  const value = React.useMemo(
    () => ({
      activeProject,
      setActiveProject,
      projects: PLACEHOLDER_PROJECTS,
    }),
    [activeProject]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject() {
  const context = React.useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
