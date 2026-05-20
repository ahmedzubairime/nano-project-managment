/**
 * Session Scheduling Service: Date Allocation & Gap Spacing Heuristics
 */

export interface DateAllocationInput {
  plannedSessionCount: number;
  startDate: Date;
  endDate: Date;
}

/**
 * Calculates evenly spaced scheduling dates within the given start and end date bounds.
 * Ensures strict chronological ordering and implements basic gap distribution spacing.
 */
export function allocateSessionDates(input: DateAllocationInput): Date[] {
  const { plannedSessionCount, startDate, endDate } = input;

  console.log(
    `[Scheduling:DateAllocation] Allocating ${plannedSessionCount} sessions over range ${startDate.toISOString()} to ${endDate.toISOString()}`
  );

  if (plannedSessionCount <= 0) {
    throw new Error("Planned session count must be greater than 0");
  }

  if (startDate > endDate) {
    throw new Error("Start date must be before or equal to end date");
  }

  const allocatedDates: Date[] = [];
  const rangeMs = endDate.getTime() - startDate.getTime();

  if (plannedSessionCount === 1) {
    // If only one session, place it exactly in the middle of the available range
    const midpoint = new Date(startDate.getTime() + rangeMs / 2);
    allocatedDates.push(midpoint);
  } else {
    // Spaced interval
    const interval = rangeMs / (plannedSessionCount - 1);
    for (let i = 0; i < plannedSessionCount; i++) {
      const scheduledTimestamp = startDate.getTime() + i * interval;
      allocatedDates.push(new Date(scheduledTimestamp));
    }
  }

  console.log(
    `[Scheduling:DateAllocation] Allocated ${allocatedDates.length} chronological session dates. Spacing interval: ${(rangeMs / (plannedSessionCount > 1 ? plannedSessionCount - 1 : 1) / (1000 * 60 * 60)).toFixed(1)} hours.`
  );

  return allocatedDates;
}

/**
 * Reusable utility to check if a pending session is overdue.
 */
export function isSessionOverdue(scheduledDate: Date, status: string): boolean {
  if (status !== "PENDING") {
    return false;
  }
  return scheduledDate.getTime() < Date.now();
}

/**
 * Calculates the expected completion window for a session index.
 * Useful for monitoring progress drift.
 */
export function getExpectedCompletionWindow(
  startDate: Date,
  endDate: Date,
  totalCount: number,
  currentIndex: number
): { windowStart: Date; windowEnd: Date } {
  if (totalCount <= 0 || currentIndex < 0 || currentIndex >= totalCount) {
    throw new Error("Invalid session bounds for completion window calculation");
  }

  const rangeMs = endDate.getTime() - startDate.getTime();
  const interval = totalCount > 1 ? rangeMs / (totalCount - 1) : 0;

  const currentScheduledTime = startDate.getTime() + currentIndex * interval;

  // Window starts halfway to the previous session, ends halfway to the next session
  const halfInterval = interval / 2;

  const windowStart = new Date(
    currentIndex === 0 
      ? startDate.getTime() 
      : currentScheduledTime - halfInterval
  );

  const windowEnd = new Date(
    currentIndex === totalCount - 1 
      ? endDate.getTime() 
      : currentScheduledTime + halfInterval
  );

  return { windowStart, windowEnd };
}

/**
 * Compares the scheduled date of a session with its actual completion date.
 * Returns the delay in fractional days (positive = delayed, negative = early/ahead).
 */
export function compareTimeline(scheduledDate: Date, actualDate: Date): number {
  const diffMs = actualDate.getTime() - scheduledDate.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}
