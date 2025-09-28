import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Session_teams, Team_label } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionTeamsService } from '../../src/sessions/session-teams.service';

describe('SessionTeamsService', () => {
  let service: SessionTeamsService;
  let prismaService: PrismaService;
  let logger: Logger;

  const mockPrismaService = {
    session_teams: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionTeamsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SessionTeamsService>(SessionTeamsService);
    prismaService = module.get<PrismaService>(PrismaService);
    logger = service['logger'] as Logger;

    // Mock the logger to avoid console output during tests
    jest.spyOn(logger, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDefaultTeams', () => {
    const sessionUid = 'test-session-uid-123';

    it('should create default teams successfully', async () => {
      // Arrange
      mockPrismaService.session_teams.createMany.mockResolvedValue({
        count: 2,
      });

      // Act
      await service.createDefaultTeams(sessionUid);

      // Assert
      expect(mockPrismaService.session_teams.createMany).toHaveBeenCalledWith({
        data: [
          {
            sessionId: sessionUid,
            teamLabel: Team_label.A,
            teamName: 'Team A',
          },
          {
            sessionId: sessionUid,
            teamLabel: Team_label.B,
            teamName: 'Team B',
          },
        ],
      });
      expect(logger.log).toHaveBeenCalledWith(`Default teams created for session ${sessionUid}`);
    });

    it('should handle database errors when creating teams', async () => {
      // Arrange
      const databaseError = new Error('Database connection failed');
      mockPrismaService.session_teams.createMany.mockRejectedValue(databaseError);

      // Act & Assert
      await expect(service.createDefaultTeams(sessionUid)).rejects.toThrow(databaseError);
      expect(mockPrismaService.session_teams.createMany).toHaveBeenCalledWith({
        data: [
          {
            sessionId: sessionUid,
            teamLabel: Team_label.A,
            teamName: 'Team A',
          },
          {
            sessionId: sessionUid,
            teamLabel: Team_label.B,
            teamName: 'Team B',
          },
        ],
      });
      expect(logger.log).not.toHaveBeenCalled();
    });

    it('should create teams with correct structure', async () => {
      // Arrange
      mockPrismaService.session_teams.createMany.mockResolvedValue({
        count: 2,
      });

      // Act
      await service.createDefaultTeams(sessionUid);

      // Assert
      const createCall = mockPrismaService.session_teams.createMany.mock.calls[0][0];
      expect(createCall.data).toHaveLength(2);
      expect(createCall.data[0]).toMatchObject({
        sessionId: sessionUid,
        teamLabel: Team_label.A,
        teamName: 'Team A',
      });
      expect(createCall.data[1]).toMatchObject({
        sessionId: sessionUid,
        teamLabel: Team_label.B,
        teamName: 'Team B',
      });
    });
  });

  describe('findTeamsBySessionUid', () => {
    const sessionUid = 'test-session-uid-123';
    const mockTeams: Session_teams[] = [
      {
        id: 'team-id-1',
        sessionId: sessionUid,
        teamLabel: Team_label.A,
        teamName: 'Team A',
        createdAt: new Date('2023-01-01T12:00:00Z'),
        updatedAt: new Date('2023-01-01T12:00:00Z'),
      },
      {
        id: 'team-id-2',
        sessionId: sessionUid,
        teamLabel: Team_label.B,
        teamName: 'Team B',
        createdAt: new Date('2023-01-01T12:00:00Z'),
        updatedAt: new Date('2023-01-01T12:00:00Z'),
      },
    ];

    it('should return teams for a given session', async () => {
      // Arrange
      mockPrismaService.session_teams.findMany.mockResolvedValue(mockTeams);

      // Act
      const result = await service.findTeamsBySessionUid(sessionUid);

      // Assert
      expect(result).toEqual({
        items: mockTeams,
        totalCount: 2,
        nextCursor: null,
      });
      expect(mockPrismaService.session_teams.findMany).toHaveBeenCalledWith({
        where: {
          sessionId: sessionUid,
        },
      });
    });

    it('should return empty array when no teams found', async () => {
      // Arrange
      mockPrismaService.session_teams.findMany.mockResolvedValue([]);

      // Act
      const result = await service.findTeamsBySessionUid(sessionUid);

      // Assert
      expect(result).toEqual({
        items: [],
        totalCount: 0,
        nextCursor: null,
      });
      expect(mockPrismaService.session_teams.findMany).toHaveBeenCalledWith({
        where: {
          sessionId: sessionUid,
        },
      });
    });

    it('should handle single team result', async () => {
      // Arrange
      const singleTeam = [mockTeams[0]];
      mockPrismaService.session_teams.findMany.mockResolvedValue(singleTeam);

      // Act
      const result = await service.findTeamsBySessionUid(sessionUid);

      // Assert
      expect(result).toEqual({
        items: singleTeam,
        totalCount: 1,
        nextCursor: null,
      });
    });

    it('should handle database errors when finding teams', async () => {
      // Arrange
      const databaseError = new Error('Database query failed');
      mockPrismaService.session_teams.findMany.mockRejectedValue(databaseError);

      // Act & Assert
      await expect(service.findTeamsBySessionUid(sessionUid)).rejects.toThrow(databaseError);
      expect(mockPrismaService.session_teams.findMany).toHaveBeenCalledWith({
        where: {
          sessionId: sessionUid,
        },
      });
    });

    it('should maintain proper return type structure', async () => {
      // Arrange
      mockPrismaService.session_teams.findMany.mockResolvedValue(mockTeams);

      // Act
      const result = await service.findTeamsBySessionUid(sessionUid);

      // Assert
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('nextCursor');
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.totalCount).toBe('number');
      expect(result.nextCursor).toBeNull();
    });
  });

  describe('findOneByUid', () => {
    const teamUid = 'team-id-123';
    const mockTeam: Session_teams = {
      id: teamUid,
      sessionId: 'session-id-123',
      teamLabel: Team_label.A,
      teamName: 'Team A',
      createdAt: new Date('2023-01-01T12:00:00Z'),
      updatedAt: new Date('2023-01-01T12:00:00Z'),
    };

    it('should return a team when found', async () => {
      // Arrange
      mockPrismaService.session_teams.findUnique.mockResolvedValue(mockTeam);

      // Act
      const result = await service.findOneByUid(teamUid);

      // Assert
      expect(result).toEqual(mockTeam);
      expect(mockPrismaService.session_teams.findUnique).toHaveBeenCalledWith({
        where: {
          id: teamUid,
        },
      });
    });

    it('should return null when team not found', async () => {
      // Arrange
      mockPrismaService.session_teams.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.findOneByUid('non-existent-id');

      // Assert
      expect(result).toBeNull();
      expect(mockPrismaService.session_teams.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'non-existent-id',
        },
      });
    });

    it('should handle database errors when finding team', async () => {
      // Arrange
      const databaseError = new Error('Database connection lost');
      mockPrismaService.session_teams.findUnique.mockRejectedValue(databaseError);

      // Act & Assert
      await expect(service.findOneByUid(teamUid)).rejects.toThrow(databaseError);
      expect(mockPrismaService.session_teams.findUnique).toHaveBeenCalledWith({
        where: {
          id: teamUid,
        },
      });
    });

    it('should handle empty string as uid', async () => {
      // Arrange
      mockPrismaService.session_teams.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.findOneByUid('');

      // Assert
      expect(result).toBeNull();
      expect(mockPrismaService.session_teams.findUnique).toHaveBeenCalledWith({
        where: {
          id: '',
        },
      });
    });

    it('should return correct team properties', async () => {
      // Arrange
      mockPrismaService.session_teams.findUnique.mockResolvedValue(mockTeam);

      // Act
      const result = await service.findOneByUid(teamUid);

      // Assert
      expect(result).toMatchObject({
        id: teamUid,
        sessionId: 'session-id-123',
        teamLabel: Team_label.A,
        teamName: 'Team A',
      });
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle concurrent team creation and retrieval', async () => {
      // Arrange
      const sessionUid = 'concurrent-session-123';
      const mockTeams: Session_teams[] = [
        {
          id: 'team-1',
          sessionId: sessionUid,
          teamLabel: Team_label.A,
          teamName: 'Team A',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'team-2',
          sessionId: sessionUid,
          teamLabel: Team_label.B,
          teamName: 'Team B',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.session_teams.createMany.mockResolvedValue({ count: 2 });
      mockPrismaService.session_teams.findMany.mockResolvedValue(mockTeams);

      // Act
      await service.createDefaultTeams(sessionUid);
      const result = await service.findTeamsBySessionUid(sessionUid);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(logger.log).toHaveBeenCalledWith(`Default teams created for session ${sessionUid}`);
    });

    it('should maintain data consistency across operations', async () => {
      // Arrange
      const sessionUid = 'consistency-test-session';
      const teamUid = 'consistency-test-team';

      const mockTeam: Session_teams = {
        id: teamUid,
        sessionId: sessionUid,
        teamLabel: Team_label.A,
        teamName: 'Team A',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.session_teams.findMany.mockResolvedValue([mockTeam]);
      mockPrismaService.session_teams.findUnique.mockResolvedValue(mockTeam);

      // Act
      const allTeams = await service.findTeamsBySessionUid(sessionUid);
      const singleTeam = await service.findOneByUid(teamUid);

      // Assert
      expect(allTeams.items[0]).toMatchObject(mockTeam);
      expect(singleTeam).toMatchObject(mockTeam);
      expect(allTeams.items[0].sessionId).toBe(singleTeam?.sessionId);
    });
  });
});
