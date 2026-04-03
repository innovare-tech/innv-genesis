import { ResponseData } from '../../src/response/response-data';

describe('ResponseData', () => {
  describe('builder - successful', () => {
    it('should build a successful response with data', () => {
      const result = ResponseData.builder()
        .successful()
        .withData('hello')
        .build();

      expect(result.successful).toBe(true);
      expect(result.data).toBe('hello');
      expect(result.errorMessage).toBeUndefined();
      expect(result.detailedErrorMessage).toBeUndefined();
    });

    it('should build a successful response with object data', () => {
      const result = ResponseData.builder<{ id: number; name: string }>()
        .successful()
        .withData({ id: 1, name: 'Test' })
        .build();

      expect(result.successful).toBe(true);
      expect(result.data).toEqual({ id: 1, name: 'Test' });
    });

    it('should default to successful when no explicit call', () => {
      const result = ResponseData.builder().build();

      expect(result.successful).toBe(true);
    });
  });

  describe('builder - unsuccessful', () => {
    it('should build an unsuccessful response with error messages', () => {
      const result = ResponseData.builder()
        .unsuccessful()
        .withErrorMessage('Erro de validação')
        .withDetailedErrorMessage('O campo email é obrigatório')
        .build();

      expect(result.successful).toBe(false);
      expect(result.errorMessage).toBe('Erro de validação');
      expect(result.detailedErrorMessage).toBe('O campo email é obrigatório');
      expect(result.data).toBeUndefined();
    });

    it('should allow chaining in any order', () => {
      const result = ResponseData.builder()
        .withErrorMessage('Erro')
        .withData(null)
        .unsuccessful()
        .withDetailedErrorMessage('Detalhe')
        .build();

      expect(result.successful).toBe(false);
      expect(result.errorMessage).toBe('Erro');
      expect(result.detailedErrorMessage).toBe('Detalhe');
      expect(result.data).toBeNull();
    });
  });

  describe('builder - type safety', () => {
    it('should support generic typed data', () => {
      type Ticket = { id: string; protocol: string };

      const result = ResponseData.builder<Ticket>()
        .successful()
        .withData({ id: '123', protocol: 'ABC' })
        .build();

      expect(result.data!.id).toBe('123');
      expect(result.data!.protocol).toBe('ABC');
    });

    it('should support array data', () => {
      const result = ResponseData.builder<number[]>()
        .successful()
        .withData([1, 2, 3])
        .build();

      expect(result.data).toEqual([1, 2, 3]);
    });
  });
});
