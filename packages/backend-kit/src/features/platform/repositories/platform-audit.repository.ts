import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../repository/base.repository';
import { BkPlatformAdminAudit } from '../schemas/bk-platform-admin-audit.schema';

@Injectable()
export class BkPlatformAuditRepository extends BaseRepository<BkPlatformAdminAudit> {
  constructor(
    @InjectModel(BkPlatformAdminAudit.name)
    model: Model<BkPlatformAdminAudit>,
  ) {
    super(model);
  }
}
