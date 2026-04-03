import { Injectable, NotFoundException } from '@nestjs/common';
import { BkUsersRepository } from '../../auth/repositories/users.repository';
import { BkUser } from '../../auth/schemas/bk-user.schema';
import {
  PaginatedQueryResultDTO,
  SearchableQueryParamsDTO,
} from '../../../pagination';

@Injectable()
export class BkUsersService {
  constructor(private readonly usersRepo: BkUsersRepository) {}

  async findAll(
    query: SearchableQueryParamsDTO,
  ): Promise<PaginatedQueryResultDTO<BkUser>> {
    const filter: Record<string, any> = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    const total = await this.usersRepo.countDocuments(filter);
    const totalPages = Math.ceil(total / query.limit);

    const data = await this.usersRepo.find(filter, {
      sort: {
        [query.sortBy || 'createdAt']:
          String(query.sortOrder) === 'ASC' ? 1 : -1,
      },
      skip: (query.page - 1) * query.limit,
      limit: query.limit,
    });

    return {
      data,
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    } as PaginatedQueryResultDTO<BkUser>;
  }

  async findById(id: string): Promise<BkUser> {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return user;
  }

  async update(id: string, dto: Partial<BkUser>): Promise<BkUser> {
    const user = await this.usersRepo.update(id, dto);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return user;
  }

  async setStatus(id: string, status: string): Promise<BkUser> {
    const user = await this.usersRepo.update(id, { status } as any);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return user;
  }
}
