// Lab 04 — component tests: the whole app in-process + real Postgres.
// Data comes from builders (test/support/builders.ts), inserted through given.ts.
// Every test starts from an empty database (Fresh Fixture).
import request from 'supertest';
import { Pool } from 'pg';
import { createApp, pgDeps } from '../../src/app';
import { pool as legacyPool } from '../../src/db';
import { aCandidate, aCommissioner, anAdmin, aParty, aVoter } from '../support/builders';
import { createTestPool, truncateAll } from './support/database';
import { authHeader, givenFor, testTokens } from './support/given';

describe('election management (component)', () => {
  let pool: Pool;
  let app: ReturnType<typeof createApp>;
  let given: ReturnType<typeof givenFor>;

  beforeAll(() => {
    pool = createTestPool();
    app = createApp(pgDeps(pool, testTokens));
    given = givenFor(pool);
  });

  beforeEach(async () => {
    await truncateAll(pool);
  });

  afterAll(async () => {
    await pool.end();
    await legacyPool.end();
  });

  describe('POST /parties', () => {
    const newParty = { name: 'พรรคดอยสุเทพ', policy: 'รถแดงไฟฟ้าทุกเส้นทาง' };

    it('lets a commissioner create a party', async () => {
      const commissioner = await given.user(aCommissioner());

      const res = await request(app).post('/parties').set('Authorization', authHeader(commissioner)).send(newParty);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ id: expect.any(Number), name: 'พรรคดอยสุเทพ' });
    });

    it('forbids a voter (403)', async () => {
      const voter = await given.user(aVoter());

      const res = await request(app).post('/parties').set('Authorization', authHeader(voter)).send(newParty);

      expect(res.status).toBe(403);
    });

    it('requires a token (401)', async () => {
      const res = await request(app).post('/parties').send(newParty);

      expect(res.status).toBe(401);
    });

    it('rejects a duplicate party name (409)', async () => {
      const commissioner = await given.user(aCommissioner());
      await given.party(aParty().named('พรรคดอยสุเทพ'));

      const res = await request(app).post('/parties').set('Authorization', authHeader(commissioner)).send(newParty);

      expect(res.status).toBe(409);
    });
  });

  describe('POST /districts/:id/candidates', () => {
    it('adds a candidate that then appears in the public results of that district', async () => {
      const commissioner = await given.user(aCommissioner());
      const party = await given.party();

      const added = await request(app)
        .post('/districts/CM-2/candidates')
        .set('Authorization', authHeader(commissioner))
        .send({ partyId: party.id, number: 3, firstName: 'สมหญิง', lastName: 'รักเชียงใหม่' });
      const results = await request(app).get('/districts/CM-2/results');

      expect(added.status).toBe(201);
      expect(results.body.candidates).toEqual([
        { number: 3, firstName: 'สมหญิง', lastName: 'รักเชียงใหม่', partyName: party.name },
      ]);
    });
  });

  describe('PATCH /admin/users/:id/role', () => {
    it('lets an admin promote a voter to commissioner', async () => {
      const admin = await given.user(anAdmin());
      const voter = await given.user(aVoter());

      const res = await request(app)
        .patch(`/admin/users/${voter.id}/role`)
        .set('Authorization', authHeader(admin))
        .send({ role: 'COMMISSIONER' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: voter.id, role: 'COMMISSIONER' });
    });
  });

  describe('GET /me/candidates', () => {
    it('shows a voter only the candidates of their own district', async () => {
      const party = await given.party();
      const otherParty = await given.party();
      await given.candidate(aCandidate().inDistrict('CM-1').forParty(party.id).numbered(1));
      await given.candidate(aCandidate().inDistrict('CM-2').forParty(otherParty.id).numbered(1));
      const voter = await given.user(aVoter().inDistrict('CM-1'));

      const res = await request(app).get('/me/candidates').set('Authorization', authHeader(voter));

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ number: 1, party: party.name });
    });
  });
});
