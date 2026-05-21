"use client";

import * as React from "react";
import { Sparkles, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VolunteerCenterMetric {
  centerId: string;
  centerName: string;
  city: string;
  volunteerSessions: number;
  volunteerCompleted: number;
  completionRate: number;
}

interface VolunteerData {
  totalVolunteerSessions: number;
  completedVolunteerSessions: number;
  overallCompletionRate: number;
  centerBreakdown: VolunteerCenterMetric[];
}

export function ReportVolunteerTab({ data }: { data: VolunteerData }) {
  if (data.totalVolunteerSessions === 0) {
    return (
      <div className="py-16 flex flex-col items-center text-center">
        <Sparkles className="size-12 text-text-muted/40 mb-3" />
        <span className="text-sm font-semibold text-text-secondary">No volunteer activities</span>
        <p className="text-xs text-text-muted max-w-xs mt-1">
          No volunteer activities have been registered for this project scope.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
            <Sparkles className="size-5 text-purple-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">Total Volunteer</span>
            <span className="text-2xl font-bold text-text-primary">{data.totalVolunteerSessions}</span>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Sparkles className="size-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">Completed</span>
            <span className="text-2xl font-bold text-text-primary">{data.completedVolunteerSessions}</span>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider mb-2">Completion Rate</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-text-primary">{data.overallCompletionRate}%</span>
            <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${data.overallCompletionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Center Volunteer Engagement Table */}
      <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-2 border-b border-border/40 flex items-center gap-2">
          <Building2 className="size-4 text-purple-500" />
          Center Volunteer Engagement
        </h3>
        {data.centerBreakdown.length === 0 ? (
          <p className="text-xs text-text-muted italic py-4 text-center">No center-level volunteer data available.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border/80 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="p-3">Center</th>
                  <th className="p-3">City</th>
                  <th className="p-3 text-center">Sessions</th>
                  <th className="p-3 text-center">Completed</th>
                  <th className="p-3 text-right pr-4">Completion</th>
                </tr>
              </thead>
              <tbody>
                {data.centerBreakdown.map((c) => (
                  <tr key={c.centerId} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                    <td className="p-3 font-semibold text-text-primary">{c.centerName}</td>
                    <td className="p-3 text-text-secondary">{c.city}</td>
                    <td className="p-3 text-center font-medium text-purple-600">{c.volunteerSessions}</td>
                    <td className="p-3 text-center font-medium text-emerald-600">{c.volunteerCompleted}</td>
                    <td className="p-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-purple-500 h-full rounded-full transition-all"
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
        )}
      </div>
    </div>
  );
}
