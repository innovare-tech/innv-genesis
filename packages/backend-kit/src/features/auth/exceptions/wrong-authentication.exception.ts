import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../../../exceptions/business.exception';
import { HttpReturnCode } from '../../../exceptions/http-return-code.decorator';

@HttpReturnCode(HttpStatus.UNAUTHORIZED)
export class WrongAuthenticationException extends BusinessException {
  constructor(logMessage: string, userMessage?: string) {
    super(
      userMessage ?? 'E-mail ou senha inválidos.',
      'WRONG_AUTHENTICATION',
      userMessage,
      logMessage,
    );
  }
}
