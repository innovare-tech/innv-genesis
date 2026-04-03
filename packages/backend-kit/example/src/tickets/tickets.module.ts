import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ticket, TicketSchema } from './schemas/ticket.schema';
import { TicketsRepository } from './repositories/tickets.repository';
import { TicketsService } from './services/tickets.service';
import { TicketsController } from './controllers/tickets.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),
  ],
  controllers: [TicketsController],
  providers: [TicketsRepository, TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
