import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, Public } from '../../src/decorators/public.decorator';
import { ROLES_KEY, Roles } from '../../src/decorators/roles.decorator';

describe('@Public()', () => {
  it('should set IS_PUBLIC_KEY metadata to true', () => {
    @Public()
    class TestController {}

    const reflector = new Reflector();
    const isPublic = reflector.get<boolean>(IS_PUBLIC_KEY, TestController);

    expect(isPublic).toBe(true);
  });
});

describe('@Roles()', () => {
  it('should set ROLES_KEY metadata with provided roles', () => {
    class TestController {
      @Roles('admin', 'editor')
      handler() {}
    }

    const reflector = new Reflector();
    const roles = reflector.get<string[]>(
      ROLES_KEY,
      new TestController().handler,
    );

    expect(roles).toEqual(['admin', 'editor']);
  });

  it('should set empty array when no roles provided', () => {
    class TestController {
      @Roles()
      handler() {}
    }

    const reflector = new Reflector();
    const roles = reflector.get<string[]>(
      ROLES_KEY,
      new TestController().handler,
    );

    expect(roles).toEqual([]);
  });
});
