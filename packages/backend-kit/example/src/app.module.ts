import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { BackendKitModule } from '@innovare-tech/backend-kit';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGO_URI', 'mongodb://localhost:27017/bk-example'),
      }),
    }),
    JwtModule.register({ global: true, signOptions: { algorithm: 'HS512' } }),

    // Backend Kit V2 — tudo configurado em uma chamada
    BackendKitModule.forRoot({
      jwt: { jwtSecretConfigKey: 'JWT_SECRET' },
      auth: {
        enableVerification: false,
        onAfterRegister: (user) =>
          console.log('[BK] User registered:', user.email),
      },
      users: true,
      organizations: true,
      profiles: { defaultProfiles: [{ name: 'Admin', roles: ['*'] }] },
      members: true,
      invites: {
        onSendInvite: (inv) => console.log('[BK] Invite:', inv.email),
      },
      account: true,
    }),
  ],
})
export class AppModule {}
