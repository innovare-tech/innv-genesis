import * as crypto from 'crypto';
import { verifyWebhookSignature } from '../utils/verify-signature';

describe('verifyWebhookSignature', () => {
  const secret = 'my-webhook-secret';
  const body = '{"event":"bot_decision","sessionId":"sess_001"}';

  function generateValidSignature(rawBody: string, sec: string): string {
    return `sha256=${crypto.createHmac('sha256', sec).update(rawBody).digest('hex')}`;
  }

  it('should return true for valid signature', () => {
    const signature = generateValidSignature(body, secret);
    expect(verifyWebhookSignature(body, signature, secret)).toBe(true);
  });

  it('should return false for invalid signature', () => {
    expect(verifyWebhookSignature(body, 'sha256=invalid_hex', secret)).toBe(
      false,
    );
  });

  it('should return false when signature is empty', () => {
    expect(verifyWebhookSignature(body, '', secret)).toBe(false);
  });

  it('should return false when secret is empty', () => {
    const signature = generateValidSignature(body, secret);
    expect(verifyWebhookSignature(body, signature, '')).toBe(false);
  });

  it('should work with Buffer body', () => {
    const bufferBody = Buffer.from(body);
    const signature = generateValidSignature(body, secret);
    expect(verifyWebhookSignature(bufferBody, signature, secret)).toBe(true);
  });
});
