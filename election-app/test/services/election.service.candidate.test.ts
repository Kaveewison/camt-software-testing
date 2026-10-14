// Unit tests for candidate management in ElectionService.
//
// ElectionService imports its repositories as modules (no dependency injection),
// so the only seam is jest.mock() on the whole module. The factories also keep
// Prisma and the Supabase/S3 client from being loaded at all.
jest.mock('../../src/repositories/user.repository', () => ({ findById: jest.fn() }));
jest.mock('../../src/repositories/party.repository', () => ({ findById: jest.fn() }));
jest.mock('../../src/repositories/constituency.repository', () => ({ findById: jest.fn() }));
jest.mock('../../src/repositories/candidate.repository', () => ({
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findByConstituency: jest.fn(),
  isCandidateNumberUsed: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));
jest.mock('../../src/services/upload.service', () => ({}));

import { faker, fakerTH } from '@faker-js/faker';
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

  describe('2.3.4 Spy: what addCandidate sends to candidateRepo.create', () => {
    it('connects the user, party and constituency by id', async () => {
      givenEverythingIsAvailable();
      // Spy: records the call so we can look at the argument afterwards.
      const create = jest.spyOn(candidateRepo, 'create');

      await service.addCandidate({ ...request, policy: 'ลดค่าครองชีพ' });

      expect(create).toHaveBeenCalledTimes(1);
      expect(create.mock.calls[0][0]).toEqual({
        candidateNumber: 1,
        policy: 'ลดค่าครองชีพ',
        user: { connect: { id: 42 } },
        party: { connect: { id: 3 } },
        constituency: { connect: { id: 5 } },
      });
    });

    it('stores policy as null when it is not given', async () => {
      givenEverythingIsAvailable();
      const create = jest.spyOn(candidateRepo, 'create');

      await service.addCandidate(request);

      expect(create.mock.calls[0][0].policy).toBeNull();
    });
  });

  it('2.3.6 Faker: passes any generated candidate through unchanged', async () => {
    // Arrange — ids, number and policy come from faker (seeded in test/support/seedFaker.ts),
    // so the test does not depend on one hand-picked example.
    const constituency = aConstituency();
    const party = aParty();
    const user = aUser({ constituencyId: constituency.id });
    const input = {
      candidateNumber: faker.number.int({ min: 1, max: 99 }),
      policy: fakerTH.lorem.paragraph(),
      partyId: party.id,
      constituencyId: constituency.id,
      userId: user.id,
    };
    jest.mocked(userRepo.findById).mockResolvedValue(user);
    jest.mocked(candidateRepo.findByUserId).mockResolvedValue(null);
    jest.mocked(partyRepo.findById).mockResolvedValue(party);
    jest.mocked(constituencyRepo.findById).mockResolvedValue(constituency);
    jest.mocked(candidateRepo.isCandidateNumberUsed).mockResolvedValue(false);
    const create = jest.spyOn(candidateRepo, 'create');

    // Act
    await service.addCandidate(input);

    // Assert
    expect(candidateRepo.isCandidateNumberUsed).toHaveBeenCalledWith(constituency.id, input.candidateNumber);
    expect(create.mock.calls[0][0]).toEqual({
      candidateNumber: input.candidateNumber,
      policy: input.policy,
      user: { connect: { id: user.id } },
      party: { connect: { id: party.id } },
      constituency: { connect: { id: constituency.id } },
    });
  });

  describe('boundary values of candidateNumber (spec: a positive integer)', () => {
    it.each([1, 2, 99])('accepts %p', async (candidateNumber) => {
      givenEverythingIsAvailable();

      await service.addCandidate({ ...request, candidateNumber });

      expect(candidateRepo.create).toHaveBeenCalledTimes(1);
    });

    it('rejects 0', async () => {
      givenEverythingIsAvailable();

      await expect(service.addCandidate({ ...request, candidateNumber: 0 })).rejects.toThrow();

      expect(candidateRepo.create).not.toHaveBeenCalled();
    });

    // Was a bug in the original code (only `!candidateNumber` was checked),
    // found by this test and fixed in addCandidate.
    it.each([-1, 1.5])('rejects %p', async (candidateNumber) => {
      givenEverythingIsAvailable();

      await expect(service.addCandidate({ ...request, candidateNumber })).rejects.toThrow(
        'หมายเลขผู้สมัครต้องเป็นจำนวนเต็มบวก',
      );

      expect(candidateRepo.create).not.toHaveBeenCalled();
    });
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

describe('ElectionService.updateCandidate', () => {
  const service = new ElectionService();

  /** Stub: candidate 10 is number 1 of party 3 in constituency 5; every other lookup succeeds. */
  function givenCandidate10() {
    const existing = {
      ...aCandidate({ id: 10, candidateNumber: 1, partyId: 3, constituencyId: 5 }),
      party: aParty({ id: 3 }),
      constituency: aConstituency({ id: 5 }),
    };
    jest.mocked(candidateRepo.findById).mockResolvedValue(existing);
    jest.mocked(candidateRepo.findByConstituency).mockResolvedValue([]);
    jest.mocked(candidateRepo.isCandidateNumberUsed).mockResolvedValue(false);
    jest.mocked(partyRepo.findById).mockResolvedValue(aParty({ id: 7 }));
    jest.mocked(candidateRepo.update).mockImplementation(async (id, data) => ({
      ...existing,
      ...aCandidate({ ...existing, ...data, id }),
      user: aUser({ id: existing.userId }),
    }));
    return existing;
  }

  it('updates the policy of an existing candidate', async () => {
    givenCandidate10();

    const updated = await service.updateCandidate(10, { policy: 'นโยบายใหม่' });

    expect(candidateRepo.update).toHaveBeenCalledWith(10, { policy: 'นโยบายใหม่' });
    expect(updated.policy).toBe('นโยบายใหม่');
  });

  it('does not check the number again when it stays the same', async () => {
    givenCandidate10();

    await service.updateCandidate(10, { candidateNumber: 1 });

    expect(candidateRepo.isCandidateNumberUsed).not.toHaveBeenCalled();
  });

  it('rejects a candidate that does not exist, without updating', async () => {
    givenCandidate10();
    jest.mocked(candidateRepo.findById).mockResolvedValue(null);

    await expect(service.updateCandidate(99, { policy: 'x' })).rejects.toThrow('ไม่พบผู้สมัคร ID: 99');

    expect(candidateRepo.update).not.toHaveBeenCalled();
  });

  it('rejects a number already used by another candidate in the constituency', async () => {
    givenCandidate10();
    jest.mocked(candidateRepo.isCandidateNumberUsed).mockResolvedValue(true);

    await expect(service.updateCandidate(10, { candidateNumber: 2 })).rejects.toThrow(
      'หมายเลขผู้สมัคร 2 ถูกใช้ในเขตนี้แล้ว',
    );

    expect(candidateRepo.isCandidateNumberUsed).toHaveBeenCalledWith(5, 2, 10);
    expect(candidateRepo.update).not.toHaveBeenCalled();
  });

  it('rejects a party that does not exist', async () => {
    givenCandidate10();
    jest.mocked(partyRepo.findById).mockResolvedValue(null);

    await expect(service.updateCandidate(10, { partyId: 99 })).rejects.toThrow('ไม่พบพรรค ID: 99');

    expect(candidateRepo.update).not.toHaveBeenCalled();
  });

  // KNOWN BUGS in the original code, found by these tests. it.failing passes while
  // the bug is still there and turns red once it is fixed.

  // title/firstName/lastName/imageUrl live on User, not Candidate, but they are passed
  // to candidateRepo.update. Prisma then rejects the call with
  // "Unknown argument `firstName`" (checked against the generated client).
  it.failing('sends only Candidate columns to candidateRepo.update', async () => {
    givenCandidate10();
    const update = jest.spyOn(candidateRepo, 'update');

    await service.updateCandidate(10, { firstName: 'สมศรี', policy: 'นโยบายใหม่' });

    const sentColumns = Object.keys(update.mock.calls[0][1]);
    expect(sentColumns.every((column) => ['candidateNumber', 'policy', 'partyId'].includes(column))).toBe(true);
  });

  // Moving a candidate to a party that already runs in this constituency is not checked;
  // the DB constraint @@unique([constituencyId, partyId]) fails with a raw Prisma error instead.
  it.failing('rejects a party that already has a candidate in the constituency', async () => {
    givenCandidate10();
    jest.mocked(candidateRepo.findByConstituency).mockResolvedValue([
      { ...aCandidate({ id: 11, partyId: 7, constituencyId: 5 }), user: aUser(), party: aParty({ id: 7 }), votes: [] },
    ]);

    await expect(service.updateCandidate(10, { partyId: 7 })).rejects.toThrow();

    expect(candidateRepo.update).not.toHaveBeenCalled();
  });

  // Same boundary bug addCandidate had: a negative or fractional number is accepted.
  it.failing.each([-1, 1.5])('rejects candidateNumber %p', async (candidateNumber) => {
    givenCandidate10();

    await expect(service.updateCandidate(10, { candidateNumber })).rejects.toThrow();

    expect(candidateRepo.update).not.toHaveBeenCalled();
  });
});

describe('ElectionService.deleteCandidate', () => {
  const service = new ElectionService();

  it('removes an existing candidate', async () => {
    jest.mocked(candidateRepo.findById).mockResolvedValue({
      ...aCandidate({ id: 10 }),
      party: aParty(),
      constituency: aConstituency(),
    });

    await service.deleteCandidate(10);

    expect(candidateRepo.remove).toHaveBeenCalledWith(10);
  });

  it('rejects a candidate that does not exist, without removing anything', async () => {
    jest.mocked(candidateRepo.findById).mockResolvedValue(null);

    await expect(service.deleteCandidate(99)).rejects.toThrow('ไม่พบผู้สมัคร ID: 99');

    expect(candidateRepo.remove).not.toHaveBeenCalled();
  });
});
