import { BkPlatformAuditListener } from '../../../src/features/platform/services/platform-audit.listener';
import { createBkEvent } from '../../../src/features/events/bk-events';

describe('BkPlatformAuditListener', () => {
  let repo: any;
  let listener: BkPlatformAuditListener;

  beforeEach(() => {
    repo = {
      create: jest.fn().mockResolvedValue({}),
    };
    listener = new BkPlatformAuditListener(repo);
  });

  it('persists a snapshot doc with all event fields', async () => {
    const payload = createBkEvent({
      adminUserId: 'admin-1',
      adminEmail: 'admin@test.com',
      targetUserId: 'target-1',
      targetEmail: 'target@test.com',
      targetOrgId: 'org-1',
      targetOrgName: 'Acme',
      targetRole: 'MANAGER',
    });

    await listener.handle(payload);

    expect(repo.create).toHaveBeenCalledTimes(1);
    const arg = repo.create.mock.calls[0][0];
    expect(arg).toMatchObject({
      adminUserId: 'admin-1',
      adminEmail: 'admin@test.com',
      targetUserId: 'target-1',
      targetEmail: 'target@test.com',
      targetOrgId: 'org-1',
      targetOrgName: 'Acme',
      targetRole: 'MANAGER',
    });
    expect(arg.startedAt).toBeInstanceOf(Date);
  });

  it('swallows errors from repository (audit failure must not break impersonation)', async () => {
    repo.create.mockRejectedValueOnce(new Error('mongo down'));

    const payload = createBkEvent({
      adminUserId: 'admin-1',
      adminEmail: 'admin@test.com',
      targetUserId: 'target-1',
      targetEmail: 'target@test.com',
      targetOrgId: 'org-1',
      targetOrgName: 'Acme',
    });

    await expect(listener.handle(payload)).resolves.toBeUndefined();
  });
});
