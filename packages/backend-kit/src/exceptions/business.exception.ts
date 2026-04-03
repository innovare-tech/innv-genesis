export abstract class BusinessException extends Error {
  public readonly errorMessage: string;
  public readonly detailedErrorMessage?: string;
  public readonly code: string;
  public readonly logDetailedErrorMessage?: string;

  protected constructor(
    message: string,
    code: string,
    detailedMessage?: string,
    logDetailedErrorMessage?: string,
  ) {
    super(message);
    this.errorMessage = message;
    this.code = code;
    this.detailedErrorMessage = detailedMessage;
    this.logDetailedErrorMessage = logDetailedErrorMessage;
  }
}
