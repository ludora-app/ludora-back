import { Test, TestingModule } from '@nestjs/testing';
import { SessionInvitationsController } from '../../src/session-invitations/session-invitations.controller';
import { SessionInvitationsService } from '../../src/session-invitations/session-invitations.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateSessionInvitationDto } from '../../src/session-invitations/dto/input/create-session-invitation.dto';
import { UpdateSessionInvitationDto } from '../../src/session-invitations/dto/input/update-session-invitation.dto';
import { SessionInvitationFilterDto } from '../../src/session-invitations/dto/input/session-invitation-filter.dto';
import { AuthB2CGuard } from '../../src/auth-b2c/guards/auth-b2c.guard';

describe('SessionInvitationsController', () => {
  let controller: SessionInvitationsController;

  const mockSessionInvitationsService = {
    create: jest.fn(),
    findAllByReceiverId: jest.fn(),
    findAllBySessionId: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionInvitationsController],
      providers: [
        {
          provide: SessionInvitationsService,
          useValue: mockSessionInvitationsService,
        },
      ],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<SessionInvitationsController>(SessionInvitationsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an invitation and wrap response', async () => {
      const req: any = { user: { uid: 'sender-1' } };
      const dto: CreateSessionInvitationDto = {
        sessionUid: 'sess-1',
        receiverUid: 'user-2',
      };
      const invitation = {
        sessionUid: 'sess-1',
        senderUid: 'sender-1',
        receiverUid: 'user-2',
        status: 'PENDING',
      } as any;

      mockSessionInvitationsService.create.mockResolvedValue(invitation);

      await expect(controller.create(req, dto)).resolves.toEqual({
        data: invitation,
        message: 'Session invitation created successfully',
        status: 201,
      });
      expect(mockSessionInvitationsService.create).toHaveBeenCalledWith('sender-1', dto);
    });

    it('should throw BadRequestException when service returns null', async () => {
      const req: any = { user: { uid: 'sender-1' } };
      const dto: CreateSessionInvitationDto = {
        sessionUid: 'sess-1',
        receiverUid: 'user-2',
      };
      mockSessionInvitationsService.create.mockResolvedValue(null);

      await expect(controller.create(req, dto)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findAllByUserId', () => {
    it('should return paginated invitations for a user', async () => {
      const userUid = 'user-2';
      const filter = { limit: 10 } as SessionInvitationFilterDto;
      const data = {
        items: [
          { sessionUid: 'sess-1', senderUid: 'sender-1', receiverUid: 'user-2', status: 'PENDING' },
        ],
        nextCursor: null,
        totalCount: 1,
      };
      mockSessionInvitationsService.findAllByReceiverId.mockResolvedValue(data);

      await expect(controller.findAllByUserId(userUid, filter)).resolves.toEqual({
        data,
        message: 'Session invitations fetched successfully',
        status: 200,
      });
      expect(mockSessionInvitationsService.findAllByReceiverId).toHaveBeenCalledWith(
        userUid,
        filter,
      );
    });
  });

  describe('findAllBySessionId', () => {
    it('should return paginated invitations for a session', async () => {
      const sessionUid = 'sess-1';
      const filter = { limit: 10 } as SessionInvitationFilterDto;
      const data = {
        items: [
          { sessionUid: 'sess-1', senderUid: 'sender-1', receiverUid: 'user-2', status: 'PENDING' },
        ],
        nextCursor: null,
        totalCount: 1,
      };
      mockSessionInvitationsService.findAllBySessionId.mockResolvedValue(data);

      await expect(controller.findAllBySessionId(sessionUid, filter)).resolves.toEqual({
        data,
        message: 'Session invitations fetched successfully',
        status: 200,
      });
      expect(mockSessionInvitationsService.findAllBySessionId).toHaveBeenCalledWith(
        sessionUid,
        filter,
      );
    });
  });

  describe('findOne', () => {
    it('should return an invitation when found', async () => {
      const sessionUid = 'sess-1';
      const receiverUid = 'user-2';
      const invitation = {
        sessionUid: 'sess-1',
        senderUid: 'sender-1',
        receiverUid: 'user-2',
        status: 'PENDING',
      } as any;
      mockSessionInvitationsService.findOne.mockResolvedValue(invitation);

      await expect(controller.findOne(sessionUid, receiverUid)).resolves.toEqual({
        data: invitation,
        message: 'Session invitation fetched successfully',
        status: 200,
      });
      expect(mockSessionInvitationsService.findOne).toHaveBeenCalledWith(sessionUid, receiverUid);
    });

    it('should throw NotFoundException when not found', async () => {
      const sessionUid = 'sess-1';
      const receiverUid = 'user-2';
      mockSessionInvitationsService.findOne.mockResolvedValue(null);

      await expect(controller.findOne(sessionUid, receiverUid)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should call service.update and return void', async () => {
      const sessionUid = 'sess-1';
      const body = { status: 'ACCEPTED' as any };
      const req: any = { user: { uid: 'user-2' } };

      mockSessionInvitationsService.update.mockResolvedValue(undefined);

      await expect(controller.update(sessionUid, body, req)).resolves.toBeUndefined();
      expect(mockSessionInvitationsService.update).toHaveBeenCalledWith({
        sessionUid: 'sess-1',
        status: 'ACCEPTED',
        userUid: 'user-2',
      });
    });
  });

  describe('remove', () => {
    it('should call service.remove and return its message', async () => {
      const sessionUid = 'sess-1';
      const userUid = 'user-2';
      const message = `This action removes session invitation for session ${sessionUid} and user ${userUid}`;
      mockSessionInvitationsService.remove.mockResolvedValue(message);

      await expect(controller.remove(sessionUid, userUid)).resolves.toBe(message);
      expect(mockSessionInvitationsService.remove).toHaveBeenCalledWith(sessionUid, userUid);
    });
  });
});
