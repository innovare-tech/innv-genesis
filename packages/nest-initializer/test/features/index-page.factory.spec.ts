import 'reflect-metadata';
import { createIndexPageController } from '../../src/features/index-page.factory';
import { join } from 'path';
import type { Response } from 'express';

const MOCK_CWD = '/fake/project/root';
jest.spyOn(process, 'cwd').mockReturnValue(MOCK_CWD);

const mockResponse = {
  sendFile: jest.fn(),
} as unknown as Response;

describe('createIndexPageController', () => {
  beforeEach(() => {
    // Limpa os mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('should correctly merge partial options with defaults', () => {
    // Arrange
    const options = {
      path: '/custom-path',
    };

    // Act
    const DynamicController = createIndexPageController(options);

    // Assert Metadata
    const controllerPath = Reflect.getMetadata('path', DynamicController);
    expect(controllerPath).toBe('/custom-path');

    // Assert Runtime Behavior
    const instance = new DynamicController();
    instance.serveIndex(mockResponse);

    // Deve usar 'public' e 'index.html' como padrão
    const expectedPath = join(MOCK_CWD, 'public', 'index.html');
    expect(mockResponse.sendFile).toHaveBeenCalledWith(expectedPath);
  });

  it('should handle custom publicDir and default filename', () => {
    // Arrange
    const options = {
      publicDir: 'www',
    };

    // Act
    const DynamicController = createIndexPageController(options);
    const instance = new DynamicController();
    instance.serveIndex(mockResponse);

    // Assert
    const expectedPath = join(MOCK_CWD, 'www', 'index.html');
    expect(mockResponse.sendFile).toHaveBeenCalledWith(expectedPath);
  });
});
