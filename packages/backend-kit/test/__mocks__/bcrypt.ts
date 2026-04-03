export const hash = jest.fn(
  async (password: string, _rounds: number) => `$2b$10$mocked_${password}`,
);

export const compare = jest.fn(
  async (password: string, hashed: string) =>
    hashed === `$2b$10$mocked_${password}` || hashed.includes('hashedpassword'),
);

export default { hash, compare };
