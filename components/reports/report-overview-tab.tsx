"use client";

import * as React from "react";
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ActivityBreakdown {
  activityId: string;
  activityTitle: string;
  isVolunteer: boolean;
  totalSessions: number;
  completedSessions: number;
  delayedSessions: number;
  completionPercentage: number;
}

interface OverviewData {
  totalSessions: number;
  completedSessions: number;
  delayedSessions: number;
  cancelledSessions: number;
  pendingSessions: number;
  coreCompletionPercentage: number;
  volunteerCompletionPercentage: number;
  approvedCount: number;
  rejectedCount: number;
  pendingApprovalCount: number;
  approvalRate: number;
  activityBreakdown: ActivityBreakdown[];
  documentedSessionsCount: number;
  missingDocumentationCount: number;
  documentationRate: number;
}


export function ReportOverviewTab({ data }: { data: OverviewData }) {
  return (
    <div className="space-y-6">
      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BarChart3 className="size-5 text-primary" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">Total Sessions</span>
            <span className="text-2xl font-bold text-text-primary">{data.totalSessions}</span>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">Completed</span>
            <span className="text-2xl font-bold text-text-primary">{data.completedSessions}</span>
            <span className="text-[10px] text-emerald-600 font-medium ml-1">({data.coreCompletionPercentage}%)</span>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="size-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-5 text-rose-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">Delayed</span>
            <span className="text-2xl font-bold text-text-primary">{data.delayedSessions}</span>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <TrendingUp className="size-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">Approval Rate</span>
            <span className="text-2xl font-bold text-text-primary">{data.approvalRate}%</span>
          </div>
        </div>
      </div>

      {/* Approval Efficiency Panel */}
      <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-2 border-b border-border/40">
          Approval Efficiency
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted block">Approved</span>
              <span className="text-lg font-bold text-text-primary">{data.approvedCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-rose-500/5 border border-rose-500/15 rounded-lg p-3">
            <XCircle className="size-5 text-rose-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted block">Rejected</span>
              <span className="text-lg font-bold text-text-primary">{data.rejectedCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/15 rounded-lg p-3">
            <Clock className="size-5 text-amber-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted block">Pending</span>
              <span className="text-lg font-bold text-text-primary">{data.pendingApprovalCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Documentation Compliance Panel */}
      <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Documentation Evidence & Compliance
          </h3>
          <Badge
            variant="outline"
            className={`text-[10px] font-bold uppercase py-0.5 px-2 border ${
              data.documentationRate >= 90
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : data.documentationRate >= 70
                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                : "bg-rose-500/10 text-rose-600 border-rose-500/20"
            }`}
          >
            {data.documentationRate}% Compliant
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 bg-muted/40 border border-border/60 rounded-lg p-3">
            <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <BarChart3 className="size-4 text-primary" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted block">Documented Sessions</span>
              <span className="text-base font-bold text-text-primary">{data.documentedSessionsCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
            <div className="size-8 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-4 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted block">Compliance Rate</span>
              <span className="text-base font-bold text-text-primary">{data.documentationRate}%</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-rose-500/5 border border-rose-500/15 rounded-lg p-3">
            <div className="size-8 rounded-md bg-rose-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-4 text-rose-600" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted block">Missing Evidence</span>
              <span className="text-base font-bold text-text-primary">{data.missingDocumentationCount}</span>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        {data.missingDocumentationCount > 0 && (
          <div className="border border-rose-500/20 bg-rose-500/5 rounded-lg p-3 text-xs text-rose-600 flex items-start gap-2.5 shadow-sm">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">Missing Documentation Warning</strong>
              <span>
                There are {data.missingDocumentationCount} completed sessions that lack Google Drive documentation. 
                Branches must attach evidence folders/files to maintain auditing compliance.
              </span>
            </div>
          </div>
        )}
      </div>


      {/* Activity Breakdown Table */}
      <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-2 border-b border-border/40">
          Activity-Level Breakdown
        </h3>
        {data.activityBreakdown.length === 0 ? (
          <p className="text-xs text-text-muted italic py-4 text-center">No activities found in the current report scope.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border/80 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="p-3">Activity</th>
                  <th className="p-3 text-center">Type</th>
                  <th className="p-3 text-center">Sessions</th>
                  <th className="p-3 text-center">Completed</th>
                  <th className="p-3 text-center">Delayed</th>
                  <th className="p-3 text-right pr-4">Completion</th>
                </tr>
              </thead>
              <tbody>
                {data.activityBreakdown.map((act) => (
                  <tr key={act.activityId} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                    <td className="p-3 font-semibold text-text-primary truncate max-w-[200px]">{act.activityTitle}</td>
                    <td className="p-3 text-center">
                      <Badge className={`text-[9px] px-1.5 py-0.5 border ${act.isVolunteer ? "bg-purple-500/10 text-purple-600 border-purple-500/20" : "bg-primary/10 text-primary border-primary/20"}`}>
                        {act.isVolunteer ? "Volunteer" : "Core"}
                      </Badge>
                    </td>
                    <td className="p-3 text-center font-medium text-text-secondary">{act.totalSessions}</td>
                    <td className="p-3 text-center font-medium text-emerald-600">{act.completedSessions}</td>
                    <td className="p-3 text-center font-medium text-rose-600">{act.delayedSessions}</td>
                    <td className="p-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${act.completionPercentage}%` }} />
                        </div>
                        <span className="text-[11px] font-semibold text-text-primary w-8 text-right">{act.completionPercentage}%</span>
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
