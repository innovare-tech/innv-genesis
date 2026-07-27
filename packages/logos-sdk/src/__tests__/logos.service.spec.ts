import { LogosService } from '../logos.service';
import { LogosApiException } from '../exceptions/logos-api.exception';

describe('LogosService', () => {
  let service: LogosService;
  let mockAxiosRef: any;

  beforeEach(() => {
    mockAxiosRef = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };

    const mockHttpService = { axiosRef: mockAxiosRef } as any;
    const options = {
      apiKey: 'test-api-key',
      baseUrl: 'http://localhost:3001',
      timeout: 5000,
    };

    service = new LogosService(options, mockHttpService);
  });

  describe('sendMessage', () => {
    it('should POST to /agents/:agentId/messages with correct headers', async () => {
      mockAxiosRef.post.mockResolvedValue({
        data: { messageId: 'msg_1', sessionId: 'sess_1' },
      });

      const result = await service.sendMessage('agent_1', {
        sessionId: 'sess_1',
        input: 'Hello',
        contactReference: '+5511999990000',
      });

      expect(mockAxiosRef.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/agents/agent_1/messages',
        {
          sessionId: 'sess_1',
          input: 'Hello',
          contactReference: '+5511999990000',
        },
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-API-Key': 'test-api-key' }),
          timeout: 5000,
        }),
      );
      expect(result.messageId).toBe('msg_1');
    });
  });

  describe('getSession', () => {
    it('should GET /agents/:agentId/sessions/:sessionId', async () => {
      mockAxiosRef.get.mockResolvedValue({
        data: { id: 's1', status: 'ACTIVE' },
      });

      const result = await service.getSession('agent_1', 'sess_1');

      expect(mockAxiosRef.get).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/agents/agent_1/sessions/sess_1',
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-API-Key': 'test-api-key' }),
        }),
      );
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('createAgent', () => {
    it('should POST to /agents', async () => {
      mockAxiosRef.post.mockResolvedValue({
        data: { id: 'a1', botName: 'Maria' },
      });

      const result = await service.createAgent({
        botName: 'Maria',
        tone: 'formal',
        llmConfig: {},
        intents: [],
        flows: [],
        webhookUrl: 'http://example.com/webhook',
      });

      expect(mockAxiosRef.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/agents',
        expect.objectContaining({ botName: 'Maria' }),
        expect.any(Object),
      );
      expect(result.botName).toBe('Maria');
    });
  });

  describe('listAgents', () => {
    it('should GET /agents', async () => {
      mockAxiosRef.get.mockResolvedValue({
        data: [{ id: 'a1' }, { id: 'a2' }],
      });

      const result = await service.listAgents();

      expect(mockAxiosRef.get).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/agents',
        expect.any(Object),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('deleteAgent', () => {
    it('should DELETE /agents/:id', async () => {
      mockAxiosRef.delete.mockResolvedValue({ data: {} });

      await service.deleteAgent('agent_1');

      expect(mockAxiosRef.delete).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/agents/agent_1',
        expect.any(Object),
      );
    });
  });

  describe('routing targets', () => {
    const base = 'http://localhost:3001/api/v1/agents/agent_1/routing-targets';

    it('should GET the routing targets of an agent', async () => {
      mockAxiosRef.get.mockResolvedValue({
        data: [{ id: 'rt1', externalId: 'dept_fin', type: 'DEPARTMENT' }],
      });

      const result = await service.listRoutingTargets('agent_1');

      expect(mockAxiosRef.get).toHaveBeenCalledWith(base, expect.any(Object));
      expect(result).toHaveLength(1);
      expect(result[0].externalId).toBe('dept_fin');
    });

    it('should POST a new routing target with the API key header', async () => {
      mockAxiosRef.post.mockResolvedValue({ data: { id: 'rt1' } });

      await service.createRoutingTarget('agent_1', {
        externalId: 'dept_fin',
        type: 'DEPARTMENT',
        name: 'Financeiro',
        description: 'Cobrança e faturas',
      });

      expect(mockAxiosRef.post).toHaveBeenCalledWith(
        base,
        expect.objectContaining({ externalId: 'dept_fin' }),
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-API-Key': 'test-api-key' }),
        }),
      );
    });

    // PATCH, não PUT: era o verbo que faltava no service.
    it('should PATCH on update', async () => {
      mockAxiosRef.patch.mockResolvedValue({ data: { id: 'rt1' } });

      await service.updateRoutingTarget('agent_1', 'rt1', { name: 'Novo' });

      expect(mockAxiosRef.patch).toHaveBeenCalledWith(
        `${base}/rt1`,
        { name: 'Novo' },
        expect.any(Object),
      );
      expect(mockAxiosRef.put).not.toHaveBeenCalled();
    });

    it('should PATCH the dedicated status route', async () => {
      mockAxiosRef.patch.mockResolvedValue({ data: { id: 'rt1' } });

      await service.updateRoutingTargetStatus('agent_1', 'rt1', 'CLOSED');

      expect(mockAxiosRef.patch).toHaveBeenCalledWith(
        `${base}/rt1/status`,
        { status: 'CLOSED' },
        expect.any(Object),
      );
    });

    it('should DELETE a routing target', async () => {
      mockAxiosRef.delete.mockResolvedValue({ data: {} });

      await service.deleteRoutingTarget('agent_1', 'rt1');

      expect(mockAxiosRef.delete).toHaveBeenCalledWith(
        `${base}/rt1`,
        expect.any(Object),
      );
    });

    it('should surface API errors as LogosApiException', async () => {
      mockAxiosRef.patch.mockRejectedValue({
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Routing target not found' },
        },
      });

      await expect(
        service.updateRoutingTargetStatus('agent_1', 'nope', 'OPEN'),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('error handling', () => {
    it('should throw LogosApiException on HTTP error', async () => {
      mockAxiosRef.get.mockRejectedValue({
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Agent not found' },
        },
      });

      await expect(service.getAgent('nonexistent')).rejects.toThrow(
        LogosApiException,
      );
      await expect(service.getAgent('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw LogosApiException on network error', async () => {
      mockAxiosRef.get.mockRejectedValue({ message: 'ECONNREFUSED' });

      await expect(service.getAgent('any')).rejects.toThrow(LogosApiException);
      await expect(service.getAgent('any')).rejects.toMatchObject({
        statusCode: 0,
      });
    });
  });
});
