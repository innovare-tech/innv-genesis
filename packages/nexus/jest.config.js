module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts', // Exclui o barril principal
    '!src/**/*.module.ts', // Exclui módulos Nest (testados via integração)
  ],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  // Definimos limites um pouco mais baixos inicialmente, podemos aumentar depois
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  // Aponta para um tsconfig específico para testes (vamos criar a seguir)
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // Confirme que este caminho está correto
        tsconfig: '<rootDir>/test/tsconfig.json',
        // Tente adicionar isolatedModules (pode ajudar com alguns erros de tipo)
        isolatedModules: true, // Adicione esta linha
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup-tests.ts'], // Arquivo de setup (vamos criar)
};
