import { ConflictError, ValidationError } from '../../src/errors';
import { CandidateInput, ElectionAdminService } from '../../src/services/electionAdminService';
import {
  InMemoryCandidateRepository,
  InMemoryDistrictRepository,
  InMemoryPartyRepository,
} from '../support/inMemoryRepositories';

// Fakes instead of jest.fn(): addCandidate reads findByDistrict before every insert,
// and the answer has to change as candidates are added. A fake remembers that by itself.
async function setUp() {
  const districts = new InMemoryDistrictRepository([
    { id: 'CM-1', province: 'เชียงใหม่', number: 1 },
    { id: 'CM-2', province: 'เชียงใหม่', number: 2 },
  ]);
  const parties = new InMemoryPartyRepository();
  const candidates = new InMemoryCandidateRepository(parties);
  const service = new ElectionAdminService(parties, candidates, districts);

  const partyA = await parties.create({ name: 'พรรค ก', logoUrl: null, policy: 'นโยบาย ก' });
  const partyB = await parties.create({ name: 'พรรค ข', logoUrl: null, policy: 'นโยบาย ข' });

  return { service, candidates, partyA, partyB };
}

function aCandidate(overrides: Partial<CandidateInput>): CandidateInput {
  return { partyId: 1, number: 1, firstName: 'สมหญิง', lastName: 'รักไทย', ...overrides };
}

describe('ElectionAdminService.addCandidate', () => {
  it('adds a candidate to a district', async () => {
    const { service, candidates, partyA } = await setUp();

    const added = await service.addCandidate('CM-1', aCandidate({ partyId: partyA.id, number: 1 }));

    expect(added).toMatchObject({ districtId: 'CM-1', number: 1, partyName: 'พรรค ก' });
    expect(await candidates.findByDistrict('CM-1')).toEqual([added]);
  });

  it('rejects a candidate number already used in the district', async () => {
    const { service, partyA, partyB } = await setUp();
    await service.addCandidate('CM-1', aCandidate({ partyId: partyA.id, number: 1 }));

    const adding = service.addCandidate('CM-1', aCandidate({ partyId: partyB.id, number: 1 }));

    await expect(adding).rejects.toThrow(new ConflictError('candidate number already used in this district'));
  });

  it('rejects a second candidate from the same party in the district', async () => {
    const { service, partyA } = await setUp();
    await service.addCandidate('CM-1', aCandidate({ partyId: partyA.id, number: 1 }));

    const adding = service.addCandidate('CM-1', aCandidate({ partyId: partyA.id, number: 2 }));

    await expect(adding).rejects.toThrow(new ConflictError('party already has a candidate in this district'));
  });

  it('allows the same number in a different district', async () => {
    const { service, partyA } = await setUp();
    await service.addCandidate('CM-1', aCandidate({ partyId: partyA.id, number: 1 }));

    const added = await service.addCandidate('CM-2', aCandidate({ partyId: partyA.id, number: 1 }));

    expect(added).toMatchObject({ districtId: 'CM-2', number: 1 });
  });

  it('rejects an unknown party', async () => {
    const { service } = await setUp();

    const adding = service.addCandidate('CM-1', aCandidate({ partyId: 999 }));

    await expect(adding).rejects.toThrow(new ValidationError('unknown party'));
  });
});
