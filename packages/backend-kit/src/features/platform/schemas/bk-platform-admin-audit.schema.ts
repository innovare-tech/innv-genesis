import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * Snapshot persistente de toda impersonação iniciada por um Platform
 * Admin. A coleção é append-only e **não tem TTL** — auditoria é
 * permanente. Indexada por admin/target/org para suportar as 3
 * consultas mais comuns.
 */
@Schema({ collection: 'bk_platform_admin_audit', timestamps: true })
export class BkPlatformAdminAudit {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id!: ObjectId;

  @Prop({ required: true, index: true })
  adminUserId!: string;

  @Prop({ required: true })
  adminEmail!: string;

  @Prop({ required: true, index: true })
  targetUserId!: string;

  @Prop({ required: true })
  targetEmail!: string;

  @Prop({ required: true, index: true })
  targetOrgId!: string;

  @Prop({ required: true })
  targetOrgName!: string;

  @Prop()
  targetRole?: string;

  @Prop({ required: true })
  startedAt!: Date;

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const BkPlatformAdminAuditSchema =
  SchemaFactory.createForClass(BkPlatformAdminAudit);

BkPlatformAdminAuditSchema.index(
  { adminUserId: 1, startedAt: -1 },
  { name: 'IDX_BK_PLATFORM_AUDIT_ADMIN' },
);
BkPlatformAdminAuditSchema.index(
  { targetUserId: 1, startedAt: -1 },
  { name: 'IDX_BK_PLATFORM_AUDIT_TARGET' },
);
BkPlatformAdminAuditSchema.index(
  { targetOrgId: 1, startedAt: -1 },
  { name: 'IDX_BK_PLATFORM_AUDIT_ORG' },
);
