import { Test, TestingModule } from '@nestjs/testing';
import { SessionInvitationsController } from '../../src/session-invitations/session-invitations.controller';
import { SessionInvitationsService } from '../../src/session-invitations/session-invitations.service';

describe('SessionInvitationsController', () => {
  let controller: SessionInvitationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionInvitationsController],
      providers: [SessionInvitationsService],
    }).compile();

    controller = module.get<SessionInvitationsController>(SessionInvitationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
