import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { ObjectId } from 'mongodb';

@Schema({ collection: 'bk_organization_invites', timestamps: true })
export class BkOrganizationInvite {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id!: ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  organizationId!: ObjectId;

  @Prop({ required: true })
  organizationName!: string;

  @Prop({ required: true })
  organizationSlug!: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  invitedBy!: ObjectId;

  @Prop({ required: true, unique: true })
  token!: string;

  @Prop({ type: SchemaTypes.ObjectId })
  profileId?: ObjectId;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop()
  createdAt!: Date;
}

export const BkOrganizationInviteSchema =
  SchemaFactory.createForClass(BkOrganizationInvite);

BkOrganizationInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
BkOrganizationInviteSchema.index({ email: 1 });
BkOrganizationInviteSchema.index({ token: 1 }, { unique: true });
