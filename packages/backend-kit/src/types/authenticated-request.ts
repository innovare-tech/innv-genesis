import { Request } from 'express';

export interface AuthenticatedRequest<
  TUser = Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _TTenant = Record<string, any>,
> extends Request {
  user?: TUser;
  currentToken?: string;
  [key: string]: any;
}
