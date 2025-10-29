import { Module } from '@nestjs/common';
import { NexusHttpService } from './nexus-http.service';

/**
 * @innv/nexus
 * Módulo de integração principal com o NestJS.
 *
 * Ele provisiona o NexusHttpService para ser usado
 * pelos providers de cliente dinâmicos.
 */
@Module({
    providers: [NexusHttpService],
    exports: [NexusHttpService],
})
export class NexusModule {}