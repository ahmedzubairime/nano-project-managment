import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/app/generated/prisma/enums";

/**
 * Automatically inspects the sessions in a project and generates internal notifications
 * for overdue sessions and upcoming session deadlines.
 * This is designed to be idempotent and run on-demand (e.g., when notifications are requested or the dashboard is loaded).
 */
export async function generateAutoNotifications(projectId: string): Promise<void> {
  const now = new Date();

  // Define date thresholds
  const upcomingThreshold = new Date();
  upcomingThreshold.setDate(now.getDate() + 3); // 3 days in the future

  try {
    // Check if the project is archived
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { status: true },
    });

    if (!project || project.status === "ARCHIVED") {
      return;
    }
    // 1. Fetch active sessions (excluding completed/cancelled) for the project
    const sessions = await prisma.session.findMany({
      where: {
        projectId,
        NOT: {
          status: { in: ["COMPLETED", "CANCELLED"] },
        },
      },
      include: {
        activity: {
          select: {
            title: true,
          },
        },
        center: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (sessions.length === 0) return;

    for (const session of sessions) {
      const scheduledDate = new Date(session.scheduledDate);
      const isOverdue = scheduledDate < now;
      const isUpcoming = scheduledDate >= now && scheduledDate <= upcomingThreshold;

      // Format date for notification messages in both English and Arabic
      const formattedDateEn = scheduledDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const formattedDateAr = scheduledDate.toLocaleDateString("ar-EG", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      if (isOverdue) {
        // Check if an overdue notification (type DELAY) already exists for this session
        const existingDelayNotification = await prisma.notification.findFirst({
          where: {
            sessionId: session.id,
            type: "DELAY" as NotificationType,
          },
        });

        if (!existingDelayNotification) {
          // Create overdue alert transactionally
          await prisma.$transaction(async (tx) => {
            const notif = await tx.notification.create({
              data: {
                projectId,
                sessionId: session.id,
                title: JSON.stringify({
                  en: "Session Overdue",
                  ar: "جلسة متأخرة",
                }),
                message: JSON.stringify({
                  en: `The session for "${session.activity.title}" at "${session.center.name}" is overdue (scheduled for ${formattedDateEn}).`,
                  ar: `الجلسة الخاصة بـ "${session.activity.title}" في "${session.center.name}" متأخرة (كانت مجدولة في ${formattedDateAr}).`,
                }),
                type: "DELAY" as NotificationType,
              },
            });

            await tx.notificationCenter.create({
              data: {
                notificationId: notif.id,
                centerId: session.centerId,
              },
            });
          });
          console.log(`[Auto-Notification] Created overdue alert for session ${session.id}`);
        }
      } else if (isUpcoming) {
        // Check if an upcoming notification (type DEADLINE) already exists for this session
        const existingUpcomingNotification = await prisma.notification.findFirst({
          where: {
            sessionId: session.id,
            type: "DEADLINE" as NotificationType,
          },
        });

        if (!existingUpcomingNotification) {
          // Create upcoming reminder transactionally
          await prisma.$transaction(async (tx) => {
            const notif = await tx.notification.create({
              data: {
                projectId,
                sessionId: session.id,
                title: JSON.stringify({
                  en: "Upcoming Session",
                  ar: "جلسة قادمة",
                }),
                message: JSON.stringify({
                  en: `The session for "${session.activity.title}" at "${session.center.name}" is scheduled for ${formattedDateEn}.`,
                  ar: `الجلسة الخاصة بـ "${session.activity.title}" في "${session.center.name}" مجدولة في ${formattedDateAr}.`,
                }),
                type: "DEADLINE" as NotificationType,
              },
            });

            await tx.notificationCenter.create({
              data: {
                notificationId: notif.id,
                centerId: session.centerId,
              },
            });
          });
          console.log(`[Auto-Notification] Created upcoming reminder for session ${session.id}`);
        }
      }
    }
  } catch (error) {
    console.error(`[Auto-Notification] Error generating notifications for project ${projectId}:`, error);
  }
}
