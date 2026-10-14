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
  const request = { candidateNumber: 1, partyId: 3, constituencyId: 5, userId: 42 };

  /** Stubs: every lookup answers "yes, this exists and is free". A test then overrides one answer. */
  function givenEverythingIsAvailable() {
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
    return { created };
  }

  it('2.3.1 Success + 2.3.3 Stub: adds a user who lives in the constituency as a candidate', async () => {
    // Arrange
    const { created } = givenEverythingIsAvailable();

    // Act
    const result = await service.addCandidate(request);

    // Assert
    expect(result).toBe(created);
  });

  describe('2.3.2 Failure + 2.3.5 Mock: rejects and never creates the candidate', () => {
    it('when the user lives in another constituency', async () => {
      givenEverythingIsAvailable();
      jest.mocked(userRepo.findById).mockResolvedValue(aUser({ id: 42, constituencyId: 9 }));

      const adding = service.addCandidate(request);

      await expect(adding).rejects.toThrow('ผู้ใช้ไม่ได้อาศัยอยู่ในเขตเลือกตั้ง ID: 5');
      // Mock: the test is about this interaction — nothing may be written.
      expect(candidateRepo.create).not.toHaveBeenCalled();
    });

    it('when the candidate number is already used in the constituency', async () => {
      givenEverythingIsAvailable();
      jest.mocked(candidateRepo.isCandidateNumberUsed).mockResolvedValue(true);

      const adding = service.addCandidate(request);

      await expect(adding).rejects.toThrow('หมายเลขผู้สมัคร 1 ถูกใช้ในเขตนี้แล้ว');
      expect(candidateRepo.create).not.toHaveBeenCalled();
    });

    it('when the user is already a candidate', async () => {
      givenEverythingIsAvailable();
      jest.mocked(candidateRepo.findByUserId).mockResolvedValue({
        ...aCandidate({ userId: 42 }),
        party: aParty(),
        constituency: aConstituency(),
      });

      const adding = service.addCandidate(request);

      await expect(adding).rejects.toThrow('ผู้ใช้นี้เป็นผู้สมัครอยู่แล้ว');
      expect(candidateRepo.create).not.toHaveBeenCalled();
    });

    it('when the party does not exist', async () => {
      givenEverythingIsAvailable();
      jest.mocked(partyRepo.findById).mockResolvedValue(null);

      const adding = service.addCandidate(request);

      await expect(adding).rejects.toThrow('ไม่พบพรรค ID: 3');
      expect(candidateRepo.create).not.toHaveBeenCalled();
    });

    it.each(['candidateNumber', 'partyId', 'constituencyId', 'userId'] as const)(
      'when %s is missing, before touching any repository',
      async (field) => {
        givenEverythingIsAvailable();

        const adding = service.addCandidate({ ...request, [field]: undefined as unknown as number });

        await expect(adding).rejects.toThrow('กรุณากระบุข้อมูลที่จำเป็น');
        expect(userRepo.findById).not.toHaveBeenCalled();
        expect(candidateRepo.create).not.toHaveBeenCalled();
      },
    );
  });
});
