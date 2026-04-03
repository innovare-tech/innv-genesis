import {
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  TenantController,
  TenantContext,
  AuthenticatedUser,
  Roles,
  PaginatedQueryResultDTO,
} from '@innovare-tech/backend-kit';
import { TicketsService } from '../services/tickets.service';
import { CreateTicketDTO } from '../dtos/create-ticket.dto';
import { UpdateTicketDTO } from '../dtos/update-ticket.dto';
import { ListTicketsQueryDTO } from '../dtos/list-tickets-query.dto';
import { Ticket } from '../schemas/ticket.schema';

@ApiTags('Tickets')
@TenantController({ path: 'tickets', version: '1' })
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Roles('create_ticket')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo ticket' })
  @ApiResponse({ status: 201, description: 'Ticket criado com sucesso.' })
  create(
    @TenantContext('_id') orgId: string,
    @Body() dto: CreateTicketDTO,
    @AuthenticatedUser('sub') userId: string,
  ): Promise<Ticket> {
    return this.ticketsService.create(orgId, dto, userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar tickets com paginação e busca' })
  findAll(
    @TenantContext('_id') orgId: string,
    @Query() query: ListTicketsQueryDTO,
  ): Promise<PaginatedQueryResultDTO<Ticket>> {
    return this.ticketsService.findAll(orgId, query);
  }

  @Get('status-counts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Contagem de tickets por status' })
  getStatusCounts(@TenantContext('_id') orgId: string) {
    return this.ticketsService.getStatusCounts(orgId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter ticket por ID' })
  @ApiParam({ name: 'id', description: 'ID do ticket (ObjectId)' })
  findById(
    @TenantContext('_id') orgId: string,
    @Param('id') id: string,
  ): Promise<Ticket> {
    return this.ticketsService.findById(orgId, id);
  }

  @Put(':id')
  @Roles('edit_ticket')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar ticket' })
  @ApiParam({ name: 'id', description: 'ID do ticket (ObjectId)' })
  update(
    @TenantContext('_id') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTicketDTO,
  ): Promise<Ticket> {
    return this.ticketsService.update(orgId, id, dto);
  }

  @Delete(':id')
  @Roles('delete_ticket')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover ticket' })
  @ApiParam({ name: 'id', description: 'ID do ticket (ObjectId)' })
  remove(
    @TenantContext('_id') orgId: string,
    @Param('id') id: string,
  ): Promise<Ticket> {
    return this.ticketsService.remove(orgId, id);
  }
}
