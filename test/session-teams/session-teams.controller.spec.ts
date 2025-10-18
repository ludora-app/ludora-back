import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthB2CGuard } from 'src/auth-b2c/guards/auth-b2c.guard';
import { SessionTeamsController } from 'src/session-teams/session-teams.controller';
import { SessionTeamsService } from 'src/session-teams/session-teams.service';
import { SessionsService } from 'src/sessions/sessions.service';

describe('SessionTeamsController', () => {
  let controller: SessionTeamsController;

  const mockSessionTeamsService = {
    createDefaultTeams: jest.fn(),
    findTeamsBySessionUid: jest.fn(),
    findOneByUid: jest.fn(),
  };

  const mockSessionsService = {
    findOne: jest.fn(),
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
      mockSessionsService.findOne.mockResolvedValue({ uid: 'session-1' });
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

      const result = await controller.findTeamsBySessionUid('session-1');

      expect(mockSessionsService.findOne).toHaveBeenCalledWith('session-1');
      expect(mockSessionTeamsService.findTeamsBySessionUid).toHaveBeenCalledWith('session-1');
      expect(result.status).toBe(200);
      expect(result.data.items.length).toBe(1);
      expect(result.message).toContain('session-1');
    });

    it('throws NotFound if session does not exist', async () => {
      mockSessionsService.findOne.mockResolvedValue(null);

      await expect(controller.findTeamsBySessionUid('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockSessionsService.findOne).toHaveBeenCalledWith('missing');
      expect(mockSessionTeamsService.findTeamsBySessionUid).not.toHaveBeenCalled();
    });

    it('throws NotFound if no teams found', async () => {
      mockSessionsService.findOne.mockResolvedValue({ uid: 'session-1' });
      mockSessionTeamsService.findTeamsBySessionUid.mockResolvedValue({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });

      await expect(controller.findTeamsBySessionUid('session-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockSessionsService.findOne).toHaveBeenCalledWith('session-1');
      expect(mockSessionTeamsService.findTeamsBySessionUid).toHaveBeenCalledWith('session-1');
    });
  });

  describe('findOneTeamByUid', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns team when found', async () => {
      mockSessionTeamsService.findOneByUid.mockResolvedValue({ uid: 'team-1', teamName: 'Team A' });

      const result = await controller.findOneTeamByUid('team-1');

      expect(mockSessionTeamsService.findOneByUid).toHaveBeenCalledWith('team-1');
      expect(result.status).toBe(200);
      expect(result.data.uid).toBe('team-1');
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
