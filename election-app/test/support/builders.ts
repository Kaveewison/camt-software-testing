// TEST DATA BUILDERS: a test states only the values it cares about;
// everything else is filled in with realistic Thai data from faker.
import { faker, fakerTH } from '@faker-js/faker';
import { Candidate, Constituency, Party, User } from '../../src/generated/prisma';

/** The 13th digit of a Thai national id, from its first 12 digits. */
function checksumDigit(first12: string): number {
  const sum = [...first12].reduce((acc, digit, i) => acc + Number(digit) * (13 - i), 0);
  return (11 - (sum % 11)) % 10;
}

export function aValidNationalId(): string {
  const first12 = faker.string.numeric({ length: 12, allowLeadingZeros: false });
  return first12 + checksumDigit(first12);
}

export function aConstituency(overrides: Partial<Constituency> = {}): Constituency {
  return {
    id: faker.number.int({ min: 1, max: 400 }),
    province: fakerTH.location.state(),
    districtNumber: faker.number.int({ min: 1, max: 10 }),
    isClosed: false,
    ...overrides,
  };
}

/** A user as userRepo.findById returns it (with its constituency). */
export function aUser(overrides: Partial<User> = {}): User & { constituency: Constituency } {
  const user: User = {
    id: faker.number.int({ min: 1, max: 100_000 }),
    nationalId: aValidNationalId(),
    laserCode: null,
    title: faker.helpers.arrayElement(['นาย', 'นาง', 'นางสาว']),
    firstName: fakerTH.person.firstName(),
    lastName: fakerTH.person.lastName(),
    address: fakerTH.location.streetAddress(),
    imageUrl: null,
    role: 'VOTER',
    constituencyId: 1,
    ...overrides,
  };
  return { ...user, constituency: aConstituency({ id: user.constituencyId }) };
}

export function aParty(overrides: Partial<Party> = {}): Party {
  return {
    id: faker.number.int({ min: 1, max: 100 }),
    name: `พรรค${fakerTH.person.lastName()}`,
    logoUrl: null,
    policy: faker.lorem.sentence(),
    ...overrides,
  };
}

export function aCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: faker.number.int({ min: 1, max: 100_000 }),
    candidateNumber: faker.number.int({ min: 1, max: 20 }),
    policy: faker.lorem.sentence(),
    userId: faker.number.int({ min: 1, max: 100_000 }),
    partyId: faker.number.int({ min: 1, max: 100 }),
    constituencyId: 1,
    ...overrides,
  };
}
