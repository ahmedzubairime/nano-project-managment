import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/types/roles";
import { NotificationType } from "@/app/generated/prisma/enums";

/**
 * POST /api/projects/[projectId]/notifications
 * Creates a manual broadcast announcement from the Project Manager.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const dbUser = await getOrCreateDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // Require PROJECT_MANAGER role
    if (dbUser.role !== Role.PROJECT_MANAGER) {
      return NextResponse.json(
        { error: "Forbidden: Only Project Managers can send manual announcements" },
        { status: 403 }
      );
    }

    // Ensure the project exists and is not archived
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.status === "ARCHIVED") {
      return NextResponse.json(
        { error: "Validation failed: Cannot send announcements for an archived project" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { title, message, centerIds } = body;

    // Validation
    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "Validation failed: Title is required" },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json(
        { error: "Validation failed: Message is required" },
        { status: 400 }
      );
    }

    // Create the announcement notification transactionally
    const announcement = await prisma.$transaction(async (tx) => {
      const notif = await tx.notification.create({
        data: {
          projectId,
          title: title.trim(),
          message: message.trim(),
          type: "ANNOUNCEMENT" as NotificationType,
          senderId: dbUser.id,
        },
      });

      if (centerIds && Array.isArray(centerIds) && centerIds.length > 0) {
        // Target specific centers
        await Promise.all(
          centerIds.map((cId) =>
            tx.notificationCenter.create({
              data: {
                notificationId: notif.id,
                centerId: cId,
              },
            })
          )
        );
      }

      return notif;
    });

    console.log(`[Broadcast API] Successfully sent announcement ${announcement.id} for project ${projectId}`);
    return NextResponse.json(announcement);
  } catch (error: any) {
    console.error("POST /api/projects/[projectId]/notifications error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
