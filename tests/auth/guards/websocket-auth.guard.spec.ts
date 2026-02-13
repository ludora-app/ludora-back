import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WebSocketAuthGuard } from 'src/auth/guards/websocket-auth.guard';
import { WebSocketAuthService } from 'src/auth/services/websocket-auth.service';

describe('WebSocketAuthGuard', () => {
  let guard: WebSocketAuthGuard;
  let webSocketAuthService: WebSocketAuthService;

  const mockWebSocketAuthService = {
    authenticateSocket: jest.fn(),
  };

  const createMockSocket = (data: { userUid?: string } = {}) =>
    ({
      data: { ...data },
    }) as any;

  const createMockExecutionContext = (client: any) => ({
    context: {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToWs: jest.fn().mockReturnValue({
        getClient: jest.fn().mockReturnValue(client),
      }),
    } as unknown as ExecutionContext,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebSocketAuthGuard,
        {
          provide: WebSocketAuthService,
          useValue: mockWebSocketAuthService,
        },
      ],
    }).compile();

    guard = module.get<WebSocketAuthGuard>(WebSocketAuthGuard);
    webSocketAuthService = module.get<WebSocketAuthService>(WebSocketAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true when client is already authenticated (client.data.userUid set)', async () => {
      const client = createMockSocket({ userUid: 'user-123' });
      const { context } = createMockExecutionContext(client);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockWebSocketAuthService.authenticateSocket).not.toHaveBeenCalled();
    });

    it('should call authenticateSocket and return true when authentication succeeds', async () => {
      const client = createMockSocket();
      const { context } = createMockExecutionContext(client);

      mockWebSocketAuthService.authenticateSocket.mockResolvedValue(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockWebSocketAuthService.authenticateSocket).toHaveBeenCalledWith(client);
    });

    it('should return false when authenticateSocket throws', async () => {
      const client = createMockSocket();
      const { context } = createMockExecutionContext(client);

      mockWebSocketAuthService.authenticateSocket.mockRejectedValue(new Error('Invalid token'));

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(mockWebSocketAuthService.authenticateSocket).toHaveBeenCalledWith(client);
    });

    it('should log error when authentication fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const client = createMockSocket();
      const { context } = createMockExecutionContext(client);

      mockWebSocketAuthService.authenticateSocket.mockRejectedValue(new Error('Token expired'));

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'WebSocket Auth Guard Error:',
        expect.objectContaining({
          message: 'Token expired',
          timestamp: expect.any(String),
        }),
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
