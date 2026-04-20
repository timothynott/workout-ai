import { describe, expect, it } from 'vitest';
import { QUOTA } from '../domain/quota';
import { checkSignupQuota, type SignupCountPort } from './checkSignupQuota';

const port = (daily: number, monthly: number): SignupCountPort => ({
  countSinceStartOfDay: async () => daily,
  countLastMonth: async () => monthly,
});

describe('checkSignupQuota', () => {
  it('allows when both counts are below cap', async () => {
    const decision = await checkSignupQuota(port(0, 0));
    expect(decision).toEqual({ allowed: true });
  });

  it('allows when counts are just under cap', async () => {
    const decision = await checkSignupQuota(
      port(QUOTA.daily - 1, QUOTA.monthly - 1),
    );
    expect(decision).toEqual({ allowed: true });
  });

  it('blocks with daily_limit when daily count reaches cap', async () => {
    const decision = await checkSignupQuota(port(QUOTA.daily, 0));
    expect(decision).toEqual({ allowed: false, reason: 'daily_limit' });
  });

  it('blocks with monthly_limit when monthly count reaches cap', async () => {
    const decision = await checkSignupQuota(port(0, QUOTA.monthly));
    expect(decision).toEqual({ allowed: false, reason: 'monthly_limit' });
  });

  it('prefers daily_limit when both caps are exceeded', async () => {
    const decision = await checkSignupQuota(
      port(QUOTA.daily, QUOTA.monthly),
    );
    expect(decision).toEqual({ allowed: false, reason: 'daily_limit' });
  });
});
