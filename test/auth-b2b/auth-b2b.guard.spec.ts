import { AuthB2bGuard } from '../../src/auth-b2b/guards/auth-b2b.guard';

describe('AuthB2bGuard', () => {
  it('should be defined', () => {
    expect(new AuthB2bGuard()).toBeDefined();
  });
});
