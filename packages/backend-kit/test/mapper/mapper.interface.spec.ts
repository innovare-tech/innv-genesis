import { IAsyncMapper, IMapper } from '../../src';

describe('IMapper', () => {
  it('should allow a concrete sync mapper implementation', () => {
    class StringToNumberMapper implements IMapper<string, number> {
      map(input: string): number {
        return parseInt(input, 10);
      }
    }

    const mapper = new StringToNumberMapper();
    expect(mapper.map('123')).toBe(123);
    expect(mapper.map('0')).toBe(0);
    expect(mapper.map('-5')).toBe(-5);
  });

  it('should allow mapping between complex types', () => {
    type UserEntity = { firstName: string; lastName: string };
    type UserDTO = { fullName: string };

    class UserMapper implements IMapper<UserEntity, UserDTO> {
      map(input: UserEntity): UserDTO {
        return { fullName: `${input.firstName} ${input.lastName}` };
      }
    }

    const mapper = new UserMapper();
    const result = mapper.map({ firstName: 'João', lastName: 'Silva' });
    expect(result.fullName).toBe('João Silva');
  });
});

describe('IAsyncMapper', () => {
  it('should allow a concrete async mapper implementation', async () => {
    class StringToNumberAsyncMapper implements IAsyncMapper<string, number> {
      async map(input: string): Promise<number> {
        return await Promise.resolve(parseInt(input, 10));
      }
    }

    const mapper = new StringToNumberAsyncMapper();
    const result = await mapper.map('123');
    expect(result).toBe(123);
  });

  it('should allow async mapping with simulated I/O', async () => {
    type RawData = { id: string };
    type EnrichedData = { id: string; enriched: boolean };

    class EnrichMapper implements IAsyncMapper<RawData, EnrichedData> {
      async map(input: RawData): Promise<EnrichedData> {
        return await Promise.resolve({ ...input, enriched: true });
      }
    }

    const mapper = new EnrichMapper();
    const result = await mapper.map({ id: 'abc' });
    expect(result.id).toBe('abc');
    expect(result.enriched).toBe(true);
  });
});
