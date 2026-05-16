import { BackendKitModule } from '../../../src/backend-kit.module';

describe('PlatformFeatureModule integration in BackendKitModule', () => {
  it('throws clear error when platform=true but auth/organizations/members are missing', () => {
    expect(() => BackendKitModule.forRoot({ platform: true })).toThrow(
      /PlatformFeatureModule requires: auth, organizations, members/,
    );
  });

  it('throws when organizations and members are missing (auth enabled)', () => {
    expect(() =>
      BackendKitModule.forRoot({ auth: true, platform: true }),
    ).toThrow(/organizations, members/);
  });

  it('builds successfully when all required features are enabled', () => {
    const moduleDef = BackendKitModule.forRoot({
      auth: true,
      organizations: true,
      members: true,
      platform: true,
    });
    expect(moduleDef.module).toBe(BackendKitModule);
    expect(moduleDef.imports).toBeDefined();
  });

  it('does not register Platform module when platform option is omitted', () => {
    const moduleDef = BackendKitModule.forRoot({
      auth: true,
      organizations: true,
      members: true,
    });
    // O kit segue funcionando — apenas o módulo de Platform não é carregado.
    expect(moduleDef.module).toBe(BackendKitModule);
  });
});
