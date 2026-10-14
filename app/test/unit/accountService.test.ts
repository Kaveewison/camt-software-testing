import { hashPassword } from '../../src/auth/passwords';
import { Principal, TokenService } from '../../src/auth/tokenService';
import { District, Role, User } from '../../src/domain/types';
import { UnauthorizedError, ValidationError } from '../../src/errors';
import { DistrictRepository } from '../../src/repositories/districtRepository';
import { NewUser, UserRepository } from '../../src/repositories/userRepository';
import { AccountService, Registration } from '../../src/services/accountService';

const CM1: District = { id: 'CM-1', province: 'เชียงใหม่', number: 1 };

function aRegistration(overrides: Partial<Registration> = {}): Registration {
  return {
    nationalId: '1509900000017',
    password: 'voter1234',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    address: 'CAMT',
    districtId: 'CM-1',
    ...overrides,
  };
}

function aUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    nationalId: '1509900000017',
    passwordHash: hashPassword('voter1234'),
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    address: 'CAMT',
    districtId: 'CM-1',
    role: 'VOTER',
    ...overrides,
  };
}

/** Stub: always answers with the districts it was given. */
function stubDistricts(...districts: District[]): DistrictRepository {
  return {
    findAll: async () => districts,
    findById: async (id) => districts.find((d) => d.id === id) ?? null,
  };
}

/** Dummy: has to be passed in, must never be used. */
const dummyTokens: TokenService = {
  issue: () => {
    throw new Error('dummy should not be used');
  },
  verify: () => {
    throw new Error('dummy should not be used');
  },
};

/** Fake: a working user store kept in memory. */
class InMemoryUserRepository implements UserRepository {
  private readonly users: User[] = [];

  async findById(id: number) {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async findByNationalId(nationalId: string) {
    return this.users.find((u) => u.nationalId === nationalId) ?? null;
  }

  async create(newUser: NewUser) {
    const user: User = { ...newUser, id: this.users.length + 1, role: 'VOTER' };
    this.users.push(user);
    return user;
  }

  async updateRole(id: number, role: Role) {
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    user.role = role;
    return user;
  }
}

describe('AccountService', () => {
  describe('register', () => {
    it('registers a voter in an existing district (stub DistrictRepository, dummy TokenService)', async () => {
      // Stub: districts answers "CM-1 exists" so register can get past the district check.
      // Fake: users starts empty and really stores the new user.
      // Dummy: register never issues a token, so tokens throws if it is touched.
      const service = new AccountService(new InMemoryUserRepository(), stubDistricts(CM1), dummyTokens);

      const user = await service.register(aRegistration());

      expect(user).toMatchObject({ nationalId: '1509900000017', districtId: 'CM-1', role: 'VOTER' });
    });

    it('rejects an unknown district', async () => {
      // Stub: no districts at all, so findById returns null.
      const service = new AccountService(new InMemoryUserRepository(), stubDistricts(), dummyTokens);

      const registering = service.register(aRegistration({ districtId: 'XX-9' }));

      await expect(registering).rejects.toThrow(ValidationError);
    });

    it('stores a hash, never the plain-text password (spy on UserRepository.create)', async () => {
      // Spy: wraps the fake's create so we can look afterwards at what register sent to the database.
      const users = new InMemoryUserRepository();
      const create = jest.spyOn(users, 'create');
      const service = new AccountService(users, stubDistricts(CM1), dummyTokens);

      await service.register(aRegistration({ password: 'voter1234' }));

      const saved = create.mock.calls[0][0];
      expect(saved.passwordHash).not.toContain('voter1234');
      expect(saved.passwordHash).toMatch(/^scrypt\$/);
    });

    it('rejects a national id that is already registered (fake UserRepository)', async () => {
      // Fake: the first register really stores the user, so the second one finds it.
      // A jest.fn() stub would need us to script "null first, then the user" by hand.
      const service = new AccountService(new InMemoryUserRepository(), stubDistricts(CM1), dummyTokens);
      await service.register(aRegistration());

      const registeringAgain = service.register(aRegistration());

      await expect(registeringAgain).rejects.toThrow('national id already registered');
    });

    it('does not save anything when the national id is invalid (mock: create not called)', async () => {
      // Mock: we expect create NOT to be called; the test is about that interaction.
      const users: UserRepository = {
        findById: jest.fn(),
        findByNationalId: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        updateRole: jest.fn(),
      };
      const service = new AccountService(users, stubDistricts(CM1), dummyTokens);

      await expect(service.register(aRegistration({ nationalId: '1509900000018' }))).rejects.toThrow(ValidationError);

      expect(users.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('issues a token for the user (mock TokenService.issue called with the principal)', async () => {
      // Fake: users already holds a voter with this national id and password.
      // Mock: tokens.issue must be called with exactly this user's principal.
      const users = new InMemoryUserRepository();
      await users.create(aUser());
      const tokens: TokenService = {
        issue: jest.fn().mockReturnValue('signed-token'),
        verify: jest.fn(),
      };
      const service = new AccountService(users, stubDistricts(CM1), tokens);

      const token = await service.login('1509900000017', 'voter1234');

      expect(token).toBe('signed-token');
      expect(tokens.issue).toHaveBeenCalledWith<[Principal]>({ userId: 1, role: 'VOTER', districtId: 'CM-1' });
    });

    it('rejects a wrong password without issuing a token', async () => {
      // Mock: issue must never be called when the password is wrong.
      const users = new InMemoryUserRepository();
      await users.create(aUser());
      const tokens: TokenService = { issue: jest.fn(), verify: jest.fn() };
      const service = new AccountService(users, stubDistricts(CM1), tokens);

      await expect(service.login('1509900000017', 'wrong-password')).rejects.toThrow(UnauthorizedError);

      expect(tokens.issue).not.toHaveBeenCalled();
    });
  });

  describe('changeRole', () => {
    it('refuses to make anyone an ADMIN', async () => {
      // Mock: updateRole must not be reached once the role is rejected.
      const users = new InMemoryUserRepository();
      const updateRole = jest.spyOn(users, 'updateRole');
      const service = new AccountService(users, stubDistricts(CM1), dummyTokens);

      await expect(service.changeRole(1, 'ADMIN')).rejects.toThrow(ValidationError);

      expect(updateRole).not.toHaveBeenCalled();
    });
  });
});
