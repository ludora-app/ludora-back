import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { SessionTeamsController } from 'src/sessions/controllers/session-teams.controller';
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

    it('returns teams when session exists and teams found', async () => {
      mockSessionsService.findTeamsBySessionUid.mockResolvedValue({
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

      const result = await controller.findTeamsBySessionUid('session-1');

      expect(mockSessionsService.findTeamsBySessionUid).toHaveBeenCalledWith('session-1');
      expect(result.data.items.length).toBe(1);
      expect(result.message).toContain('session-1');
    });

    it('throws NotFound if no teams found', async () => {
      mockSessionsService.findTeamsBySessionUid.mockResolvedValue({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });

      await expect(controller.findTeamsBySessionUid('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockSessionsService.findTeamsBySessionUid).toHaveBeenCalledWith('missing');
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
