import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LOGOS_OPTIONS } from '../logos.constants';
import { LogosModuleOptions } from '../interfaces/logos-config.interface';
import { verifyWebhookSignature } from '../utils/verify-signature';

@Injectable()
export class LogosWebhookGuard implements CanActivate {
  constructor(
    @Inject(LOGOS_OPTIONS) private readonly options: LogosModuleOptions,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.options.webhookSecret) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-webhook-signature'] as string;
    const body =
      typeof request.body === 'string'
        ? request.body
        : JSON.stringify(request.body);

    if (!signature) {
      throw new UnauthorizedException('Missing X-Webhook-Signature header');
    }

    const isValid = verifyWebhookSignature(
      body,
      signature,
      this.options.webhookSecret,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }
}
