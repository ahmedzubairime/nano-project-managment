/**
 * Session Scheduling Service: Center Distribution
 */

/**
 * Distributes planned sessions across center IDs using a balanced round-robin strategy.
 * 
 * - Ensures center allocation differs by at most 1 session.
 * - Always yields the exact same center assignment order for the same inputs (deterministic).
 */
export function distributeSessionsAcrossCenters(
  plannedSessionCount: number,
  centerIds: string[]
): string[] {
  console.log(
    `[Scheduling:Distribution] Distributing ${plannedSessionCount} sessions across ${centerIds.length} centers.`
  );

  if (plannedSessionCount <= 0) {
    throw new Error("Planned session count must be greater than 0");
  }
  if (!centerIds || centerIds.length === 0) {
    throw new Error("At least one participating center is required for session distribution");
  }

  const assignedCenterIds: string[] = [];
  
  // Sort center IDs to guarantee absolute determinism regardless of input order
  const sortedCenterIds = [...centerIds].sort();

  for (let i = 0; i < plannedSessionCount; i++) {
    const centerId = sortedCenterIds[i % sortedCenterIds.length];
    assignedCenterIds.push(centerId);
  }

  // Summarize allocation for logging
  const allocationCounts: Record<string, number> = {};
  for (const cid of assignedCenterIds) {
    allocationCounts[cid] = (allocationCounts[cid] || 0) + 1;
  }

  console.log(
    `[Scheduling:Distribution] Decisions completed. Balancing results:`,
    JSON.stringify(allocationCounts)
  );

  return assignedCenterIds;
}
