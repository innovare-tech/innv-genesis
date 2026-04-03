import { Injectable } from '@nestjs/common';
import { PaginatedQueryResultDTO } from '@innovare-tech/backend-kit';
import { TicketsRepository } from '../repositories/tickets.repository';
import { Ticket, TicketStatus } from '../schemas/ticket.schema';
import { CreateTicketDTO } from '../dtos/create-ticket.dto';
import { UpdateTicketDTO } from '../dtos/update-ticket.dto';
import { ListTicketsQueryDTO } from '../dtos/list-tickets-query.dto';
import { TicketNotFoundException } from '../exceptions/ticket-not-found.exception';

@Injectable()
export class TicketsService {
  constructor(private readonly ticketsRepo: TicketsRepository) {}

  async create(
    organizationId: string,
    dto: CreateTicketDTO,
    userId: string,
  ): Promise<Ticket> {
    const protocol = `TK-${Date.now().toString(36).toUpperCase()}`;

    return this.ticketsRepo.create({
      organizationId,
      title: dto.title,
      description: dto.description,
      status: TicketStatus.OPEN,
      createdBy: userId,
      protocol,
    });
  }

  async findAll(
    organizationId: string,
    query: ListTicketsQueryDTO,
  ): Promise<PaginatedQueryResultDTO<Ticket>> {
    return this.ticketsRepo.findPaginated(organizationId, query);
  }

  async findById(organizationId: string, id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepo.findOne({ _id: id, organizationId });

    if (!ticket) {
      throw new TicketNotFoundException(id);
    }

    return ticket;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateTicketDTO,
  ): Promise<Ticket> {
    const ticket = await this.findById(organizationId, id);
    return this.ticketsRepo.update(
      ticket._id as string,
      dto,
    ) as Promise<Ticket>;
  }

  async remove(organizationId: string, id: string): Promise<Ticket> {
    const ticket = await this.findById(organizationId, id);
    return this.ticketsRepo.delete(ticket._id as string) as Promise<Ticket>;
  }

  async getStatusCounts(organizationId: string) {
    const [open, inProgress, closed] = await Promise.all([
      this.ticketsRepo.countDocuments({
        organizationId,
        status: TicketStatus.OPEN,
      }),
      this.ticketsRepo.countDocuments({
        organizationId,
        status: TicketStatus.IN_PROGRESS,
      }),
      this.ticketsRepo.countDocuments({
        organizationId,
        status: TicketStatus.CLOSED,
      }),
    ]);

    return { open, inProgress, closed, total: open + inProgress + closed };
  }
}
