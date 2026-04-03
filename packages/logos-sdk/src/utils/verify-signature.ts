import * as crypto from 'crypto';

export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret) return false;

  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;

  if (expected.length !== signature.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}
