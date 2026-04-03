import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { ObjectId } from 'mongodb';

@Schema({ collection: 'bk_organizations', timestamps: true })
export class BkOrganization {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id!: ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ trim: true })
  document?: string;

  @Prop({ enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  status!: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ lowercase: true, trim: true })
  email?: string;

  @Prop({ type: Object })
  parent?: { id: ObjectId; name: string };

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const BkOrganizationSchema =
  SchemaFactory.createForClass(BkOrganization);

BkOrganizationSchema.index(
  { slug: 1 },
  { unique: true, name: 'UQ_BK_ORG_SLUG' },
);
BkOrganizationSchema.index({ name: 1 }, { name: 'IDX_BK_ORG_NAME' });
