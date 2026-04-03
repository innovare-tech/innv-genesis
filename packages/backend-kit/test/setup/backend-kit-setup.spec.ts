import { setupBackendKit } from '../../src/setup/backend-kit-setup';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';
import { GlobalExceptionFilter } from '../../src/filters/global-exception.filter';

describe('setupBackendKit', () => {
  let mockApp: Record<string, jest.Mock>;

  beforeEach(() => {
    mockApp = {
      useGlobalGuard: jest.fn().mockReturnThis(),
      useGlobalFilter: jest.fn().mockReturnThis(),
      withValidationPipe: jest.fn().mockReturnThis(),
      withResponseMapper: jest.fn().mockReturnThis(),
    };
  });

  it('should enable all features by default', () => {
    setupBackendKit(mockApp as any);

    expect(mockApp.useGlobalGuard).toHaveBeenCalledWith(JwtAuthGuard);
    expect(mockApp.useGlobalGuard).toHaveBeenCalledWith(RolesGuard);
    expect(mockApp.useGlobalFilter).toHaveBeenCalledWith(GlobalExceptionFilter);
    expect(mockApp.withResponseMapper).toHaveBeenCalledTimes(1);
    expect(mockApp.withValidationPipe).toHaveBeenCalledTimes(1);
  });

  it('should disable auth when auth: false', () => {
    setupBackendKit(mockApp as any, { auth: false });

    expect(mockApp.useGlobalGuard).not.toHaveBeenCalledWith(JwtAuthGuard);
    expect(mockApp.useGlobalGuard).toHaveBeenCalledWith(RolesGuard);
  });

  it('should disable rbac when rbac: false', () => {
    setupBackendKit(mockApp as any, { rbac: false });

    expect(mockApp.useGlobalGuard).toHaveBeenCalledWith(JwtAuthGuard);
    expect(mockApp.useGlobalGuard).not.toHaveBeenCalledWith(RolesGuard);
  });

  it('should disable exception filter when exceptionFilter: false', () => {
    setupBackendKit(mockApp as any, { exceptionFilter: false });

    expect(mockApp.useGlobalFilter).not.toHaveBeenCalled();
  });

  it('should disable response mapper when responseMapper: false', () => {
    setupBackendKit(mockApp as any, { responseMapper: false });

    expect(mockApp.withResponseMapper).not.toHaveBeenCalled();
  });

  it('should disable validation when validation: false', () => {
    setupBackendKit(mockApp as any, { validation: false });

    expect(mockApp.withValidationPipe).not.toHaveBeenCalled();
  });

  it('should disable everything when all set to false', () => {
    setupBackendKit(mockApp as any, {
      auth: false,
      rbac: false,
      exceptionFilter: false,
      responseMapper: false,
      validation: false,
    });

    expect(mockApp.useGlobalGuard).not.toHaveBeenCalled();
    expect(mockApp.useGlobalFilter).not.toHaveBeenCalled();
    expect(mockApp.withResponseMapper).not.toHaveBeenCalled();
    expect(mockApp.withValidationPipe).not.toHaveBeenCalled();
  });

  it('should pass custom validation options', () => {
    setupBackendKit(mockApp as any, {
      validation: { enabled: true, whitelist: false, transform: false },
    });

    expect(mockApp.withValidationPipe).toHaveBeenCalledWith(
      expect.objectContaining({
        whitelist: false,
        transform: false,
        forbidNonWhitelisted: true,
      }),
    );
  });

  it('should use custom response mapper when provided', () => {
    const customMapper = (data: unknown) => ({ custom: true, data });
    setupBackendKit(mockApp as any, {
      responseMapper: { enabled: true, mapper: customMapper },
    });

    expect(mockApp.withResponseMapper).toHaveBeenCalledWith(customMapper);
  });

  it('should use default ResponseData mapper when no custom mapper', () => {
    setupBackendKit(mockApp as any, { responseMapper: true });

    const mapperFn = mockApp.withResponseMapper.mock.calls[0][0];
    const result = mapperFn({ id: 1 });

    expect(result.successful).toBe(true);
    expect(result.data).toEqual({ id: 1 });
  });

  it('should return the app builder for chaining', () => {
    const result = setupBackendKit(mockApp as any);

    expect(result).toBe(mockApp);
  });
});
