import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SessionTeams, TeamLabels } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionTeamsService } from 'src/sessions/services/session-teams.service';

describe('SessionTeamsService', () => {
  let service: SessionTeamsService;
  let prismaService: PrismaService;
  let logger: PinoLogger;

  const mockPrismaService = {
    sessionTeams: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionTeamsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<SessionTeamsService>(SessionTeamsService);
    prismaService = module.get<PrismaService>(PrismaService);
    logger = module.get<PinoLogger>(PinoLogger);

    // Mock the logger to avoid console output during tests
    jest.spyOn(logger, 'info').mockImplementation();
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
      mockPrismaService.sessionTeams.createMany.mockResolvedValue({
        count: 2,
      });

      // Act
      await service.createDefaultTeams(sessionUid);

      // Assert
      expect(mockPrismaService.sessionTeams.createMany).toHaveBeenCalledWith({
        data: [
          {
            sessionUid: sessionUid,
            teamLabel: TeamLabels.A,
            teamName: 'Team A',
          },
          {
            sessionUid: sessionUid,
            teamLabel: TeamLabels.B,
            teamName: 'Team B',
          },
        ],
      });
      expect(logger.info).toHaveBeenCalledWith(`Default teams created for session ${sessionUid}`);
    });

    it('should handle database errors when creating teams', async () => {
      // Arrange
      const databaseError = new Error('Database connection failed');
      mockPrismaService.sessionTeams.createMany.mockRejectedValue(databaseError);

      // Act & Assert
      await expect(service.createDefaultTeams(sessionUid)).rejects.toThrow(databaseError);
      expect(mockPrismaService.sessionTeams.createMany).toHaveBeenCalledWith({
        data: [
          {
            sessionUid: sessionUid,
            teamLabel: TeamLabels.A,
            teamName: 'Team A',
          },
          {
            sessionUid: sessionUid,
            teamLabel: TeamLabels.B,
            teamName: 'Team B',
          },
        ],
      });
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should create teams with correct structure', async () => {
      // Arrange
      mockPrismaService.sessionTeams.createMany.mockResolvedValue({
        count: 2,
      });

      // Act
      await service.createDefaultTeams(sessionUid);

      // Assert
      const createCall = mockPrismaService.sessionTeams.createMany.mock.calls[0][0];
      expect(createCall.data).toHaveLength(2);
      expect(createCall.data[0]).toMatchObject({
        sessionUid: sessionUid,
        teamLabel: TeamLabels.A,
        teamName: 'Team A',
      });
      expect(createCall.data[1]).toMatchObject({
        sessionUid: sessionUid,
        teamLabel: TeamLabels.B,
        teamName: 'Team B',
      });
    });
  });

  describe('findTeamsBySessionUid', () => {
    const sessionUid = 'test-session-uid-123';
    const mockTeams = [
      {
        uid: 'team-uid-1',
        sessionUid: sessionUid,
        teamLabel: TeamLabels.A,
        teamName: 'Team A',
        createdAt: new Date('2023-01-01T12:00:00Z'),
        updatedAt: new Date('2023-01-01T12:00:00Z'),
        sessionPlayers: [],
      },
      {
        uid: 'team-uid-2',
        sessionUid: sessionUid,
        teamLabel: TeamLabels.B,
        teamName: 'Team B',
        createdAt: new Date('2023-01-01T12:00:00Z'),
        updatedAt: new Date('2023-01-01T12:00:00Z'),
        sessionPlayers: [],
      },
    ];

    it('should return teams for a given session', async () => {
      // Arrange
      mockPrismaService.sessionTeams.findMany.mockResolvedValue(mockTeams);

      // Act
      const result = await service.findTeamsBySessionUid(sessionUid);

      // Assert
      expect(result).toEqual({
        items: [
          {
            teamName: 'Team A',
            teamLabel: TeamLabels.A,
            numberOfPlayers: 0,
            sessionPlayers: [],
            teamUid: 'team-uid-1',
          },
          {
            teamName: 'Team B',
            teamLabel: TeamLabels.B,
            numberOfPlayers: 0,
            sessionPlayers: [],
            teamUid: 'team-uid-2',
          },
        ],
        totalCount: 2,
        nextCursor: null,
      });
      expect(mockPrismaService.sessionTeams.findMany).toHaveBeenCalledWith({
        where: {
          sessionUid: sessionUid,
        },
        include: {
          sessionPlayers: {
            select: {
              userUid: true,
              teamUid: true,
              user: {
                select: {
                  firstname: true,
                  lastname: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });
    });

    it('should return empty array when no teams found', async () => {
      // Arrange
      mockPrismaService.sessionTeams.findMany.mockResolvedValue([]);

      // Act
      const result = await service.findTeamsBySessionUid(sessionUid);

      // Assert
      expect(result).toEqual({
        items: [],
        totalCount: 0,
        nextCursor: null,
      });
      expect(mockPrismaService.sessionTeams.findMany).toHaveBeenCalledWith({
        where: {
          sessionUid: sessionUid,
        },
        include: {
          sessionPlayers: {
            select: {
              userUid: true,
              teamUid: true,
              user: {
                select: {
                  firstname: true,
                  lastname: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });
    });

    it('should handle single team result', async () => {
      // Arrange
      const singleTeam = [
        {
          ...mockTeams[0],
          sessionPlayers: [],
        },
      ];
      mockPrismaService.sessionTeams.findMany.mockResolvedValue(singleTeam);

      // Act
      const result = await service.findTeamsBySessionUid(sessionUid);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.nextCursor).toBeNull();
    });

    it('should handle database errors when finding teams', async () => {
      // Arrange
      const databaseError = new Error('Database query failed');
      mockPrismaService.sessionTeams.findMany.mockRejectedValue(databaseError);

      // Act & Assert
      await expect(service.findTeamsBySessionUid(sessionUid)).rejects.toThrow(databaseError);
      expect(mockPrismaService.sessionTeams.findMany).toHaveBeenCalledWith({
        where: {
          sessionUid: sessionUid,
        },
        include: {
          sessionPlayers: {
            select: {
              userUid: true,
              teamUid: true,
              user: {
                select: {
                  firstname: true,
                  lastname: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });
    });

    it('should maintain proper return type structure', async () => {
      // Arrange
      mockPrismaService.sessionTeams.findMany.mockResolvedValue(mockTeams);

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
    const teamUid = 'team-uid-123';
    const mockTeamFromDb = {
      sessionUid: 'session-uid-123',
      teamLabel: TeamLabels.A,
      teamName: 'Team A',
      sessionPlayers: [
        {
          userUid: 'user-1',
          teamUid: teamUid,
          user: {
            firstname: 'John',
            lastname: 'Doe',
            imageUrl: 'image1.jpg',
          },
        },
        {
          userUid: 'user-2',
          teamUid: teamUid,
          user: {
            firstname: 'Jane',
            lastname: 'Smith',
            imageUrl: 'image2.jpg',
          },
        },
      ],
    };

    const expectedFindUniqueCall = {
      where: {
        uid: teamUid,
      },
      select: {
        sessionPlayers: {
          select: {
            teamUid: true,
            user: {
              select: {
                firstname: true,
                imageUrl: true,
                lastname: true,
              },
            },
            userUid: true,
          },
        },
        sessionUid: true,
        teamLabel: true,
        teamName: true,
      },
    };

    it('should return a team with players when found', async () => {
      // Arrange
      mockPrismaService.sessionTeams.findUnique.mockResolvedValue(mockTeamFromDb);

      // Act
      const result = await service.findOneByUid(teamUid);

      // Assert
      expect(result.teamName).toBe('Team A');
      expect(result.teamLabel).toBe(TeamLabels.A);
      expect(result.numberOfPlayers).toBe(2);
      expect(result.sessionPlayers).toHaveLength(2);
      expect(mockPrismaService.sessionTeams.findUnique).toHaveBeenCalledWith(
        expectedFindUniqueCall,
      );
    });

    it('should return null when team not found', async () => {
      // Arrange
      mockPrismaService.sessionTeams.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.findOneByUid('non-existent-uid');

      // Assert
      expect(result).toBeNull();
      expect(mockPrismaService.sessionTeams.findUnique).toHaveBeenCalledWith({
        where: {
          uid: 'non-existent-uid',
        },
        select: {
          sessionPlayers: {
            select: {
              teamUid: true,
              user: {
                select: {
                  firstname: true,
                  imageUrl: true,
                  lastname: true,
                },
              },
              userUid: true,
            },
          },
          sessionUid: true,
          teamLabel: true,
          teamName: true,
        },
      });
    });

    it('should handle database errors when finding team', async () => {
      // Arrange
      const databaseError = new Error('Database connection lost');
      mockPrismaService.sessionTeams.findUnique.mockRejectedValue(databaseError);

      // Act & Assert
      await expect(service.findOneByUid(teamUid)).rejects.toThrow(databaseError);
      expect(mockPrismaService.sessionTeams.findUnique).toHaveBeenCalledWith(
        expectedFindUniqueCall,
      );
    });

    it('should handle empty string as uid', async () => {
      // Arrange
      mockPrismaService.sessionTeams.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.findOneByUid('');

      // Assert
      expect(result).toBeNull();
      expect(mockPrismaService.sessionTeams.findUnique).toHaveBeenCalledWith({
        where: {
          uid: '',
        },
        select: {
          sessionPlayers: {
            select: {
              teamUid: true,
              user: {
                select: {
                  firstname: true,
                  imageUrl: true,
                  lastname: true,
                },
              },
              userUid: true,
            },
          },
          sessionUid: true,
          teamLabel: true,
          teamName: true,
        },
      });
    });

    it('should return correct team properties', async () => {
      // Arrange
      mockPrismaService.sessionTeams.findUnique.mockResolvedValue(mockTeamFromDb);

      // Act
      const result = await service.findOneByUid(teamUid);

      // Assert
      expect(result.teamName).toBe('Team A');
      expect(result.teamLabel).toBe(TeamLabels.A);
      expect(result.numberOfPlayers).toBe(2);
    });

    it('should return team with zero players when team is empty', async () => {
      // Arrange
      const emptyTeam = {
        ...mockTeamFromDb,
        sessionPlayers: [],
      };
      mockPrismaService.sessionTeams.findUnique.mockResolvedValue(emptyTeam);

      // Act
      const result = await service.findOneByUid(teamUid);

      // Assert
      expect(result.numberOfPlayers).toBe(0);
      expect(result.sessionPlayers).toHaveLength(0);
      expect(mockPrismaService.sessionTeams.findUnique).toHaveBeenCalledWith(
        expectedFindUniqueCall,
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should handle concurrent team creation and retrieval', async () => {
      // Arrange
      const sessionUid = 'concurrent-session-123';
      const mockTeams = [
        {
          uid: 'team-1',
          sessionUid: sessionUid,
          teamLabel: TeamLabels.A,
          teamName: 'Team A',
          createdAt: new Date(),
          updatedAt: new Date(),
          sessionPlayers: [],
        },
        {
          uid: 'team-2',
          sessionUid: sessionUid,
          teamLabel: TeamLabels.B,
          teamName: 'Team B',
          createdAt: new Date(),
          updatedAt: new Date(),
          sessionPlayers: [],
        },
      ];

      mockPrismaService.sessionTeams.createMany.mockResolvedValue({ count: 2 });
      mockPrismaService.sessionTeams.findMany.mockResolvedValue(mockTeams);

      // Act
      await service.createDefaultTeams(sessionUid);
      const result = await service.findTeamsBySessionUid(sessionUid);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(logger.info).toHaveBeenCalledWith(`Default teams created for session ${sessionUid}`);
    });

    it('should maintain data consistency across operations', async () => {
      // Arrange
      const sessionUid = 'consistency-test-session';
      const teamUid = 'consistency-test-team';

      const mockTeamFromDbForFindOne = {
        sessionUid: sessionUid,
        teamLabel: TeamLabels.A,
        teamName: 'Team A',
        sessionPlayers: [
          {
            userUid: 'user-1',
            teamUid: teamUid,
            user: {
              firstname: 'John',
              lastname: 'Doe',
              imageUrl: null,
            },
          },
          {
            userUid: 'user-2',
            teamUid: teamUid,
            user: {
              firstname: 'Jane',
              lastname: 'Smith',
              imageUrl: null,
            },
          },
        ],
      };

      const mockTeamWithPlayersForFindMany = {
        uid: teamUid,
        sessionUid: sessionUid,
        teamLabel: TeamLabels.A,
        teamName: 'Team A',
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionPlayers: [
          {
            userUid: 'user-1',
            teamUid: teamUid,
            user: {
              firstname: 'John',
              lastname: 'Doe',
              imageUrl: null,
            },
          },
          {
            userUid: 'user-2',
            teamUid: teamUid,
            user: {
              firstname: 'Jane',
              lastname: 'Smith',
              imageUrl: null,
            },
          },
        ],
      };

      mockPrismaService.sessionTeams.findMany.mockResolvedValue([mockTeamWithPlayersForFindMany]);
      mockPrismaService.sessionTeams.findUnique.mockResolvedValue(mockTeamFromDbForFindOne);

      // Act
      const allTeams = await service.findTeamsBySessionUid(sessionUid);
      const singleTeam = await service.findOneByUid(teamUid);

      // Assert
      expect(allTeams.items[0].teamName).toBe('Team A');
      expect(allTeams.items[0].teamLabel).toBe(TeamLabels.A);
      expect(singleTeam).toMatchObject({
        teamLabel: TeamLabels.A,
        teamName: 'Team A',
        numberOfPlayers: 2,
      });
      expect(allTeams.items[0].numberOfPlayers).toBe(singleTeam?.numberOfPlayers);
    });
  });
});
