import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Invitation_status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { UsersService } from 'src/users/users.service';
import { CreateSessionInvitationDto } from '../../src/session-invitations/dto/input/create-session-invitation.dto';
import { UpdateSessionInvitationDto } from '../../src/session-invitations/dto/input/update-session-invitation.dto';
import { SessionInvitationsService } from '../../src/session-invitations/session-invitations.service';
import { SessionPlayersService } from 'src/session-players/session-players.service';

describe('SessionInvitationsService', () => {
  let service: SessionInvitationsService;
  let prismaService: PrismaService;
  let sessionsService: SessionsService;
  let usersService: UsersService;
  let playersService: SessionPlayersService;

  const mockPrismaService = {
    sessionInvitations: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
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

  const mockSession = {
    id: 'session-123',
  } as any;

  const mockUser = { id: 'user-123' } as any;

  const mockInvitation = {
    sessionUid: 'session-123',
    senderUid: 'sender-123',
    receiverUid: 'user-123',
    status: Invitation_status.PENDING,
    createdAt: new Date('2023-01-01T12:00:00Z'),
    updatedAt: new Date('2023-01-01T12:00:00Z'),
  } as any;

  const senderUid = 'sender-123';

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

  describe('create', () => {
    const createDto: CreateSessionInvitationDto = {
      sessionUid: 'session-123',
      receiverUid: 'user-123',
    };

    it('should create a session invitation successfully', async () => {
      mockSessionsService.findOne.mockResolvedValue(mockSession);
      mockSessionPlayersService.findOne.mockResolvedValue({ userUid: senderUid });
      mockUsersService.findOne.mockResolvedValue(mockUser);
      (prismaService.sessionInvitations.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.sessionInvitations.create as jest.Mock).mockResolvedValue(mockInvitation);

      const result = await service.create(senderUid, createDto);

      expect(result).toEqual(mockInvitation);
      expect(sessionsService.findOne).toHaveBeenCalledWith('session-123');
      expect(playersService.findOne).toHaveBeenCalledWith('session-123', senderUid);
      expect(usersService.findOne).toHaveBeenCalledWith('user-123', USERSELECT.findOne);
      expect(prismaService.sessionInvitations.findFirst).toHaveBeenCalledWith({
        where: { receiverUid: 'user-123', sessionUid: 'session-123' },
      });
      expect(prismaService.sessionInvitations.create).toHaveBeenCalledWith({
        data: { receiverUid: 'user-123', senderUid, sessionUid: 'session-123' },
      });
    });

    it('should throw BadRequestException when session does not exist', async () => {
      mockSessionsService.findOne.mockResolvedValue(null);

      await expect(service.create(senderUid, createDto)).rejects.toThrow(BadRequestException);
      expect(sessionsService.findOne).toHaveBeenCalledWith('session-123');
      expect(usersService.findOne).not.toHaveBeenCalled();
      expect(prismaService.sessionInvitations.findFirst).not.toHaveBeenCalled();
      expect(prismaService.sessionInvitations.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user does not exist', async () => {
      mockSessionsService.findOne.mockResolvedValue(mockSession);
      mockSessionPlayersService.findOne.mockResolvedValue({ userUid: senderUid });
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.create(senderUid, createDto)).rejects.toThrow(BadRequestException);
      expect(sessionsService.findOne).toHaveBeenCalledWith('session-123');
      expect(playersService.findOne).toHaveBeenCalledWith('session-123', senderUid);
      expect(usersService.findOne).toHaveBeenCalledWith('user-123', USERSELECT.findOne);
      expect(prismaService.sessionInvitations.findFirst).not.toHaveBeenCalled();
      expect(prismaService.sessionInvitations.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when inviting self', async () => {
      mockSessionsService.findOne.mockResolvedValue(mockSession);
      mockSessionPlayersService.findOne.mockResolvedValue({ userUid: senderUid });
      mockUsersService.findOne.mockResolvedValue(mockUser);
      const selfDto = { ...createDto, receiverUid: senderUid };
      await expect(service.create(senderUid, selfDto)).rejects.toThrow(BadRequestException);
      expect(prismaService.sessionInvitations.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when existing invitation is PENDING or ACCEPTED', async () => {
      mockSessionsService.findOne.mockResolvedValue(mockSession);
      mockSessionPlayersService.findOne.mockResolvedValue({ userUid: senderUid });
      mockUsersService.findOne.mockResolvedValue(mockUser);

      (prismaService.sessionInvitations.findFirst as jest.Mock).mockResolvedValue({
        status: Invitation_status.PENDING,
      });
      await expect(service.create(senderUid, createDto)).rejects.toThrow(ConflictException);

      (prismaService.sessionInvitations.findFirst as jest.Mock).mockResolvedValue({
        status: Invitation_status.ACCEPTED,
      });
      await expect(service.create(senderUid, createDto)).rejects.toThrow(ConflictException);
    });

    it('should create when previous invitation was REJECTED', async () => {
      mockSessionsService.findOne.mockResolvedValue(mockSession);
      mockSessionPlayersService.findOne.mockResolvedValue({ userUid: senderUid });
      mockUsersService.findOne.mockResolvedValue(mockUser);
      (prismaService.sessionInvitations.findFirst as jest.Mock).mockResolvedValue({
        status: Invitation_status.REJECTED,
      });
      (prismaService.sessionInvitations.create as jest.Mock).mockResolvedValue(mockInvitation);

      const result = await service.create(senderUid, createDto);
      expect(result).toEqual(mockInvitation);
    });
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
      status: Invitation_status.PENDING,
    } as any;

    it('should update status to ACCEPTED and add player', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(existingInvitation);

      const txUpdateMock = jest
        .fn()
        .mockResolvedValue({ ...existingInvitation, status: Invitation_status.ACCEPTED });
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
        const tx = { sessionInvitations: { update: txUpdateMock } } as any;
        return await cb(tx);
      });

      const dto: UpdateSessionInvitationDto = {
        status: Invitation_status.ACCEPTED,
        userUid: 'user-123',
        sessionUid: 'session-123',
      };

      await expect(service.update(dto)).resolves.toBeUndefined();
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(playersService.addPlayerToSession).toHaveBeenCalledWith(
        { sessionUid: 'session-123', teamUid: 'session-123', userUid: 'user-123' },
        expect.any(Object),
      );
      expect(txUpdateMock).toHaveBeenCalledWith({
        data: { status: Invitation_status.ACCEPTED },
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
      jest.spyOn(service, 'findOneSessionBySenderOrReceiver').mockResolvedValue(null as any);
      const dto: UpdateSessionInvitationDto = {
        status: Invitation_status.ACCEPTED,
        userUid: 'user-123',
        sessionUid: 'session-123',
      };
      await expect(service.update(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when status is unchanged', async () => {
      jest.spyOn(service, 'findOneSessionBySenderOrReceiver').mockResolvedValue(existingInvitation);
      const dto: UpdateSessionInvitationDto = {
        status: Invitation_status.PENDING,
        userUid: 'user-123',
        sessionUid: 'session-123',
      };
      await expect(service.update(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when receiver changes status to PENDING or CANCELED', async () => {
      jest.spyOn(service, 'findOneSessionBySenderOrReceiver').mockResolvedValue(existingInvitation);
      const dtoPending: UpdateSessionInvitationDto = {
        status: Invitation_status.PENDING,
        userUid: 'user-123',
        sessionUid: 'session-123',
      };
      await expect(service.update(dtoPending)).rejects.toThrow(BadRequestException);

      const dtoCanceled: UpdateSessionInvitationDto = {
        status: Invitation_status.CANCELED,
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
