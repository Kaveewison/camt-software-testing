// TEST DATA BUILDERS: a test states only the values it cares about;
// everything else is filled in with realistic, valid data from faker.
import { faker, fakerTH } from '@faker-js/faker';
import { hashPassword } from '../../src/auth/passwords';
import { Role } from '../../src/domain/types';
import { NewCandidate } from '../../src/repositories/candidateRepository';
import { NewParty } from '../../src/repositories/partyRepository';
import { NewUser } from '../../src/repositories/userRepository';
import { aValidNationalId } from './nationalIds';

export const DEFAULT_PASSWORD = 'password123';

// scrypt is slow on purpose — hash the default password once, not once per user.
const DEFAULT_PASSWORD_HASH = hashPassword(DEFAULT_PASSWORD);

/** A user ready to insert, role included. */
export type UserSpec = NewUser & { role: Role };

export class UserBuilder {
  private readonly overrides: Partial<UserSpec> = {};

  constructor(private readonly role: Role) {}

  inDistrict(districtId: string): this {
    this.overrides.districtId = districtId;
    return this;
  }

  withNationalId(nationalId: string): this {
    this.overrides.nationalId = nationalId;
    return this;
  }

  withPassword(password: string): this {
    this.overrides.passwordHash = hashPassword(password);
    return this;
  }

  build(): UserSpec {
    // Always call faker in the same order, so the same seed gives the same user.
    return {
      nationalId: aValidNationalId(),
      firstName: fakerTH.person.firstName(),
      lastName: fakerTH.person.lastName(),
      address: fakerTH.location.streetAddress(),
      passwordHash: DEFAULT_PASSWORD_HASH,
      districtId: 'CM-1',
      role: this.role,
      ...this.overrides,
    };
  }
}

export const aVoter = () => new UserBuilder('VOTER');
export const aCommissioner = () => new UserBuilder('COMMISSIONER');
export const anAdmin = () => new UserBuilder('ADMIN');

export class PartyBuilder {
  private readonly overrides: Partial<NewParty> = {};

  named(name: string): this {
    this.overrides.name = name;
    return this;
  }

  build(): NewParty {
    return {
      name: `พรรค${fakerTH.person.lastName()} ${faker.string.alphanumeric(4)}`,
      logoUrl: null,
      policy: faker.lorem.sentence(),
      ...this.overrides,
    };
  }
}

export const aParty = () => new PartyBuilder();

export class CandidateBuilder {
  private readonly overrides: Partial<NewCandidate> = {};

  inDistrict(districtId: string): this {
    this.overrides.districtId = districtId;
    return this;
  }

  forParty(partyId: number): this {
    this.overrides.partyId = partyId;
    return this;
  }

  numbered(number: number): this {
    this.overrides.number = number;
    return this;
  }

  build(): NewCandidate {
    return {
      districtId: 'CM-1',
      partyId: 1,
      number: faker.number.int({ min: 1, max: 99 }),
      firstName: fakerTH.person.firstName(),
      lastName: fakerTH.person.lastName(),
      photoUrl: null,
      ...this.overrides,
    };
  }
}

export const aCandidate = () => new CandidateBuilder();
