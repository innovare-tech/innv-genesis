import * as mongoose from 'mongoose';
import { SchemaFactory } from '@nestjs/mongoose';
import { BkUser } from '../../../../src/features/auth/schemas/bk-user.schema';

describe('BkUser schema', () => {
  const schema = SchemaFactory.createForClass(BkUser);
  // Modelo offline (sem conexão) só para checar defaults e validações.
  const Model = mongoose.model('BkUserTest', schema);

  it('defaults isPlatformAdmin to false when not provided', () => {
    const doc = new Model({
      name: 'Kelvin',
      email: 'kelvin@test.com',
      password: 'hashed',
    });
    expect(doc.isPlatformAdmin).toBe(false);
  });

  it('respects isPlatformAdmin=true when explicitly set', () => {
    const doc = new Model({
      name: 'Kelvin',
      email: 'kelvin@test.com',
      password: 'hashed',
      isPlatformAdmin: true,
    });
    expect(doc.isPlatformAdmin).toBe(true);
  });
});
