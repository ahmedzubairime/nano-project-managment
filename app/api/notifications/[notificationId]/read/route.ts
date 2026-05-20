import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/notifications/[notificationId]/read
 * Marks a notification as read for the authenticated user by upserting a NotificationRead record.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await params;
    const dbUser = await getOrCreateDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // Ensure the notification exists
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Record the read action (using upsert to avoid duplicate keys if marked twice)
    await prisma.notificationRead.upsert({
      where: {
        notificationId_userId: {
          notificationId,
          userId: dbUser.id,
        },
      },
      create: {
        notificationId,
        userId: dbUser.id,
      },
      update: {}, // Nothing to update if already read
    });

    console.log(`[Notification API] Marked notification ${notificationId} as read for user ${dbUser.email}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/notifications/[notificationId]/read error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
