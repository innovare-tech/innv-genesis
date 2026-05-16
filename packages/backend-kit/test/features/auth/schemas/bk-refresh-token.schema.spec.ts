import * as mongoose from 'mongoose';
import {
  BkRefreshToken,
  BkRefreshTokenSchema,
} from '../../../../src/features/auth/schemas/bk-refresh-token.schema';

describe('BkRefreshToken schema', () => {
  const Model = mongoose.model<BkRefreshToken>(
    'BkRefreshTokenTest',
    BkRefreshTokenSchema,
  );

  it('leaves impersonatedBy undefined when not provided', () => {
    const doc = new Model({
      userId: new mongoose.Types.ObjectId(),
      token: 'uuid-1',
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(doc.impersonatedBy).toBeUndefined();
    expect(doc.revoked).toBe(false);
  });

  it('persists impersonatedBy when provided', () => {
    const adminId = '507f1f77bcf86cd799439011';
    const doc = new Model({
      userId: new mongoose.Types.ObjectId(),
      token: 'uuid-2',
      expiresAt: new Date(Date.now() + 60_000),
      impersonatedBy: adminId,
    });
    expect(doc.impersonatedBy).toBe(adminId);
  });
});
