import 'reflect-metadata';
import { Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as glob from 'glob';
import { discoverComponents } from '../../src/core/auto-discovery.helper';
import { API_CLIENT_META_KEY } from '@innv/nexus';

class MockController {}
class MockProvider {}
class MockApiClient {}
class NonDecoratedClass {}

jest.mock('glob', () => ({
  globSync: jest.fn(),
}));

describe('discoverComponents', () => {
  let mockGlobSync: jest.SpyInstance;
  let mockReflector: Reflector;
  let mockReflectorGet: jest.Mock;
  let mockRequire: jest.Mock;

  beforeEach(() => {
    mockGlobSync = jest.spyOn(glob, 'globSync');

    mockReflectorGet = jest.fn(
      (metadataKey: string | symbol, target: Type<any>) => {
        if (metadataKey === 'path' && target === MockController) return '/mock';
        if (metadataKey === '__injectable__' && target === MockProvider)
          return true;
        if (metadataKey === API_CLIENT_META_KEY && target === MockApiClient)
          return { baseUrl: 'http://test.com' };
        return undefined;
      },
    );
    mockReflector = { get: mockReflectorGet } as unknown as Reflector;

    mockRequire = jest.fn((request: string) => {
      if (request === '/fake/path/controller.js') return { MockController };
      if (request === '/fake/path/provider.js') return { MockProvider };
      if (request === '/fake/path/api-client.js') return { MockApiClient };
      if (request === '/fake/path/mixed.js')
        return { MockController, MockProvider, MockApiClient };
      if (request === '/fake/path/non-decorated.js')
        return { NonDecoratedClass };
      if (request === '/fake/path/non-class.js') return { configValue: 123 };
      if (request === '/fake/path/error.js')
        throw new Error('Mock require error');
      return {};
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty arrays when no files are found', () => {
    mockGlobSync.mockReturnValue([]);
    const result = discoverComponents('/base', mockReflector, mockRequire);
    expect(result).toEqual({
      providers: [],
      controllers: [],
      nexusClients: [],
    });
    expect(mockGlobSync).toHaveBeenCalledWith(
      '/base/**/*.{ts,js}',
      expect.any(Object),
    );
    expect(mockRequire).not.toHaveBeenCalled();
  });

  it('should discover controllers correctly', () => {
    mockGlobSync.mockReturnValue(['/fake/path/controller.js']);
    const result = discoverComponents('/base', mockReflector, mockRequire);

    expect(result.providers).toEqual([]);
    expect(result.controllers).toEqual([MockController]);
    expect(result.nexusClients).toEqual([]);
    expect(mockRequire).toHaveBeenCalledWith('/fake/path/controller.js');
    expect(mockReflectorGet).toHaveBeenCalledWith('path', MockController);
  });

  it('should discover providers correctly', () => {
    mockGlobSync.mockReturnValue(['/fake/path/provider.js']);
    const result = discoverComponents('/base', mockReflector, mockRequire);

    expect(result.providers).toEqual([MockProvider]);
    expect(result.controllers).toEqual([]);
    expect(result.nexusClients).toEqual([]);
    expect(mockRequire).toHaveBeenCalledWith('/fake/path/provider.js');
    expect(mockReflectorGet).toHaveBeenCalledWith('path', MockProvider);
    expect(mockReflectorGet).toHaveBeenCalledWith(
      '__injectable__',
      MockProvider,
    );
  });

  it('should discover nexus clients correctly', () => {
    mockGlobSync.mockReturnValue(['/fake/path/api-client.js']);
    const result = discoverComponents('/base', mockReflector, mockRequire);

    expect(result.providers).toEqual([]);
    expect(result.controllers).toEqual([]);
    expect(result.nexusClients).toEqual([MockApiClient]);
    expect(mockRequire).toHaveBeenCalledWith('/fake/path/api-client.js');
    expect(mockReflectorGet).toHaveBeenCalledWith('path', MockApiClient);
    expect(mockReflectorGet).toHaveBeenCalledWith(
      '__injectable__',
      MockApiClient,
    );
    expect(mockReflectorGet).toHaveBeenCalledWith(
      API_CLIENT_META_KEY,
      MockApiClient,
    );
  });

  it('should discover all component types in the same file', () => {
    mockGlobSync.mockReturnValue(['/fake/path/mixed.js']);
    const result = discoverComponents('/base', mockReflector, mockRequire);

    expect(result.providers).toEqual([MockProvider]);
    expect(result.controllers).toEqual([MockController]);
    expect(result.nexusClients).toEqual([MockApiClient]);
    expect(mockRequire).toHaveBeenCalledWith('/fake/path/mixed.js');
  });

  it('should ignore non-decorated classes', () => {
    mockGlobSync.mockReturnValue(['/fake/path/non-decorated.js']);
    const result = discoverComponents('/base', mockReflector, mockRequire);

    expect(result.providers).toEqual([]);
    expect(result.controllers).toEqual([]);
    expect(result.nexusClients).toEqual([]);
    expect(mockRequire).toHaveBeenCalledWith('/fake/path/non-decorated.js');
    expect(mockReflectorGet).toHaveBeenCalledWith('path', NonDecoratedClass);
    expect(mockReflectorGet).toHaveBeenCalledWith(
      '__injectable__',
      NonDecoratedClass,
    );
    expect(mockReflectorGet).toHaveBeenCalledWith(
      API_CLIENT_META_KEY,
      NonDecoratedClass,
    );
  });

  it('should ignore non-class exports', () => {
    mockGlobSync.mockReturnValue(['/fake/path/non-class.js']);
    const result = discoverComponents('/base', mockReflector, mockRequire);

    expect(result.providers).toEqual([]);
    expect(result.controllers).toEqual([]);
    expect(result.nexusClients).toEqual([]);
    expect(mockRequire).toHaveBeenCalledWith('/fake/path/non-class.js');
    expect(mockReflectorGet).not.toHaveBeenCalled();
  });

  it('should handle errors during require and continue processing other files', () => {
    mockGlobSync.mockReturnValue([
      '/fake/path/error.js',
      '/fake/path/provider.js',
    ]);
    const result = discoverComponents('/base', mockReflector, mockRequire);

    expect(result.providers).toEqual([MockProvider]);
    expect(result.controllers).toEqual([]);
    expect(result.nexusClients).toEqual([]);
    expect(mockRequire).toHaveBeenCalledWith('/fake/path/error.js');
    expect(mockRequire).toHaveBeenCalledWith('/fake/path/provider.js');
  });

  it('should use the ignore patterns provided to globSync', () => {
    discoverComponents('/base', mockReflector, mockRequire);
    expect(mockGlobSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        ignore: expect.arrayContaining([
          '**/*.module.{ts,js}',
          '**/*.spec.{ts,js}',
          '**/node_modules/**',
          '**/features/**',
          '**/plugins/**',
        ]),
        absolute: true,
      }),
    );
  });
});
