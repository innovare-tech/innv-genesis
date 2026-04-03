import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { ObjectId } from 'mongodb';

@Schema({ collection: 'bk_organization_profiles', timestamps: true })
export class BkOrganizationProfile {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id!: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  organizationId!: ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  roles!: string[];

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const BkOrganizationProfileSchema = SchemaFactory.createForClass(
  BkOrganizationProfile,
);

BkOrganizationProfileSchema.index(
  { organizationId: 1, name: 1 },
  { unique: true, name: 'UQ_BK_PROFILE_ORG_NAME' },
);
