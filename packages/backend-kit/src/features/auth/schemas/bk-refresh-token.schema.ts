import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { ObjectId } from 'mongodb';

@Schema({ collection: 'bk_refresh_tokens', timestamps: true })
export class BkRefreshToken {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id!: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  userId!: ObjectId;

  @Prop({ required: true, unique: true })
  token!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: false })
  revoked!: boolean;

  @Prop()
  createdAt!: Date;
}

export const BkRefreshTokenSchema =
  SchemaFactory.createForClass(BkRefreshToken);

BkRefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
