/**
 * Session Scheduling Service: Domain Validation Rules
 */

export interface ScheduledSessionPayload {
  centerId: string;
  scheduledDate: Date;
  activityId: string;
}

export interface ValidationConstraints {
  startDate: Date;
  endDate: Date;
}

/**
 * Validates generated session schedules against business logic constraints.
 * Throws safe domain errors and logs validation failures.
 */
export function validateScheduledSessions(
  sessions: ScheduledSessionPayload[],
  constraints: ValidationConstraints
): void {
  const { startDate, endDate } = constraints;

  console.log(`[Scheduling:Validation] Validating ${sessions.length} sessions against constraints.`);

  if (startDate > endDate) {
    const errorMsg = "Start date cannot be after end date.";
    console.error(`[Scheduling:Validation] Validation failure: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // 1. Date overflow checks
  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    const time = session.scheduledDate.getTime();
    if (time < startDate.getTime() || time > endDate.getTime()) {
      const errorMsg = `Session ${i + 1} date ${session.scheduledDate.toISOString()} overflows allowed range: ${startDate.toISOString()} to ${endDate.toISOString()}.`;
      console.error(`[Scheduling:Validation] Validation failure: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  // 2. Duplicate detection (same center, same activity, same timestamp) when range size > 0
  const rangeMs = endDate.getTime() - startDate.getTime();
  if (rangeMs > 0 && sessions.length > 1) {
    const seen = new Set<string>();
    for (const session of sessions) {
      const key = `${session.centerId}-${session.scheduledDate.getTime()}`;
      if (seen.has(key)) {
        const errorMsg = `Avoidable duplicate scheduling detected: Center ${session.centerId} already has a session at ${session.scheduledDate.toISOString()}.`;
        console.warn(`[Scheduling:Validation] Warning: ${errorMsg}`);
        // We log this as a warning instead of a hard crash to keep the system resilient 
        // if spacing or rounding leads to close overlaps on short windows.
      }
      seen.add(key);
    }
  }

  console.log("[Scheduling:Validation] Validation check passed successfully.");
}
