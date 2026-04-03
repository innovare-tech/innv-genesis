import { ConflictException } from '@nestjs/common';
import { BkSignUpService } from '../../../src/features/auth/services/sign-up.service';
import { BkUsersRepository } from '../../../src/features/auth/repositories/users.repository';
import { AuthFeatureConfig } from '../../../src/features/feature.interfaces';

describe('BkSignUpService', () => {
  let service: BkSignUpService;
  let usersRepo: Partial<BkUsersRepository>;
  let verificationModel: any;
  let config: AuthFeatureConfig;

  beforeEach(() => {
    usersRepo = {
      findByEmailWithoutPassword: jest.fn(),
      create: jest.fn().mockResolvedValue({
        _id: { toHexString: () => 'new-user-id' },
        name: 'Test',
        email: 'test@test.com',
      }),
    };

    verificationModel = {
      create: jest.fn().mockResolvedValue({}),
    };

    config = { enabled: true, enableVerification: true };

    const mockEventEmitter = { emit: jest.fn() };

    service = new BkSignUpService(
      usersRepo as any,
      verificationModel,
      mockEventEmitter as any,
      config,
    );
  });

  it('should create user with hashed password', async () => {
    (usersRepo.findByEmailWithoutPassword as jest.Mock).mockResolvedValue(null);

    const result = await service.execute({
      name: 'Test',
      email: 'test@test.com',
      password: 'password123',
    });

    expect(result.message).toBeDefined();
    expect(usersRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test',
        email: 'test@test.com',
        password: expect.any(String),
      }),
    );

    const createCall = (usersRepo.create as jest.Mock).mock.calls[0][0];
    expect(createCall.password).not.toBe('password123');
  });

  it('should throw ConflictException when email already exists', async () => {
    (usersRepo.findByEmailWithoutPassword as jest.Mock).mockResolvedValue({
      email: 'test@test.com',
    });

    await expect(
      service.execute({
        name: 'Test',
        email: 'test@test.com',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should call onAfterRegister callback', async () => {
    const onAfterRegister = jest.fn();
    config.onAfterRegister = onAfterRegister;
    (usersRepo.findByEmailWithoutPassword as jest.Mock).mockResolvedValue(null);

    await service.execute({
      name: 'Test',
      email: 'test@test.com',
      password: 'password123',
    });

    expect(onAfterRegister).toHaveBeenCalledTimes(1);
  });

  it('should create verification code when enableVerification is true', async () => {
    (usersRepo.findByEmailWithoutPassword as jest.Mock).mockResolvedValue(null);

    await service.execute({
      name: 'Test',
      email: 'test@test.com',
      password: 'password123',
    });

    expect(verificationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@test.com',
        code: expect.any(String),
      }),
    );
  });

  it('should call onVerificationCode callback with code', async () => {
    const onVerificationCode = jest.fn();
    config.onVerificationCode = onVerificationCode;
    (usersRepo.findByEmailWithoutPassword as jest.Mock).mockResolvedValue(null);

    await service.execute({
      name: 'Test',
      email: 'test@test.com',
      password: 'password123',
    });

    expect(onVerificationCode).toHaveBeenCalledWith(
      'test@test.com',
      expect.any(String),
    );
  });
});
