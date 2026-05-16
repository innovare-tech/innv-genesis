import { BkEvents } from '../../../src/features/events/bk-events';

describe('BkEvents enum', () => {
  it('exposes PLATFORM_IMPERSONATE_STARTED with expected string value', () => {
    expect(BkEvents.PLATFORM_IMPERSONATE_STARTED).toBe(
      'bk.platform.impersonateStarted',
    );
  });

  it('does not collide with existing event values', () => {
    const values = Object.values(BkEvents);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
