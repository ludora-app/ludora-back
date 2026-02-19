import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvitationStatus } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { UsersService } from 'src/users/users.service';
import { CreateSessionInvitationDto } from '../../../src/sessions/dto/input/create-session-invitation.dto';
import { UpdateSessionInvitationDto } from '../../../src/sessions/dto/input/update-session-invitation.dto';
import { SessionPlayersService } from 'src/sessions/services/session-players.service';
import { PinoLogger } from 'nestjs-pino';
import { SessionsService } from 'src/sessions/services/sessions.service';
import { SessionInvitationsService } from 'src/sessions/services/session-invitations.service';

describe('SessionInvitationsService', () => {
  let service: SessionInvitationsService;
  let prismaService: PrismaService;
  let sessionsService: SessionsService;
  let usersService: UsersService;
  let playersService: SessionPlayersService;
  let logger: PinoLogger;
  const mockPrismaService = {
    sessionInvitations: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    sessionPlayers: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  const mockSessionsService = {
    findOne: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };
  const mockSessionPlayersService = {
    addPlayerToSession: jest.fn(),
    findOne: jest.fn(),
  };
  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
  };

  const mockSession = {
    id: 'session-123',
    date: new Date('2024-01-15T10:00:00Z'),
  } as any;

  const mockUser = { id: 'user-123' } as any;

  const mockInvitation = {
    sessionUid: 'session-123',
    senderUid: 'sender-123',
    receiverUid: 'user-123',
    status: InvitationStatus.PENDING,
    createdAt: new Date('2023-01-01T12:00:00Z'),
    updatedAt: new Date('2023-01-01T12:00:00Z'),
  } as any;

  const senderUid = 'sender-123';

  const mockPlayerWithUser = {
    userUid: senderUid,
    user: {
      firstname: 'John',
      lastname: 'Doe',
      imageUrl: 'https://example.com/avatar.jpg',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionInvitationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SessionsService,
          useValue: mockSessionsService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: SessionPlayersService,
          useValue: mockSessionPlayersService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<SessionInvitationsService>(SessionInvitationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    sessionsService = module.get<SessionsService>(SessionsService);
    usersService = module.get<UsersService>(UsersService);
    playersService = module.get<SessionPlayersService>(SessionPlayersService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByReceiverId', () => {
    it('should return paginated invitations for a receiver', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      const items = [mockInvitation];
      (prismaService.sessionInvitations.findMany as jest.Mock).mockResolvedValue(items);

      const result = await service.findAllByReceiverId('user-123', { limit: 10 } as any);
      expect(result).toEqual({ items, nextCursor: null, totalCount: 1 });
      expect(prismaService.sessionInvitations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 11,
          where: expect.objectContaining({ receiverUid: 'user-123' }),
        }),
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersService.findOne.mockResolvedValue(null);
      await expect(service.findAllByReceiverId('user-404', { limit: 10 } as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllBySessionId', () => {
    it('should return paginated invitations for a session', async () => {
      mockSessionsService.findOne.mockResolvedValue(mockSession);
      const items = [mockInvitation];
      (prismaService.sessionInvitations.findMany as jest.Mock).mockResolvedValue(items);

      const result = await service.findAllBySessionId('session-123', { limit: 10 } as any);
      expect(result).toEqual({ items, nextCursor: null, totalCount: 1 });
      expect(prismaService.sessionInvitations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 11,
          where: expect.objectContaining({ sessionUid: 'session-123' }),
        }),
      );
    });

    it('should throw NotFoundException when session does not exist', async () => {
      mockSessionsService.findOne.mockResolvedValue(null);
      await expect(service.findAllBySessionId('session-404', { limit: 10 } as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('should return an invitation', async () => {
      mockSessionsService.findOne.mockResolvedValue(mockSession);
      mockUsersService.findOne.mockResolvedValue(mockUser);
      (prismaService.sessionInvitations.findFirst as jest.Mock).mockResolvedValue(mockInvitation);

      const result = await service.findOne('session-123', 'user-123');
      expect(result).toEqual(mockInvitation);
    });

    it('should throw NotFoundException when session not found', async () => {
      mockSessionsService.findOne.mockResolvedValue(null);
      await expect(service.findOne('session-404', 'user-123')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockSessionsService.findOne.mockResolvedValue(mockSession);
      mockUsersService.findOne.mockResolvedValue(null);
      await expect(service.findOne('session-123', 'user-404')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const existingInvitation = {
      sessionUid: 'session-123',
      senderUid: 'sender-123',
      receiverUid: 'user-123',
      status: InvitationStatus.PENDING,
      session: { creatorUid: 'creator-123' },
    } as any;

    it('should update status to ACCEPTED and add player', async () => {
      (prismaService.sessionInvitations.findFirst as jest.Mock).mockResolvedValue(
        existingInvitation,
      );

      const txUpdateMock = jest
        .fn()
        .mockResolvedValue({ ...existingInvitation, status: InvitationStatus.ACCEPTED });
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
        const tx = { sessionInvitations: { update: txUpdateMock } } as any;
        return await cb(tx);
      });

      const dto: UpdateSessionInvitationDto = {
        status: InvitationStatus.ACCEPTED,
        userUid: 'user-123',
        sessionUid: 'session-123',
      };

      await expect(service.update(dto)).resolves.toBeUndefined();
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(playersService.addPlayerToSession).toHaveBeenCalledWith(
        { sessionUid: 'session-123', teamUid: 'session-123', userUid: 'user-123' },
        'creator-123',
        expect.any(Object),
      );
      expect(txUpdateMock).toHaveBeenCalledWith({
        data: { status: InvitationStatus.ACCEPTED },
        where: {
          sessionUid_senderUid_receiverUid: {
            receiverUid: 'user-123',
            senderUid: 'sender-123',
            sessionUid: 'session-123',
          },
        },
      });
    });

    it('should throw NotFoundException when invitation does not exist', async () => {
      (prismaService.sessionInvitations.findFirst as jest.Mock).mockResolvedValue(null);
      const dto: UpdateSessionInvitationDto = {
        status: InvitationStatus.ACCEPTED,
        userUid: 'user-123',
        sessionUid: 'session-123',
      };
      await expect(service.update(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when status is unchanged', async () => {
      (prismaService.sessionInvitations.findFirst as jest.Mock).mockResolvedValue(
        existingInvitation,
      );
      const dto: UpdateSessionInvitationDto = {
        status: InvitationStatus.PENDING,
        userUid: 'user-123',
        sessionUid: 'session-123',
      };
      await expect(service.update(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when receiver changes status to PENDING or CANCELED', async () => {
      (prismaService.sessionInvitations.findFirst as jest.Mock).mockResolvedValue(
        existingInvitation,
      );
      const dtoPending: UpdateSessionInvitationDto = {
        status: InvitationStatus.PENDING,
        userUid: 'user-123',
        sessionUid: 'session-123',
      };
      await expect(service.update(dtoPending)).rejects.toThrow(BadRequestException);

      const dtoCanceled: UpdateSessionInvitationDto = {
        status: InvitationStatus.CANCELED,
        userUid: 'user-123',
        sessionUid: 'session-123',
      };
      await expect(service.update(dtoCanceled)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should return placeholder message', () => {
      const result = service.remove('session-123', 'user-456');
      expect(result).toBe(
        'This action removes session invitation for session session-123 and user user-456',
      );
    });
  });

  describe('createMany', () => {
    const sessionUid = 'session-123';
    const dto = { receiverUids: ['user-1', 'user-2'] };
    const mockSender = {
      uid: senderUid,
      firstname: 'John',
      lastname: 'Doe',
      imageUrl: 'https://example.com/avatar.jpg',
    };
    const mockSession = {
      uid: sessionUid,
      title: 'Session Title',
      startDate: new Date(),
      sport: 'BASKETBALL',
    };

    it('should throw NotFoundException when sender not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.createMany(senderUid, sessionUid, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        senderUid,
        USERSELECT.basicUserInfoDisplay,
      );
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when session not found', async () => {
      mockUsersService.findOne.mockResolvedValue(mockSender);
      mockSessionsService.findOne.mockResolvedValue(null);

      await expect(service.createMany(senderUid, sessionUid, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSessionsService.findOne).toHaveBeenCalledWith(sessionUid);
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should upsert invitations for valid receiver UIDs and emit events', async () => {
      mockUsersService.findOne
        .mockResolvedValueOnce(mockSender)
        .mockResolvedValueOnce({ uid: 'user-1' })
        .mockResolvedValueOnce({ uid: 'user-2' });
      mockSessionsService.findOne.mockResolvedValue(mockSession);
      (prismaService.sessionPlayers.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.sessionInvitations.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.$transaction as jest.Mock).mockImplementation((fns: Promise<unknown>[]) =>
        Promise.all(fns),
      );
      (prismaService.sessionInvitations.upsert as jest.Mock).mockResolvedValue({});

      await service.createMany(senderUid, sessionUid, dto);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        senderUid,
        USERSELECT.basicUserInfoDisplay,
      );
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-1', USERSELECT.checkIfUserExists);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-2', USERSELECT.checkIfUserExists);
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(prismaService.sessionInvitations.upsert).toHaveBeenCalledTimes(2);
      expect(prismaService.sessionInvitations.upsert).toHaveBeenCalledWith({
        where: {
          sessionUid_senderUid_receiverUid: {
            sessionUid,
            senderUid,
            receiverUid: 'user-1',
          },
        },
        create: { sessionUid, senderUid, receiverUid: 'user-1' },
        update: { status: InvitationStatus.PENDING },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          senderUid,
          sessionUid: mockSession.uid,
          sessionTitle: mockSession.title,
        }),
        'user-1',
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        'user-2',
      );
    });

    it('should not call transaction nor emit when no valid UIDs', async () => {
      mockUsersService.findOne.mockResolvedValueOnce(mockSender);
      mockSessionsService.findOne.mockResolvedValue(mockSession);
      (prismaService.sessionPlayers.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.sessionInvitations.findFirst as jest.Mock).mockResolvedValue(null);
      mockUsersService.findOne.mockResolvedValue(null); // user-1 not found
      mockUsersService.findOne.mockResolvedValue(null); // user-2 not found

      await service.createMany(senderUid, sessionUid, dto);

      expect(prismaService.$transaction).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should exclude sender from validUids', async () => {
      mockUsersService.findOne
        .mockResolvedValueOnce(mockSender)
        .mockResolvedValueOnce({ uid: 'user-2' });
      mockSessionsService.findOne.mockResolvedValue(mockSession);
      (prismaService.sessionPlayers.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.sessionInvitations.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.$transaction as jest.Mock).mockImplementation((fns: Promise<unknown>[]) =>
        Promise.all(fns),
      );
      (prismaService.sessionInvitations.upsert as jest.Mock).mockResolvedValue({});

      await service.createMany(senderUid, sessionUid, {
        receiverUids: [senderUid, 'user-2'],
      });

      expect(prismaService.sessionInvitations.upsert).toHaveBeenCalledTimes(1);
      expect(prismaService.sessionInvitations.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ receiverUid: 'user-2' }),
        }),
      );
    });
  });

  describe('checkValidUidBeforeSendingInvitations', () => {
    const sessionUid = 'session-123';

    it('should return Set of valid UIDs when all checks pass', async () => {
      mockUsersService.findOne.mockResolvedValue({ uid: 'user-1' });
      (prismaService.sessionPlayers.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.sessionInvitations.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.checkValidUidBeforeSendingInvitations(senderUid, sessionUid, [
        'user-1',
        'user-2',
      ]);

      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-1', USERSELECT.checkIfUserExists);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-2', USERSELECT.checkIfUserExists);
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(2);
      expect(result.has('user-1')).toBe(true);
      expect(result.has('user-2')).toBe(true);
    });

    it('should exclude sender UID', async () => {
      const result = await service.checkValidUidBeforeSendingInvitations(senderUid, sessionUid, [
        senderUid,
      ]);

      expect(result.size).toBe(0);
      expect(mockUsersService.findOne).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(`User ${senderUid} cannot invite himself`);
    });

    it('should exclude UIDs when user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      const result = await service.checkValidUidBeforeSendingInvitations(senderUid, sessionUid, [
        'user-404',
      ]);

      expect(result.size).toBe(0);
      expect(mockLogger.error).toHaveBeenCalledWith('User user-404 not found');
    });

    it('should exclude UIDs when user is already in session', async () => {
      mockUsersService.findOne.mockResolvedValue({ uid: 'user-1' });
      (prismaService.sessionPlayers.findFirst as jest.Mock).mockResolvedValue({
        userUid: 'user-1',
      });

      const result = await service.checkValidUidBeforeSendingInvitations(senderUid, sessionUid, [
        'user-1',
      ]);

      expect(result.size).toBe(0);
      expect(mockLogger.error).toHaveBeenCalledWith('User user-1 already in session session-123');
    });

    it('should exclude UIDs when invitation already PENDING or ACCEPTED', async () => {
      mockUsersService.findOne.mockResolvedValue({ uid: 'user-1' });
      (prismaService.sessionPlayers.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.sessionInvitations.findFirst as jest.Mock)
        .mockResolvedValueOnce({ status: InvitationStatus.PENDING })
        .mockResolvedValueOnce(null);

      const result = await service.checkValidUidBeforeSendingInvitations(senderUid, sessionUid, [
        'user-1',
        'user-2',
      ]);

      expect(result.size).toBe(1);
      expect(result.has('user-2')).toBe(true);
      expect(result.has('user-1')).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'User user-1 already invited to the session session-123',
      );
    });

    it('should include UID when existing invitation is REJECTED or CANCELED', async () => {
      mockUsersService.findOne.mockResolvedValue({ uid: 'user-1' });
      (prismaService.sessionPlayers.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.sessionInvitations.findFirst as jest.Mock).mockResolvedValue({
        status: InvitationStatus.REJECTED,
      });

      const result = await service.checkValidUidBeforeSendingInvitations(senderUid, sessionUid, [
        'user-1',
      ]);

      expect(result.size).toBe(1);
      expect(result.has('user-1')).toBe(true);
    });
  });

  // describe('findAll', () => {
  //   it('should return a placeholder string', () => {
  //     // Act
  //     const result = service.findAll();

  //     // Assert
  //     expect(result).toBe('This action returns all session invitations');
  //   });
  // });

  // Removed obsolete placeholder-only tests for findOne/update/remove since service now performs real lookups
});
