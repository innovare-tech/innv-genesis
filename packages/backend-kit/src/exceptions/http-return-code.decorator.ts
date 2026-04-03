import { CustomDecorator, HttpStatus, SetMetadata } from '@nestjs/common';

export const HTTP_RETURN_CODE_KEY = 'httpReturnCode';

export const HttpReturnCode = (status: HttpStatus): CustomDecorator =>
  SetMetadata(HTTP_RETURN_CODE_KEY, status);
