import { HttpStatus } from '@nestjs/common';
import { BusinessException, HttpReturnCode } from '@innovare-tech/backend-kit';

@HttpReturnCode(HttpStatus.NOT_FOUND)
export class TicketNotFoundException extends BusinessException {
  constructor(ticketId: string) {
    super(
      'Ticket não encontrado',
      'TICKET_NOT_FOUND',
      `O ticket ${ticketId} não existe.`,
    );
  }
}
