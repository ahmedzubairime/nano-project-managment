/**
 * Session Generation Service
 * Isolated, deterministic session generation logic.
 */

export interface GenerationInput {
  projectId: string;
  activityId: string;
  plannedSessionCount: number;
  startDate: Date;
  endDate: Date;
  centerIds: string[];
}

/**
 * Generates session payloads deterministically and bulk creates them inside a transaction.
 * 
 * - Distributes sessions evenly across participating centers (round-robin).
 * - Spreads sessions across the start/end date range in equal steps.
 * - Same inputs always yield identical schedules (reproducible/deterministic).
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
    `[SessionGenerator] Start generation for activity ${activityId}: count=${plannedSessionCount}, centers=${centerIds.length}, range=${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
  );

  if (plannedSessionCount <= 0) {
    throw new Error("Planned session count must be greater than 0");
  }

  if (centerIds.length === 0) {
    throw new Error("At least one participating center is required for session generation");
  }

  const sessionsToCreate = [];

  // Spread sessions evenly across the available date range
  const rangeMs = endDate.getTime() - startDate.getTime();
  const interval = plannedSessionCount > 1 ? rangeMs / (plannedSessionCount - 1) : 0;

  for (let i = 0; i < plannedSessionCount; i++) {
    // Round-robin center assignment
    const centerId = centerIds[i % centerIds.length];

    // Spaced timestamp
    const scheduledTimestamp = startDate.getTime() + i * interval;
    const scheduledDate = new Date(scheduledTimestamp);

    sessionsToCreate.push({
      projectId,
      activityId,
      centerId,
      scheduledDate,
      status: "PENDING" as const,
      approvalStatus: "NOT_SUBMITTED" as const,
    });
  }

  // Persist all session records under transaction block
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
