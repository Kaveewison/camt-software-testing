import { User } from '../../src/domain/types';
import { toPublicUser } from '../../src/services/accountService';

describe('toPublicUser', () => {
  const user: User = {
    id: 1,
    nationalId: '1509900000017',
    passwordHash: 'scrypt$salt$hash',
    firstName: 'Somchai',
    lastName: 'Jaidee',
    address: '239 Huay Kaew Rd',
    districtId: 'CM-1',
    role: 'VOTER',
  };

  it('does not expose the password hash', () => {
    const publicUser = toPublicUser(user);

    expect(publicUser).not.toHaveProperty('passwordHash');
  });

  it('keeps every other field of the user', () => {
    const publicUser = toPublicUser(user);

    expect(publicUser).toEqual({
      id: 1,
      nationalId: '1509900000017',
      firstName: 'Somchai',
      lastName: 'Jaidee',
      address: '239 Huay Kaew Rd',
      districtId: 'CM-1',
      role: 'VOTER',
    });
  });
});
