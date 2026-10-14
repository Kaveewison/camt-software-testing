// Unit tests for candidate management in ElectionService.
//
// ElectionService imports its repositories as modules (no dependency injection),
// so the only seam is jest.mock() on the whole module. The factories also keep
// Prisma and the Supabase/S3 client from being loaded at all.
jest.mock('../../src/repositories/user.repository', () => ({ findById: jest.fn() }));
jest.mock('../../src/repositories/party.repository', () => ({ findById: jest.fn() }));
jest.mock('../../src/repositories/constituency.repository', () => ({ findById: jest.fn() }));
jest.mock('../../src/repositories/candidate.repository', () => ({
  findByUserId: jest.fn(),
  isCandidateNumberUsed: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../../src/services/upload.service', () => ({}));

import * as candidateRepo from '../../src/repositories/candidate.repository';
import * as constituencyRepo from '../../src/repositories/constituency.repository';
import * as partyRepo from '../../src/repositories/party.repository';
import * as userRepo from '../../src/repositories/user.repository';
import { ElectionService } from '../../src/services/election.service';
import { aCandidate, aConstituency, aParty, aUser } from '../support/builders';

describe('ElectionService.addCandidate', () => {
  const service = new ElectionService();

  it('2.3.1 Success + 2.3.3 Stub: adds a user who lives in the constituency as a candidate', async () => {
    // Arrange — Stubs: every lookup answers "yes, this exists and is free".
    const constituency = aConstituency({ id: 5 });
    const user = aUser({ id: 42, constituencyId: 5 });
    const party = aParty({ id: 3 });
    jest.mocked(userRepo.findById).mockResolvedValue(user);
    jest.mocked(candidateRepo.findByUserId).mockResolvedValue(null);
    jest.mocked(partyRepo.findById).mockResolvedValue(party);
    jest.mocked(constituencyRepo.findById).mockResolvedValue(constituency);
    jest.mocked(candidateRepo.isCandidateNumberUsed).mockResolvedValue(false);
    const created = { ...aCandidate({ userId: 42, partyId: 3, constituencyId: 5, candidateNumber: 1 }), user, party, constituency };
    jest.mocked(candidateRepo.create).mockResolvedValue(created);

    // Act
    const result = await service.addCandidate({ candidateNumber: 1, partyId: 3, constituencyId: 5, userId: 42 });

    // Assert
    expect(result).toBe(created);
  });
});
