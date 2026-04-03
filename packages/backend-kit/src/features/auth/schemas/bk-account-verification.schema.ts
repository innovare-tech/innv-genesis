import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { ObjectId } from 'mongodb';

@Schema({ collection: 'bk_account_verifications', timestamps: true })
export class BkAccountVerification {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id!: ObjectId;

  @Prop({ required: true, lowercase: true, index: true })
  email!: string;

  @Prop({ required: true })
  code!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: false })
  used!: boolean;

  @Prop()
  createdAt!: Date;
}

export const BkAccountVerificationSchema = SchemaFactory.createForClass(
  BkAccountVerification,
);

BkAccountVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
