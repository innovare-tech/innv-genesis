import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BkUsersRepository } from '../../auth/repositories/users.repository';
import { BkMembersRepository } from '../../members/repositories/members.repository';
import { BkUser } from '../../auth/schemas/bk-user.schema';
import { BkOrganizationUser } from '../../members/schemas/bk-organization-user.schema';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt');

@Injectable()
export class BkAccountService {
  constructor(
    private readonly usersRepo: BkUsersRepository,
    private readonly membersRepo: BkMembersRepository,
  ) {}

  async getMe(userId: string): Promise<Partial<BkUser>> {
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    const obj = (user as any).toObject ? (user as any).toObject() : { ...user };
    delete obj.password;
    return obj;
  }

  async updateMe(
    userId: string,
    dto: { name?: string; avatarUrl?: string },
  ): Promise<Partial<BkUser>> {
    const user = await this.usersRepo.update(userId, dto);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return user;
  }

  async changePassword(
    userId: string,
    dto: { currentPassword: string; newPassword: string },
  ): Promise<void> {
    const fullUser = await (this.usersRepo as any).model
      .findById(userId)
      .select('+password')
      .exec();

    if (!fullUser) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const isMatch = await bcrypt.compare(
      dto.currentPassword,
      fullUser.password,
    );
    if (!isMatch) {
      throw new BadRequestException('Senha atual incorreta.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepo.update(userId, {
      password: hashedPassword,
      requiresPasswordChange: false,
    } as any);
  }

  async getMyOrganizations(userId: string): Promise<BkOrganizationUser[]> {
    return this.membersRepo.findByUserId(userId);
  }
}
