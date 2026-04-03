import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import {
  BaseRepository,
  PaginatedQueryResultDTO,
} from '@innovare-tech/backend-kit';
import { Ticket } from '../schemas/ticket.schema';
import { ListTicketsQueryDTO } from '../dtos/list-tickets-query.dto';

@Injectable()
export class TicketsRepository extends BaseRepository<Ticket> {
  constructor(@InjectModel(Ticket.name) model: Model<Ticket>) {
    super(model);
  }

  async findPaginated(
    organizationId: string,
    query: ListTicketsQueryDTO,
  ): Promise<PaginatedQueryResultDTO<Ticket>> {
    const filter: FilterQuery<Ticket> = { organizationId };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { protocol: { $regex: query.search, $options: 'i' } },
      ];
    }

    const total = await this.countDocuments(filter);
    const totalPages = Math.ceil(total / query.limit);

    const data = await this.model
      .find(filter)
      .sort({
        [query.sortBy || 'createdAt']:
          String(query.sortOrder) === 'ASC' ? 1 : -1,
      })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .exec();

    return {
      data,
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    } as PaginatedQueryResultDTO<Ticket>;
  }
}
