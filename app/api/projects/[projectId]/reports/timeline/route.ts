import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/types/roles";
import { getTimelineReport, type ReportFilters } from "@/services/reports/reports.service";

/**
 * GET /api/projects/[projectId]/reports/timeline
 * Returns timeline health data with weekly execution density, overdue trends, and bottleneck analysis.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const dbUser = await getOrCreateDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    if (dbUser.role !== Role.PROJECT_MANAGER && dbUser.role !== Role.VIEWER) {
      return NextResponse.json(
        { error: "Forbidden: Only project managers and viewers can access reports" },
        { status: 403 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const filters: ReportFilters = {
      dateFrom: url.searchParams.get("dateFrom") || undefined,
      dateTo: url.searchParams.get("dateTo") || undefined,
      centerId: url.searchParams.get("centerId") || undefined,
      activityId: url.searchParams.get("activityId") || undefined,
      approvalStatus: url.searchParams.get("approvalStatus") || undefined,
      volunteerOnly: url.searchParams.get("volunteerOnly") === "true",
    };

    const report = await getTimelineReport(projectId, filters);
    return NextResponse.json(report);
  } catch (error: unknown) {
    console.error("GET /api/projects/[projectId]/reports/timeline error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
