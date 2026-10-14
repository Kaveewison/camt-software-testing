// GIVEN: put the data a component test needs straight into the real database,
// through the real repositories. Builders decide what the data looks like.
import { Pool } from 'pg';
import { JwtTokenService } from '../../../src/auth/tokenService';
import { Candidate, Party, User } from '../../../src/domain/types';
import { PgCandidateRepository } from '../../../src/repositories/candidateRepository';
import { PgPartyRepository } from '../../../src/repositories/partyRepository';
import { PgUserRepository } from '../../../src/repositories/userRepository';
import { aParty, CandidateBuilder, PartyBuilder, UserBuilder } from '../../support/builders';

// The same secret the app is created with, so the app accepts these tokens.
// (The legacy vote routes read JWT_SECRET from the environment directly.)
export const testTokens = new JwtTokenService(process.env.JWT_SECRET!);

export function givenFor(pool: Pool) {
  const users = new PgUserRepository(pool);
  const parties = new PgPartyRepository(pool);
  const candidates = new PgCandidateRepository(pool);

  return {
    async user(builder: UserBuilder): Promise<User> {
      const { role, ...newUser } = builder.build();
      const created = await users.create(newUser);
      // Every new user starts as VOTER; promote it if the builder asked for another role.
      return role === created.role ? created : (await users.updateRole(created.id, role))!;
    },

    async party(builder: PartyBuilder = aParty()): Promise<Party> {
      return parties.create(builder.build());
    },

    async candidate(builder: CandidateBuilder): Promise<Candidate> {
      return candidates.create(builder.build());
    },
  };
}

/** Log in without calling POST /auth/login in every test. */
export function authHeader(user: User): string {
  return `Bearer ${testTokens.issue({ userId: user.id, role: user.role, districtId: user.districtId })}`;
}
