import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import {
  createExtensibleSchema,
  isEnabled,
  normalizeFeatureOption,
} from '../../src/features/feature.helpers';

@Schema()
class TestDoc {
  @Prop({ required: true })
  name: string;
}

describe('createExtensibleSchema', () => {
  it('should return schema without extraFields', () => {
    const schema = createExtensibleSchema(TestDoc);
    expect(schema).toBeDefined();
    expect(schema.path('name')).toBeDefined();
  });

  it('should add extraFields to schema via schema.add()', () => {
    const schema = createExtensibleSchema(TestDoc, { phone: String });
    expect(schema.path('name')).toBeDefined();
    expect(schema.path('phone')).toBeDefined();
  });

  it('should add multiple extraFields', () => {
    const schema = createExtensibleSchema(TestDoc, {
      phone: String,
      age: Number,
      active: { type: Boolean, default: true },
    });
    expect(schema.path('phone')).toBeDefined();
    expect(schema.path('age')).toBeDefined();
    expect(schema.path('active')).toBeDefined();
  });
});

describe('isEnabled', () => {
  it('should return true for true', () => {
    expect(isEnabled(true)).toBe(true);
  });

  it('should return false for false', () => {
    expect(isEnabled(false)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isEnabled(undefined)).toBe(false);
  });

  it('should return true for { enabled: true }', () => {
    expect(isEnabled({ enabled: true })).toBe(true);
  });

  it('should return false for { enabled: false }', () => {
    expect(isEnabled({ enabled: false })).toBe(false);
  });

  it('should return true for object without enabled (defaults to true)', () => {
    expect(isEnabled({ customController: class {} })).toBe(true);
  });
});

describe('normalizeFeatureOption', () => {
  it('should return { enabled: true } for true', () => {
    const result = normalizeFeatureOption(true);
    expect(result.enabled).toBe(true);
  });

  it('should return { enabled: false } for false', () => {
    const result = normalizeFeatureOption(false);
    expect(result.enabled).toBe(false);
  });

  it('should return { enabled: false } for undefined', () => {
    const result = normalizeFeatureOption(undefined);
    expect(result.enabled).toBe(false);
  });

  it('should preserve config fields and set enabled true', () => {
    const result = normalizeFeatureOption({
      enabled: true,
      extraFields: { phone: String },
    });
    expect(result.enabled).toBe(true);
    expect((result as any).extraFields).toEqual({ phone: String });
  });

  it('should apply defaults when provided', () => {
    const result = normalizeFeatureOption(true, {
      enableRegistration: true,
      enableRecovery: false,
    } as any);
    expect(result.enabled).toBe(true);
    expect((result as any).enableRegistration).toBe(true);
    expect((result as any).enableRecovery).toBe(false);
  });

  it('should override defaults with provided config', () => {
    const result = normalizeFeatureOption(
      { enabled: true, enableRecovery: true } as any,
      { enableRecovery: false } as any,
    );
    expect(result.enableRecovery).toBe(true);
  });
});
