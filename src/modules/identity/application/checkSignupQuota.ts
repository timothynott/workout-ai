import { QUOTA, type QuotaReason } from '../domain/quota';

/**
 * Injected port: returns the current signup counts needed by the quota gate.
 * Defined as a port so `checkSignupQuota` stays pure and unit-testable without
 * booting a real Neon client.
 */
export interface SignupCountPort {
  /** count(*) of user rows created since start of the current UTC day */
  countSinceStartOfDay(): Promise<number>;
  /** count(*) of user rows created in the last 31 days (rolling window) */
  countLastMonth(): Promise<number>;
}

export type SignupQuotaDecision =
  | { allowed: true }
  | { allowed: false; reason: QuotaReason };

/**
 * Returns `{ allowed: false }` if creating one more user row would push the
 * project past its configured daily or monthly signup cap.
 *
 * Daily cap takes precedence when both are exceeded — "try again tomorrow" is
 * a more actionable message than "try again next month" for a user hitting
 * the page now.
 */
export async function checkSignupQuota(
  port: SignupCountPort,
): Promise<SignupQuotaDecision> {
  const [daily, monthly] = await Promise.all([
    port.countSinceStartOfDay(),
    port.countLastMonth(),
  ]);

  if (daily >= QUOTA.daily) return { allowed: false, reason: 'daily_limit' };
  if (monthly >= QUOTA.monthly) return { allowed: false, reason: 'monthly_limit' };
  return { allowed: true };
}
