import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyRequest } from 'fastify';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionTeamsController } from 'src/sessions/controllers/session-teams.controller';
import { SessionsPipe } from 'src/sessions/pipes/sessions.pipe';
import { SessionTeamsService } from 'src/sessions/services/session-teams.service';
import { SessionsService } from 'src/sessions/services/sessions.service';

describe('SessionTeamsController', () => {
  let controller: SessionTeamsController;

  const mockSessionTeamsService = {
    createDefaultTeams: jest.fn(),
    findTeamsBySessionUid: jest.fn(),
    findOneByUid: jest.fn(),
  };

  const mockSessionsService = {
    findOne: jest.fn(),
    findTeamsBySessionUid: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockPrismaService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionTeamsController],
      providers: [
        {
          provide: SessionTeamsService,
          useValue: mockSessionTeamsService,
        },
        {
          provide: SessionsService,
          useValue: mockSessionsService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        SessionsPipe,
      ],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<SessionTeamsController>(SessionTeamsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findTeamsBySessionUid', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const mockSession = { uid: 'session-1' } as any;

    it('returns teams when session exists and teams found', async () => {
      mockSessionTeamsService.findTeamsBySessionUid.mockResolvedValue({
        items: [
          {
            uid: 'team-1',
            teamLabel: 'A',
            teamName: 'Team A',
          },
        ],
        nextCursor: null,
        totalCount: 1,
      });

      const mockRequest = { user: { uid: 'test-user-uid' } } as unknown as FastifyRequest;
      const result = await controller.findTeamsBySessionUid(mockSession, mockRequest);

      expect(mockSessionTeamsService.findTeamsBySessionUid).toHaveBeenCalledWith(
        'session-1',
        'test-user-uid',
      );
      expect(result.data.items.length).toBe(1);
      expect(result.message).toContain('session-1');
    });

    it('throws NotFound if no teams found', async () => {
      mockSessionTeamsService.findTeamsBySessionUid.mockResolvedValue({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });

      const mockRequest = { user: { uid: 'test-user-uid' } } as unknown as FastifyRequest;
      await expect(
        controller.findTeamsBySessionUid({ uid: 'missing' } as any, mockRequest),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mockSessionTeamsService.findTeamsBySessionUid).toHaveBeenCalledWith(
        'missing',
        'test-user-uid',
      );
    });
  });

  describe('findOneTeamByUid', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns team when found', async () => {
      mockSessionTeamsService.findOneByUid.mockResolvedValue({
        teamName: 'Team A',
        teamLabel: 'A',
        numberOfPlayers: 3,
      });

      const result = await controller.findOneTeamByUid('team-1');

      expect(mockSessionTeamsService.findOneByUid).toHaveBeenCalledWith('team-1');
      expect(result.data.teamName).toBe('Team A');
      expect(result.data.numberOfPlayers).toBe(3);
    });

    it('throws NotFound if team not found', async () => {
      mockSessionTeamsService.findOneByUid.mockResolvedValue(null);

      await expect(controller.findOneTeamByUid('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockSessionTeamsService.findOneByUid).toHaveBeenCalledWith('missing');
    });
  });
});
