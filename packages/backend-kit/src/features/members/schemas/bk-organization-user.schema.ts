import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { ObjectId } from 'mongodb';

@Schema({ _id: false })
export class BkOrgData {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  id!: ObjectId;

  @Prop({ required: true, trim: true })
  slug!: string;

  @Prop({ required: true, trim: true })
  name!: string;
}

@Schema({ _id: false })
export class BkUserData {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  id!: ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;
}

@Schema({ collection: 'bk_organization_users', timestamps: true })
export class BkOrganizationUser {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id!: ObjectId;

  @Prop({ type: Object, required: true })
  organization!: BkOrgData;

  @Prop({ type: Object, required: true })
  user!: BkUserData;

  @Prop({
    enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
    default: 'ACTIVE',
  })
  status!: string;

  @Prop({ default: false })
  isOwner!: boolean;

  @Prop({ type: SchemaTypes.ObjectId })
  profileId?: ObjectId;

  @Prop({ type: [String], default: [] })
  customRoles!: string[];

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const BkOrganizationUserSchema =
  SchemaFactory.createForClass(BkOrganizationUser);

BkOrganizationUserSchema.index(
  { 'organization.id': 1, 'user.id': 1 },
  { unique: true, name: 'UQ_BK_ORG_USER' },
);
BkOrganizationUserSchema.index(
  { 'organization.id': 1, status: 1 },
  { name: 'IDX_BK_ORG_MEMBERS' },
);
BkOrganizationUserSchema.index(
  { 'user.id': 1, status: 1 },
  { name: 'IDX_BK_MY_ORGS' },
);
