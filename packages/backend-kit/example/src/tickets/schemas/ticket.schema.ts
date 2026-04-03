import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
}

@Schema({ timestamps: true })
export class Ticket extends Document {
  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Prop()
  assignedTo?: string;

  @Prop({ required: true })
  createdBy: string;

  @Prop()
  protocol?: string;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
