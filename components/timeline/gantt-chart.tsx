"use client";

import * as React from "react";
import "./frappe-gantt-base.css";
import "./gantt-styles.css";

export interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  customClass?: string;
  status?: string;
  meta?: Record<string, any>;
}

type ViewMode = "Week" | "Month" | "Quarter Year";

interface GanttChartProps {
  tasks: GanttTask[];
  viewMode?: ViewMode;
  onTaskClick?: (task: GanttTask) => void;
}

export function GanttChart({ tasks, viewMode = "Month", onTaskClick }: GanttChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const ganttInstanceRef = React.useRef<any>(null);
  const tasksRef = React.useRef<GanttTask[]>(tasks);
  const onTaskClickRef = React.useRef(onTaskClick);

  // Keep refs in sync to avoid stale closures
  onTaskClickRef.current = onTaskClick;
  tasksRef.current = tasks;

  // Initialize the Gantt chart
  React.useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return;

    let cancelled = false;

    async function initGantt() {
      // Dynamic import to avoid SSR issues
      const GanttModule = await import("frappe-gantt");
      const Gantt = GanttModule.default;

      if (cancelled || !containerRef.current) return;

      // Clear previous instance
      containerRef.current.innerHTML = "";

      // Prepare tasks in frappe-gantt format
      const ganttTasks = tasksRef.current.map((t) => ({
        id: t.id,
        name: t.name,
        start: t.start,
        end: t.end,
        progress: t.progress,
        custom_class: t.customClass || "",
      }));

      // Create Gantt instance
      const gantt = new Gantt(containerRef.current, ganttTasks, {
        view_mode: viewMode,
        date_format: "YYYY-MM-DD",
        popup_trigger: "click",
        readonly: true,
        move_dependencies: false,
        today_button: false,
        view_mode_select: false,
        on_click: (task: any) => {
          // Find original task with meta
          const originalTask = tasksRef.current.find((t) => t.id === task.id);
          if (originalTask && onTaskClickRef.current) {
            onTaskClickRef.current(originalTask);
          }
        },
        custom_popup_html: (task: any) => {
          const originalTask = tasksRef.current.find((t) => t.id === task.id);
          const meta = originalTask?.meta || {};
          const statusLabel = meta.sessionStatus || originalTask?.status || "—";
          const centerLabel = meta.centerName || "";

          return `
            <div class="gantt-popup-custom">
              <div style="font-weight:600;font-size:13px;color:var(--text-primary);margin-bottom:4px;">
                ${task.name}
              </div>
              ${centerLabel ? `<div style="font-size:11px;color:var(--text-muted);margin-bottom:2px;">📍 ${centerLabel}${meta.centerCity ? ` (${meta.centerCity})` : ""}</div>` : ""}
              <div style="font-size:11px;color:var(--text-secondary);margin-bottom:2px;">
                📅 ${task._start?.toLocaleDateString?.() || task.start} → ${task._end?.toLocaleDateString?.() || task.end}
              </div>
              <div style="font-size:11px;color:var(--text-secondary);">
                Status: <strong>${statusLabel}</strong> · Progress: <strong>${task.progress}%</strong>
              </div>
              ${meta.isDelayed ? '<div style="font-size:10px;color:var(--status-delayed);margin-top:4px;font-weight:600;">⚠ Delayed</div>' : ""}
            </div>
          `;
        },
      });

      ganttInstanceRef.current = gantt;
    }

    initGantt();

    return () => {
      cancelled = true;
      ganttInstanceRef.current = null;
    };
  }, [tasks, viewMode]);

  // Update view mode when prop changes
  React.useEffect(() => {
    if (ganttInstanceRef.current) {
      try {
        ganttInstanceRef.current.change_view_mode(viewMode);
      } catch {
        // Gantt may not be ready yet
      }
    }
  }, [viewMode]);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="gantt-container w-full overflow-x-auto"
      style={{ minHeight: Math.max(200, tasks.length * 46 + 80) }}
    />
  );
}
