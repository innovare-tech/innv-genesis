import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { ObjectId } from 'mongodb';

@Schema({ collection: 'bk_password_recoveries', timestamps: true })
export class BkPasswordRecovery {
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

export const BkPasswordRecoverySchema =
  SchemaFactory.createForClass(BkPasswordRecovery);

BkPasswordRecoverySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
