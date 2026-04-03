import { Type } from '@nestjs/common';

export interface AuthMessages {
  invalidCredentials: string;
  accountNotVerified: string;
  emailAlreadyExists: string;
  userNotFound: string;
  invalidRefreshToken: string;
  passwordResetSuccess: string;
  registrationSuccess: string;
}

export interface AuthFeatureConfig {
  enabled?: boolean;
  enableRegistration?: boolean;
  enableRecovery?: boolean;
  enableVerification?: boolean;
  enableSwitchOrganization?: boolean;
  jwtSecretConfigKey?: string;
  passwordHashRounds?: number;
  accessTokenExpiresIn?: string;
  refreshTokenExpiresIn?: string;
  userExtraFields?: Record<string, any>;
  customController?: Type;
  onBeforeRegister?: (dto: any) => Promise<void> | void;
  onAfterRegister?: (user: any) => Promise<void> | void;
  onBeforeLogin?: (dto: any) => Promise<void> | void;
  onAfterLogin?: (user: any, response: any) => Promise<void> | void;
  onPasswordRecovery?: (email: string, code: string) => Promise<void> | void;
  onVerificationCode?: (email: string, code: string) => Promise<void> | void;
  messages?: Partial<AuthMessages>;
}

export interface UsersFeatureConfig {
  enabled?: boolean;
  customController?: Type;
}

export interface OrganizationsFeatureConfig {
  enabled?: boolean;
  extraFields?: Record<string, any>;
  customController?: Type;
  enableHierarchy?: boolean;
}

export interface MembersFeatureConfig {
  enabled?: boolean;
  extraFields?: Record<string, any>;
  customController?: Type;
  onMemberAdded?: (orgId: string, userId: string) => Promise<void> | void;
  onMemberRemoved?: (orgId: string, userId: string) => Promise<void> | void;
}

export interface InvitesFeatureConfig {
  enabled?: boolean;
  customController?: Type;
  expiresInHours?: number;
  onSendInvite?: (invite: any) => Promise<void> | void;
  onInviteAccepted?: (invite: any, user: any) => Promise<void> | void;
}

export interface ProfilesFeatureConfig {
  enabled?: boolean;
  customController?: Type;
  defaultProfiles?: Array<{ name: string; roles: string[] }>;
}

export interface AccountFeatureConfig {
  enabled?: boolean;
  customController?: Type;
}
