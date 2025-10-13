import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Invitation_status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { UsersService } from 'src/users/users.service';
import { CreateSessionInvitationDto } from '../../src/session-invitations/dto/input/create-session-invitation.dto';
import { UpdateSessionInvitationDto } from '../../src/session-invitations/dto/input/update-session-invitation.dto';
import { SessionInvitationsService } from '../../src/session-invitations/session-invitations.service';

describe('SessionInvitationsService', () => {
  let service: SessionInvitationsService;
  let prismaService: PrismaService;
  let sessionsService: SessionsService;
  let usersService: UsersService;

  const mockPrismaService = {
    sessionInvitations: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockSessionsService = {
    findOne: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockSession = {
    id: 'session-123',
    fieldId: 'field-123',
    title: 'Test Session',
    startDate: new Date('2023-01-10T14:00:00Z'),
    endDate: new Date('2023-01-10T16:00:00Z'),
    sport: 'Football',
    gameMode: 'ELEVEN_V_ELEVEN',
    maxPlayersPerTeam: 11,
    teamsPerGame: 2,
    minPlayersPerTeam: 8,
    description: 'Test session description',
    createdAt: new Date('2023-01-01T12:00:00Z'),
    updatedAt: new Date('2023-01-01T12:00:00Z'),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstname: 'John',
    lastname: 'Doe',
    birthdate: new Date('1990-01-01'),
    sex: 'MALE',
    phone: '+1234567890',
    imageUrl: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    provider: 'LUDORA',
    isConnected: true,
    stripeAccountId: null,
    createdAt: new Date('2023-01-01T12:00:00Z'),
    updatedAt: new Date('2023-01-01T12:00:00Z'),
    emailVerified: true,
    type: 'USER',
  };

  const mockInvitation = {
    sessionUid: 'session-123',
    userId: 'user-123',
    status: Invitation_status.PENDING,
    createdAt: new Date('2023-01-01T12:00:00Z'),
    updatedAt: new Date('2023-01-01T12:00:00Z'),
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
      ],
    }).compile();

    service = module.get<SessionInvitationsService>(SessionInvitationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    sessionsService = module.get<SessionsService>(SessionsService);
    usersService = module.get<UsersService>(UsersService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateSessionInvitationDto = {
      sessionUid: 'session-123',
      userId: 'user-123',
    };

    it('should create a session invitation successfully', async () => {
      // Arrange
      mockSessionsService.findOne.mockResolvedValue(mockSession);
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockPrismaService.sessionInvitations.findUnique.mockResolvedValue(null);
      mockPrismaService.sessionInvitations.create.mockResolvedValue(mockInvitation);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toEqual(mockInvitation);
      expect(sessionsService.findOne).toHaveBeenCalledWith('session-123');
      expect(usersService.findOne).toHaveBeenCalledWith('user-123', USERSELECT.findOne);
      expect(prismaService.sessionInvitations.findUnique).toHaveBeenCalledWith({
        where: {
          sessionUid_userId: {
            sessionUid: 'session-123',
            userId: 'user-123',
          },
        },
      });
      expect(prismaService.sessionInvitations.create).toHaveBeenCalledWith({
        data: {
          sessionUid: 'session-123',
          userId: 'user-123',
        },
      });
    });

    it('should throw BadRequestException when session does not exist', async () => {
      // Arrange
      mockSessionsService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        new BadRequestException('Session not found'),
      );

      expect(sessionsService.findOne).toHaveBeenCalledWith('session-123');
      expect(usersService.findOne).not.toHaveBeenCalled();
      expect(prismaService.sessionInvitations.findUnique).not.toHaveBeenCalled();
      expect(prismaService.sessionInvitations.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user does not exist', async () => {
      // Arrange
      mockSessionsService.findOne.mockResolvedValue(mockSession);
      mockUsersService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        new BadRequestException('User not found'),
      );

      expect(sessionsService.findOne).toHaveBeenCalledWith('session-123');
      expect(usersService.findOne).toHaveBeenCalledWith('user-123', USERSELECT.findOne);
      expect(prismaService.sessionInvitations.findUnique).not.toHaveBeenCalled();
      expect(prismaService.sessionInvitations.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when invitation already exists', async () => {
      // Arrange
      mockSessionsService.findOne.mockResolvedValue(mockSession);
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockPrismaService.sessionInvitations.findUnique.mockResolvedValue(mockInvitation);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException('User already invited to the session'),
      );

      expect(sessionsService.findOne).toHaveBeenCalledWith('session-123');
      expect(usersService.findOne).toHaveBeenCalledWith('user-123', USERSELECT.findOne);
      expect(prismaService.sessionInvitations.findUnique).toHaveBeenCalledWith({
        where: {
          sessionUid_userId: {
            sessionUid: 'session-123',
            userId: 'user-123',
          },
        },
      });
      expect(prismaService.sessionInvitations.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return a placeholder string', () => {
      // Act
      const result = service.findAll();

      // Assert
      expect(result).toBe('This action returns all session invitations');
    });
  });

  describe('findOne', () => {
    it('should return a placeholder string with parameters', () => {
      // Act
      const result = service.findOne('session-123', 'user-456');

      // Assert
      expect(result).toBe(
        'This action returns session invitation for session session-123 and user user-456',
      );
    });
  });

  describe('update', () => {
    it('should return a placeholder string with parameters', () => {
      // Arrange
      const updateDto: UpdateSessionInvitationDto = {
        sessionUid: 'session-456',
        userId: 'user-789',
      };

      // Act
      const result = service.update('session-123', 'user-456', updateDto);

      // Assert
      expect(result).toBe(
        'This action updates session invitation for session session-123 and user user-456',
      );
    });
  });

  describe('remove', () => {
    it('should return a placeholder string with parameters', () => {
      // Act
      const result = service.remove('session-123', 'user-456');

      // Assert
      expect(result).toBe(
        'This action removes session invitation for session session-123 and user user-456',
      );
    });
  });
});
