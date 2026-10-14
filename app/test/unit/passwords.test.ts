import { hashPassword, verifyPassword } from '../../src/auth/passwords';

describe('hashPassword', () => {
  it('does not return the plain text password', () => {
    const password = 'voter1234';

    const hash = hashPassword(password);

    expect(hash).not.toBe(password);
  });

  it('gives a different hash each time for the same password (salted)', () => {
    const password = 'voter1234';

    const first = hashPassword(password);
    const second = hashPassword(password);

    expect(second).not.toBe(first);
  });
});

describe('verifyPassword', () => {
  it('returns true for the correct password', () => {
    const stored = hashPassword('voter1234');

    const ok = verifyPassword('voter1234', stored);

    expect(ok).toBe(true);
  });

  it('returns false for a wrong password', () => {
    const stored = hashPassword('voter1234');

    const ok = verifyPassword('voter12345', stored);

    expect(ok).toBe(false);
  });

  it('returns false (without throwing) when the stored hash is malformed', () => {
    const stored = 'garbage';

    const ok = verifyPassword('voter1234', stored);

    expect(ok).toBe(false);
  });
});
