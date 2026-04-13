export type DomainEvent<T extends string, P extends Record<string, unknown>> = {
  readonly eventType: T;
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly payload: P;
};

export const createEvent = <T extends string, P extends Record<string, unknown>>(
  eventType: T,
  payload: P,
): DomainEvent<T, P> => ({
  eventType,
  eventId: crypto.randomUUID(),
  occurredAt: new Date(),
  payload,
});
