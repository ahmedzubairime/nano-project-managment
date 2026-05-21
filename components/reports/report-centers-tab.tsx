"use client";

import * as React from "react";
import { Building2, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CenterMetric {
  centerId: string;
  centerName: string;
  city: string;
  assignedSessions: number;
  completedSessions: number;
  delayedSessions: number;
  completionRate: number;
  delayRate: number;
  volunteerSessions: number;
  volunteerCompleted: number;
  avgApprovalTurnaroundHours: number | null;
}

interface CentersData {
  centers: CenterMetric[];
}

export function ReportCentersTab({ data }: { data: CentersData }) {
  if (data.centers.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center text-center">
        <Building2 className="size-12 text-text-muted/40 mb-3" />
        <span className="text-sm font-semibold text-text-secondary">No center data available</span>
        <p className="text-xs text-text-muted max-w-xs mt-1">No participating centers match the current filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="size-5 text-primary" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">Centers</span>
            <span className="text-2xl font-bold text-text-primary">{data.centers.length}</span>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="size-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-5 text-rose-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">Delayed Centers</span>
            <span className="text-2xl font-bold text-text-primary">
              {data.centers.filter((c) => c.delayedSessions > 0).length}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <Clock className="size-5 text-amber-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">Avg. Turnaround</span>
            <span className="text-2xl font-bold text-text-primary">
              {(() => {
                const valid = data.centers.filter((c) => c.avgApprovalTurnaroundHours !== null);
                if (valid.length === 0) return "—";
                const avg = valid.reduce((s, c) => s + (c.avgApprovalTurnaroundHours || 0), 0) / valid.length;
                return `${Math.round(avg)}h`;
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* Centers Performance Table */}
      <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-2 border-b border-border/40">
          Center Performance Matrix
        </h3>
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border/80 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                <th className="p-3">Center</th>
                <th className="p-3">City</th>
                <th className="p-3 text-center">Assigned</th>
                <th className="p-3 text-center">Completed</th>
                <th className="p-3 text-center">Delayed</th>
                <th className="p-3 text-center">Delay Rate</th>
                <th className="p-3 text-center">Volunteer</th>
                <th className="p-3 text-center">Turnaround</th>
                <th className="p-3 text-right pr-4">Completion</th>
              </tr>
            </thead>
            <tbody>
              {data.centers.map((c) => (
                <tr key={c.centerId} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                  <td className="p-3 font-semibold text-text-primary">{c.centerName}</td>
                  <td className="p-3 text-text-secondary">{c.city}</td>
                  <td className="p-3 text-center font-medium text-text-secondary">{c.assignedSessions}</td>
                  <td className="p-3 text-center font-medium text-emerald-600">{c.completedSessions}</td>
                  <td className="p-3 text-center">
                    {c.delayedSessions > 0 ? (
                      <span className="font-medium text-rose-600">{c.delayedSessions}</span>
                    ) : (
                      <span className="text-text-muted">0</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {c.delayRate > 0 ? (
                      <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] py-0.5">
                        {c.delayRate}%
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-300 text-emerald-600 bg-emerald-50/50 text-[10px] py-0.5">
                        0%
                      </Badge>
                    )}
                  </td>
                  <td className="p-3 text-center text-text-secondary">
                    {c.volunteerSessions > 0 ? (
                      <span className="text-purple-600 font-medium">{c.volunteerCompleted}/{c.volunteerSessions}</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center text-text-secondary">
                    {c.avgApprovalTurnaroundHours !== null ? (
                      <span className="font-medium">{c.avgApprovalTurnaroundHours}h</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right pr-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${c.completionRate}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-text-primary w-8 text-right">
                        {c.completionRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
