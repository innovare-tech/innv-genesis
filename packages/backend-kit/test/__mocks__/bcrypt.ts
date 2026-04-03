export const hash = jest.fn((password: string, _rounds: number) =>
  Promise.resolve(`$2b$10$mocked_${password}`),
);

export const compare = jest.fn((password: string, hashed: string) =>
  Promise.resolve(
    hashed === `$2b$10$mocked_${password}` || hashed.includes('hashedpassword'),
  ),
);

export default { hash, compare };
