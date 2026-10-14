import { faker, fakerTH } from '@faker-js/faker';
import { verifyPassword } from '../../src/auth/passwords';
import { isValidThaiNationalId } from '../../src/domain/thaiNationalId';
import { aCandidate, aCommissioner, aParty, aVoter, DEFAULT_PASSWORD } from '../support/builders';

describe('test data builders', () => {
  it('gives every built user a national id that passes the checksum', () => {
    const ids = Array.from({ length: 50 }, () => aVoter().build().nationalId);

    expect(ids.filter((id) => !isValidThaiNationalId(id))).toEqual([]);
  });

  it('fills a user with Thai names and the default password', () => {
    const user = aVoter().build();

    expect(user.firstName).toMatch(/[฀-๿]/);
    expect(verifyPassword(DEFAULT_PASSWORD, user.passwordHash)).toBe(true);
  });

  it('keeps the values the test asked for', () => {
    const user = aCommissioner().inDistrict('CM-2').withNationalId('1509900000017').build();

    expect(user).toMatchObject({ role: 'COMMISSIONER', districtId: 'CM-2', nationalId: '1509900000017' });
  });

  it('builds the same data again from the same seed', () => {
    faker.seed(42);
    fakerTH.seed(42);
    const first = aVoter().build();

    faker.seed(42);
    fakerTH.seed(42);
    const second = aVoter().build();

    expect(second).toEqual(first);
  });

  it('builds a party and a candidate with only the important values set', () => {
    const party = aParty().named('พรรคดอยสุเทพ').build();
    const candidate = aCandidate().inDistrict('CM-2').forParty(7).numbered(3).build();

    expect(party.name).toBe('พรรคดอยสุเทพ');
    expect(candidate).toMatchObject({ districtId: 'CM-2', partyId: 7, number: 3 });
  });
});
