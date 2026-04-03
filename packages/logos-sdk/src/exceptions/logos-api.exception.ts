export class LogosApiException extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly responseBody?: any,
  ) {
    super(`[LogosSDK] HTTP ${statusCode}: ${message}`);
    this.name = 'LogosApiException';
  }
}
