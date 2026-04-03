import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BkOrganizationsRepository } from '../repositories/organizations.repository';
import { BkOrganization } from '../schemas/bk-organization.schema';
import { CreateOrganizationDTO } from '../dtos/create-organization.dto';
import { UpdateOrganizationDTO } from '../dtos/update-organization.dto';
import {
  PaginatedQueryResultDTO,
  SearchableQueryParamsDTO,
} from '../../../pagination';

@Injectable()
export class BkOrganizationsService {
  constructor(private readonly orgsRepo: BkOrganizationsRepository) {}

  async create(dto: CreateOrganizationDTO): Promise<BkOrganization> {
    const slug = this.generateSlug(dto.name);

    const existing = await this.orgsRepo.findBySlug(slug);
    if (existing) {
      throw new ConflictException(
        `Já existe uma organização com o slug '${slug}'.`,
      );
    }

    return this.orgsRepo.create({ ...dto, slug });
  }

  async findAll(
    query: SearchableQueryParamsDTO,
  ): Promise<PaginatedQueryResultDTO<BkOrganization>> {
    const filter: Record<string, any> = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { slug: { $regex: query.search, $options: 'i' } },
      ];
    }

    const total = await this.orgsRepo.countDocuments(filter);
    const totalPages = Math.ceil(total / query.limit);

    const data = await this.orgsRepo.find(filter, {
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
    } as PaginatedQueryResultDTO<BkOrganization>;
  }

  async findBySlug(slug: string): Promise<BkOrganization> {
    const org = await this.orgsRepo.findBySlug(slug);
    if (!org) {
      throw new NotFoundException(`Organização '${slug}' não encontrada.`);
    }
    return org;
  }

  async update(
    id: string,
    dto: UpdateOrganizationDTO,
  ): Promise<BkOrganization> {
    const org = await this.orgsRepo.update(id, dto);
    if (!org) {
      throw new NotFoundException('Organização não encontrada.');
    }
    return org;
  }

  async setStatus(id: string, status: string): Promise<BkOrganization> {
    const org = await this.orgsRepo.update(id, { status } as any);
    if (!org) {
      throw new NotFoundException('Organização não encontrada.');
    }
    return org;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
