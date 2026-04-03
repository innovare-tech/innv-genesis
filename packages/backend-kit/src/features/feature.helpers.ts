import { SchemaFactory } from '@nestjs/mongoose';
import { Type } from '@nestjs/common';
import { Schema } from 'mongoose';

export function createExtensibleSchema<T>(
  schemaClass: Type<T>,
  extraFields?: Record<string, any>,
): Schema {
  const schema = SchemaFactory.createForClass(schemaClass);
  if (extraFields) {
    schema.add(extraFields as any);
  }
  return schema;
}

export function isEnabled(
  option: boolean | { enabled?: boolean } | undefined,
): boolean {
  if (option === undefined || option === null) return false;
  if (typeof option === 'boolean') return option;
  return option.enabled !== false;
}

export function normalizeFeatureOption<T extends { enabled?: boolean }>(
  option: T | boolean | undefined,
  defaults?: Partial<T>,
): T {
  if (option === undefined || option === false) {
    return { ...defaults, enabled: false } as T;
  }
  if (option === true) {
    return { ...defaults, enabled: true } as T;
  }
  return { ...defaults, ...option, enabled: option.enabled !== false } as T;
}
