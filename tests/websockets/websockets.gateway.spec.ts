import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { WebsocketsGateway } from '../../src/shared/websockets/websockets.gateway';
import { WebsocketsRessourceType } from '../../src/shared/websockets/websockets-ressource-type';

describe('WebsocketsGateway', () => {
  let gateway: WebsocketsGateway;
  let mockSocket: Partial<Socket>;
  let mockServer: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebsocketsGateway],
    }).compile();

    gateway = module.get<WebsocketsGateway>(WebsocketsGateway);

    // Mock Socket.IO Server
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    gateway.server = mockServer;

    // Mock Socket client
    mockSocket = {
      id: 'test-socket-id',
      handshake: {
        auth: {
          token: 'valid-token',
        },
      } as any,
      emit: jest.fn(),
      disconnect: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should authenticate a client with a valid token', async () => {
      await gateway.handleConnection(mockSocket as Socket);

      expect(mockSocket.emit).toHaveBeenCalledWith('message', {
        action: 'AUTHENTICATE',
        payload: { isAuthenticated: true },
        ressource: WebsocketsRessourceType.AUTHENTICATION,
      });
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should reject a client without a token', async () => {
      mockSocket.handshake.auth.token = undefined;

      await expect(gateway.handleConnection(mockSocket as Socket)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockSocket.emit).toHaveBeenCalledWith('message', {
        action: 'AUTHENTICATE',
        payload: { isAuthenticated: false },
        ressource: WebsocketsRessourceType.AUTHENTICATION,
      });
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should reject a client with an empty token', async () => {
      mockSocket.handshake.auth.token = '';

      await expect(gateway.handleConnection(mockSocket as Socket)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockSocket.emit).toHaveBeenCalledWith('message', {
        action: 'AUTHENTICATE',
        payload: { isAuthenticated: false },
        ressource: WebsocketsRessourceType.AUTHENTICATION,
      });
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should disconnect client on authentication error', async () => {
      mockSocket.emit = jest.fn().mockImplementation(() => {
        throw new Error('Connection error');
      });

      await expect(gateway.handleConnection(mockSocket as Socket)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleJoinRoom', () => {
    it('should allow a client to join a room', () => {
      const roomData = { room: 'test-room' };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleJoinRoom(mockSocket as Socket, roomData);

      expect(mockSocket.join).toHaveBeenCalledWith('test-room');
      expect(consoleSpy).toHaveBeenCalledWith(
        `📌 Client ${mockSocket.id} a rejoint la room test-room`,
      );

      consoleSpy.mockRestore();
    });

    it('should handle multiple room joins', () => {
      gateway.handleJoinRoom(mockSocket as Socket, { room: 'room1' });
      gateway.handleJoinRoom(mockSocket as Socket, { room: 'room2' });

      expect(mockSocket.join).toHaveBeenCalledTimes(2);
      expect(mockSocket.join).toHaveBeenCalledWith('room1');
      expect(mockSocket.join).toHaveBeenCalledWith('room2');
    });
  });

  describe('handleLeaveRoom', () => {
    it('should allow a client to leave a room', () => {
      const roomData = { room: 'test-room' };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleLeaveRoom(mockSocket as Socket, roomData);

      expect(mockSocket.leave).toHaveBeenCalledWith('test-room');
      expect(consoleSpy).toHaveBeenCalledWith(
        `📌 Client ${mockSocket.id} a quitté la room test-room`,
      );

      consoleSpy.mockRestore();
    });

    it('should handle leaving multiple rooms', () => {
      gateway.handleLeaveRoom(mockSocket as Socket, { room: 'room1' });
      gateway.handleLeaveRoom(mockSocket as Socket, { room: 'room2' });

      expect(mockSocket.leave).toHaveBeenCalledTimes(2);
      expect(mockSocket.leave).toHaveBeenCalledWith('room1');
      expect(mockSocket.leave).toHaveBeenCalledWith('room2');
    });
  });

  describe('handleSendMessage', () => {
    it('should send a message to a specific user', () => {
      const messageData = {
        action: 'NEW_MESSAGE',
        payload: { text: 'Hello World' },
        userId: 'user-123',
      };

      gateway.handleSendMessage(messageData);

      expect(mockServer.to).toHaveBeenCalledWith('user_user-123');
      expect(mockServer.emit).toHaveBeenCalledWith('message', {
        action: 'NEW_MESSAGE',
        payload: { text: 'Hello World' },
        ressource: WebsocketsRessourceType.MESSAGE,
      });
    });

    it('should handle empty message payload', () => {
      const messageData = {
        action: 'DELETE_MESSAGE',
        payload: {},
        userId: 'user-456',
      };

      gateway.handleSendMessage(messageData);

      expect(mockServer.to).toHaveBeenCalledWith('user_user-456');
      expect(mockServer.emit).toHaveBeenCalledWith('message', {
        action: 'DELETE_MESSAGE',
        payload: {},
        ressource: WebsocketsRessourceType.MESSAGE,
      });
    });
  });

  describe('handleInvitations', () => {
    it('should send an invitation to a specific user', () => {
      const invitationData = {
        action: 'NEW_INVITATION',
        payload: { sessionId: 'session-123' },
        userId: 'user-789',
      };

      gateway.handleInvitations(invitationData);

      expect(mockServer.to).toHaveBeenCalledWith('user_user-789');
      expect(mockServer.emit).toHaveBeenCalledWith('invitation', {
        action: 'NEW_INVITATION',
        payload: { sessionId: 'session-123' },
        ressource: WebsocketsRessourceType.INVITATION,
      });
    });

    it('should handle invitation cancellation', () => {
      const invitationData = {
        action: 'CANCEL_INVITATION',
        payload: { invitationId: 'inv-456' },
        userId: 'user-999',
      };

      gateway.handleInvitations(invitationData);

      expect(mockServer.to).toHaveBeenCalledWith('user_user-999');
      expect(mockServer.emit).toHaveBeenCalledWith('invitation', {
        action: 'CANCEL_INVITATION',
        payload: { invitationId: 'inv-456' },
        ressource: WebsocketsRessourceType.INVITATION,
      });
    });
  });
});
