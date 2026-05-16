import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { ObjectId } from 'mongodb';

@Schema({ collection: 'bk_users', timestamps: true })
export class BkUser {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id!: ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  status!: string;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop()
  avatarUrl?: string;

  @Prop({ default: false })
  requiresPasswordChange!: boolean;

  /**
   * Privilégio global de Platform Admin (ortogonal ao RBAC por-tenant).
   * Quando true, libera acesso aos endpoints /platform/* via
   * PlatformAdminGuard. Default false em todos os usuários.
   */
  @Prop({ default: false })
  isPlatformAdmin!: boolean;

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}
