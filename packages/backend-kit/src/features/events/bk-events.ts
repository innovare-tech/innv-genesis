export enum BkEvents {
  // Auth
  BEFORE_LOGIN = 'bk.auth.beforeLogin',
  AFTER_LOGIN = 'bk.auth.afterLogin',
  BEFORE_REGISTER = 'bk.auth.beforeRegister',
  AFTER_REGISTER = 'bk.auth.afterRegister',
  AFTER_REFRESH_TOKEN = 'bk.auth.afterRefreshToken',
  PASSWORD_RECOVERY_REQUESTED = 'bk.auth.passwordRecoveryRequested',
  PASSWORD_RESET = 'bk.auth.passwordReset',
  VERIFICATION_CODE_SENT = 'bk.auth.verificationCodeSent',
  EMAIL_VERIFIED = 'bk.auth.emailVerified',
  ORGANIZATION_SWITCHED = 'bk.auth.organizationSwitched',

  // Users
  USER_UPDATED = 'bk.users.updated',
  USER_STATUS_CHANGED = 'bk.users.statusChanged',

  // Organizations
  ORGANIZATION_CREATED = 'bk.organizations.created',
  ORGANIZATION_UPDATED = 'bk.organizations.updated',
  ORGANIZATION_STATUS_CHANGED = 'bk.organizations.statusChanged',

  // Profiles
  PROFILE_CREATED = 'bk.profiles.created',
  PROFILE_UPDATED = 'bk.profiles.updated',
  PROFILE_REMOVED = 'bk.profiles.removed',

  // Members
  MEMBER_ADDED = 'bk.members.added',
  MEMBER_REMOVED = 'bk.members.removed',
  MEMBER_RBAC_UPDATED = 'bk.members.rbacUpdated',

  // Invites
  INVITE_SENT = 'bk.invites.sent',
  INVITE_ACCEPTED = 'bk.invites.accepted',

  // Account
  ACCOUNT_UPDATED = 'bk.account.updated',
  PASSWORD_CHANGED = 'bk.account.passwordChanged',
}

export interface BkEventPayload<T = any> {
  timestamp: Date;
  data: T;
}

export function createBkEvent<T>(data: T): BkEventPayload<T> {
  return { timestamp: new Date(), data };
}
