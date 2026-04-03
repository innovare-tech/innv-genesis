export interface ITenantResolver<TTenant = any> {
  resolve(
    tenantIdentifier: string,
    userId: string,
  ): Promise<{ tenant: TTenant; tenantUser?: any }>;
}
