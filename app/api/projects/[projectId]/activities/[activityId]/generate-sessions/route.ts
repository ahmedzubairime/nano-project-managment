import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/types/roles";
import { generateSessionsForActivity } from "@/services/session-generation/generate-sessions";

/**
 * POST /api/projects/[projectId]/activities/[activityId]/generate-sessions
 * Triggers deterministic session generation for an activity.
 * Allowed only if the activity does not have any sessions scheduled yet.
 * Only PROJECT_MANAGER can trigger generation.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; activityId: string }> }
) {
  const { projectId, activityId } = await params;
  try {
    const dbUser = await getOrCreateDbUser();
    if (!dbUser) {
      console.warn(`[SessionGenerationAPI] Validation failed: Unauthenticated request for activity ${activityId}`);
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    if (dbUser.role !== Role.PROJECT_MANAGER) {
      console.warn(`[SessionGenerationAPI] Permission check failed: User ${dbUser.email} is not a PROJECT_MANAGER`);
      return NextResponse.json(
        { error: "Forbidden: Only project managers can generate sessions" },
        { status: 403 }
      );
    }

    // Fetch project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      console.warn(`[SessionGenerationAPI] Validation failed: Project ${projectId} not found`);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Validate project is not archived
    if (project.status === "ARCHIVED") {
      console.warn(`[SessionGenerationAPI] Validation failed: Project ${projectId} is archived/read-only`);
      return NextResponse.json(
        { error: "Validation failed: Archived projects are read-only" },
        { status: 400 }
      );
    }

    // Fetch activity
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        activityCenters: true,
      },
    });

    if (!activity || activity.projectId !== projectId) {
      console.warn(`[SessionGenerationAPI] Validation failed: Activity ${activityId} not found in project ${projectId}`);
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    // Enforce that duplicate generation is prevented
    const sessionCount = await prisma.session.count({
      where: { activityId },
    });

    if (sessionCount > 0) {
      console.warn(`[SessionGenerationAPI] Duplicate prevention: Activity ${activityId} already has ${sessionCount} sessions`);
      return NextResponse.json(
        { error: "Sessions have already been generated for this activity" },
        { status: 400 }
      );
    }

    // Verify participating centers exist
    const centerIds = activity.activityCenters.map((ac) => ac.centerId);
    if (centerIds.length === 0) {
      console.warn(`[SessionGenerationAPI] Validation failed: Activity ${activityId} has no assigned centers`);
      return NextResponse.json(
        { error: "Validation failed: The activity must have at least one participating center" },
        { status: 400 }
      );
    }

    // Determine boundaries: Use activity dates if present, fallback to project dates
    const startDate = activity.startDate || project.startDate;
    const endDate = activity.endDate || project.endDate;

    console.log(
      `[SessionGenerationAPI] Initiating session generation for activity ${activityId}. Spanning range: ${new Date(startDate).toISOString()} to ${new Date(endDate).toISOString()}`
    );

    // Trigger generation inside database transaction context
    const generated = await prisma.$transaction(async (tx) => {
      return generateSessionsForActivity(tx, {
        projectId,
        activityId,
        plannedSessionCount: activity.plannedSessionCount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        centerIds,
      });
    });

    return NextResponse.json({
      message: `Successfully generated ${generated.count} sessions`,
      sessionsCount: generated.count,
      sessions: generated.sessions,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[SessionGenerationAPI] Error executing generation request:", error);
    
    // Catch safe domain errors and return them as Bad Requests (400)
    const isDomainError = error instanceof Error && (
      error.message.includes("Planned session") ||
      error.message.includes("center") ||
      error.message.includes("date") ||
      error.message.includes("bounds") ||
      error.message.includes("overflow") ||
      error.message.includes("duplicate")
    );

    if (isDomainError) {
      console.warn(`[SessionGenerationAPI] Validation failure logged: ${error.message}`);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
