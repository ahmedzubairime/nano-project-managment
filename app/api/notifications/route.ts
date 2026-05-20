import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/types/roles";
import { generateAutoNotifications } from "@/services/notifications/auto-notifications.service";

/**
 * GET /api/notifications
 * Retrieves notifications visible to the authenticated user.
 * Automatically runs auto-notifications check for queried projects to keep alerts up-to-date.
 */
export async function GET(request: Request) {
  try {
    const dbUser = await getOrCreateDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    let projectIds: string[] = [];

    if (projectId) {
      projectIds = [projectId];
      // Trigger dynamic auto-notifications generation for this project
      await generateAutoNotifications(projectId).catch((err) =>
        console.error(`Error auto-generating notifications for project ${projectId}:`, err)
      );
    } else {
      // Find all projects the user is associated with
      if (dbUser.role === Role.PROJECT_MANAGER) {
        const ownedProjects = await prisma.project.findMany({
          where: { ownerId: dbUser.id },
          select: { id: true },
        });
        projectIds = ownedProjects.map((p) => p.id);
      } else if (dbUser.role === Role.CENTER_MANAGER) {
        const managedCenters = await prisma.center.findMany({
          where: { managerId: dbUser.id },
          include: { projectCenters: { select: { projectId: true } } },
        });
        projectIds = Array.from(
          new Set(managedCenters.flatMap((c) => c.projectCenters.map((pc) => pc.projectId)))
        );
      }

      // Trigger auto-notifications generation for each relevant project
      for (const pId of projectIds) {
        await generateAutoNotifications(pId).catch((err) =>
          console.error(`Error auto-generating notifications for project ${pId}:`, err)
        );
      }
    }

    // Base WHERE clause based on roles and projectIds
    const baseWhereClause: any = {
      projectId: projectId ? projectId : { in: projectIds },
    };

    // Apply visibility rules for Center Managers
    if (dbUser.role === Role.CENTER_MANAGER) {
      baseWhereClause.OR = [
        { centers: { none: {} } }, // Project-wide broadcasts
        { centers: { some: { center: { managerId: dbUser.id } } } }, // Specifically targeted at their center
      ];
    }

    // Apply unread-only filter if requested
    const finalWhereClause = { ...baseWhereClause };
    if (unreadOnly) {
      finalWhereClause.reads = { none: { userId: dbUser.id } };
    }

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
      where: finalWhereClause,
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            email: true,
            role: true,
          },
        },
        centers: {
          include: {
            center: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
        },
        reads: {
          where: { userId: dbUser.id },
        },
        session: {
          select: {
            id: true,
            activity: { select: { title: true } },
            center: { select: { name: true } },
          },
        },
      },
    });

    // Calculate unread count (independently of unreadOnly filter)
    const unreadCount = await prisma.notification.count({
      where: {
        ...baseWhereClause,
        reads: { none: { userId: dbUser.id } },
      },
    });

    // Format notifications for response
    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      projectId: n.projectId,
      sessionId: n.sessionId,
      title: n.title,
      message: n.message,
      type: n.type,
      createdAt: n.createdAt,
      read: n.reads.length > 0,
      sender: n.sender
        ? {
            email: n.sender.email,
            role: n.sender.role,
          }
        : null,
      centers: n.centers.map((c) => ({
        id: c.center.id,
        name: c.center.name,
        city: c.center.city,
      })),
      session: n.session
        ? {
            id: n.session.id,
            activityTitle: n.session.activity.title,
            centerName: n.session.center.name,
          }
        : null,
    }));

    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
