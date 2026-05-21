"use client";

import * as React from "react";
import { Calendar, AlertTriangle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface WeeklyBucket {
  weekLabel: string;
  weekStart: string;
  totalSessions: number;
  completedSessions: number;
  overdueSessions: number;
}

interface TimelineData {
  weeklyBuckets: WeeklyBucket[];
  bottleneckWeeks: string[];
  totalOverdue: number;
  totalScheduled: number;
}

export function ReportTimelineTab({ data }: { data: TimelineData }) {
  // Filter out empty weeks for cleaner visualization
  const activeWeeks = data.weeklyBuckets.filter((w) => w.totalSessions > 0);

  if (data.totalScheduled === 0) {
    return (
      <div className="py-16 flex flex-col items-center text-center">
        <Calendar className="size-12 text-text-muted/40 mb-3" />
        <span className="text-sm font-semibold text-text-secondary">No timeline data available</span>
        <p className="text-xs text-text-muted max-w-xs mt-1">No sessions match the current filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="size-5 text-primary" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">Active Weeks</span>
            <span className="text-2xl font-bold text-text-primary">{activeWeeks.length}</span>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="size-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-5 text-rose-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">Total Overdue</span>
            <span className="text-2xl font-bold text-text-primary">{data.totalOverdue}</span>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <TrendingUp className="size-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">Bottleneck Weeks</span>
            <span className="text-2xl font-bold text-text-primary">{data.bottleneckWeeks.length}</span>
          </div>
        </div>
      </div>

      {/* Execution Density Chart */}
      <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-2 border-b border-border/40">
          Weekly Execution Density
        </h3>
        {activeWeeks.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeWeeks} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  interval="preserveStartEnd"
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                  labelStyle={{ fontWeight: 600, color: "var(--text-primary)" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
                <Bar
                  dataKey="totalSessions"
                  name="Scheduled"
                  fill="var(--chart-1)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="completedSessions"
                  name="Completed"
                  fill="var(--chart-2)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="overdueSessions"
                  name="Overdue"
                  fill="var(--status-delayed)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-text-muted italic py-6 text-center">No weekly activity data to display.</p>
        )}
      </div>

      {/* Bottleneck Periods */}
      {data.bottleneckWeeks.length > 0 && (
        <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-2 border-b border-border/40 flex items-center gap-2">
            <AlertTriangle className="size-4 text-rose-500" />
            Bottleneck Periods
          </h3>
          <p className="text-xs text-text-muted">
            The following weeks have the highest concentration of overdue sessions and may require schedule adjustments:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {data.bottleneckWeeks.map((week) => (
              <Badge
                key={week}
                variant="destructive"
                className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[11px] px-2.5 py-1"
              >
                {week}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Breakdown Table */}
      <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-2 border-b border-border/40">
          Weekly Session Distribution
        </h3>
        <div className="overflow-x-auto rounded-lg border border-border/60 max-h-[320px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/40 border-b border-border/80 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                <th className="p-3">Week</th>
                <th className="p-3 text-center">Scheduled</th>
                <th className="p-3 text-center">Completed</th>
                <th className="p-3 text-center">Overdue</th>
                <th className="p-3 text-right pr-4">Density</th>
              </tr>
            </thead>
            <tbody>
              {data.weeklyBuckets
                .filter((w) => w.totalSessions > 0)
                .map((w) => {
                  const maxTotal = Math.max(...activeWeeks.map((a) => a.totalSessions), 1);
                  const barWidth = Math.round((w.totalSessions / maxTotal) * 100);
                  return (
                    <tr key={w.weekStart} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                      <td className="p-3 font-medium text-text-primary text-[11px]">{w.weekLabel}</td>
                      <td className="p-3 text-center font-medium text-text-secondary">{w.totalSessions}</td>
                      <td className="p-3 text-center font-medium text-emerald-600">{w.completedSessions}</td>
                      <td className="p-3 text-center">
                        {w.overdueSessions > 0 ? (
                          <span className="font-medium text-rose-600">{w.overdueSessions}</span>
                        ) : (
                          <span className="text-text-muted">0</span>
                        )}
                      </td>
                      <td className="p-3 text-right pr-4">
                        <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden ml-auto">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
