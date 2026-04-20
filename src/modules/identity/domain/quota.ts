/**
 * Signup quota constants (see ADR-014).
 *
 * These limits exist to protect Resend's free-tier email quota
 * (100/day, 3,000/month at time of writing). Update them in one place
 * when the Resend plan changes.
 */
export const QUOTA = {
  daily: 100,
  monthly: 3000,
} as const;

export type QuotaReason = 'daily_limit' | 'monthly_limit';

/** Machine-readable codes surfaced on `APIError` when a signup is blocked. */
export const QUOTA_ERROR_CODE = {
  daily_limit: 'DAILY_LIMIT',
  monthly_limit: 'MONTHLY_LIMIT',
} as const;

/** User-facing fallback copy. Client may override via AuthUIProvider localization. */
export const QUOTA_ERROR_MESSAGE: Record<QuotaReason, string> = {
  daily_limit:
    "We've hit today's signup limit. Please try again tomorrow.",
  monthly_limit:
    'Signups are paused for this month. Please try again next month.',
};
