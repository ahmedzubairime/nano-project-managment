import { distributeSessionsAcrossCenters } from "@/services/session-scheduling/distribute-sessions";
import { allocateSessionDates } from "@/services/session-scheduling/date-allocation";
import { validateScheduledSessions } from "@/services/session-scheduling/validation";

export interface GenerationInput {
  projectId: string;
  activityId: string;
  plannedSessionCount: number;
  startDate: Date;
  endDate: Date;
  centerIds: string[];
}

/**
 * Generates session payloads by delegating decisions to the scheduling layer,
 * and bulk creates them inside a transaction.
 */
export async function generateSessionsForActivity(
  tx: any,
  input: GenerationInput
) {
  const {
    projectId,
    activityId,
    plannedSessionCount,
    startDate,
    endDate,
    centerIds,
  } = input;

  console.log(
    `[SessionGenerator] Delegating scheduling decisions for activity ${activityId}: count=${plannedSessionCount}, centers=${centerIds.length}`
  );

  // 1. Distribute centers deterministically using round-robin balancing
  const assignedCenterIds = distributeSessionsAcrossCenters(
    plannedSessionCount,
    centerIds
  );

  // 2. Allocate chronological, spaced dates
  const allocatedDates = allocateSessionDates({
    plannedSessionCount,
    startDate,
    endDate,
  });

  // 3. Construct session payloads
  const sessionsToCreate = [];
  for (let i = 0; i < plannedSessionCount; i++) {
    sessionsToCreate.push({
      projectId,
      activityId,
      centerId: assignedCenterIds[i],
      scheduledDate: allocatedDates[i],
      status: "PENDING" as const,
      approvalStatus: "NOT_SUBMITTED" as const,
    });
  }

  // 4. Enforce date constraints and duplicate prevention rules
  validateScheduledSessions(sessionsToCreate, { startDate, endDate });

  // 5. Bulk create sessions
  const result = await tx.session.createMany({
    data: sessionsToCreate,
  });

  console.log(
    `[SessionGenerator] Successfully generated ${result.count} sessions for activity ${activityId}`
  );

  return {
    count: result.count,
    sessions: sessionsToCreate,
  };
}

