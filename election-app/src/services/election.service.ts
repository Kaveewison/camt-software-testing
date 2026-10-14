// src/services/election.service.ts
import * as userRepo from '../repositories/user.repository';
import * as constituencyRepo from '../repositories/constituency.repository';
import * as partyRepo from '../repositories/party.repository';
import * as candidateRepo from '../repositories/candidate.repository';
import { uploadToSupabase, deleteFromSupabase } from "./upload.service";

export class ElectionService {
  /**
   * สร้างพรรคการเมืองใหม่ (EC only)
   */

  public createParty = async (data: {
    name: string;
    logoUrl?: string;
    policy?: string;
  }) => {
    if (!data.name || data.name.trim() === "") {
      throw new Error("กรุณาระบุชื่อพรรค");
    }

    // ตรวจสอบชื่อพรรคซ้ำ
    const existing = await partyRepo.findByName(data.name.trim());
    if (existing) {
      throw new Error(`พรรค "${data.name}" มีอยู่แล้ว`);
    }

    return await partyRepo.create({
      name: data.name.trim(),
      logoUrl: data.logoUrl,
      policy: data.policy,
    });
  };

  /**
   * เพิ่มผู้สมัคร (EC only)
   */
  public addCandidate = async (data: {
    candidateNumber: number;
    policy?: string | null;
    partyId: number;
    constituencyId: number;
    userId: number;
  }) => {
    // Validation
    if (
      !data.candidateNumber ||
      !data.partyId ||
      !data.constituencyId ||
      !data.userId
    ) {
      throw new Error(
        "กรุณากระบุข้อมูลที่จำเป็น: candidateNumber, partyId, constituencyId, userId",
      );
    }

    const user = await userRepo.findById(data.userId);
    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${data.userId}`);
    }

    if (user.constituencyId !== data.constituencyId) {
      throw new Error(
        `ผู้ใช้ไม่ได้อาศัยอยู่ในเขตเลือกตั้ง ID: ${data.constituencyId} ไม่สามารถลงสมัครในเขตนี้ได้`,
      );
    }

    // ตรวจสอบว่า user นี้เป็นผู้สมัครอยู่แล้วหรือไม่
    const existingCandidate = await candidateRepo.findByUserId(data.userId);
    if (existingCandidate) {
      throw new Error(`ผู้ใช้นี้เป็นผู้สมัครอยู่แล้ว`);
    }

    const party = await partyRepo.findById(data.partyId);
    if (!party) {
      throw new Error(`ไม่พบพรรค ID: ${data.partyId}`);
    }

    const constituency = await constituencyRepo.findById(data.constituencyId);
    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${data.constituencyId}`);
    }

    // ตรวจสอบหมายเลขผู้สมัครไม่ซ้ำในเขต
    const isNumberUsed = await candidateRepo.isCandidateNumberUsed(
      data.constituencyId,
      data.candidateNumber,
    );
    if (isNumberUsed) {
      throw new Error(
        `หมายเลขผู้สมัคร ${data.candidateNumber} ถูกใช้ในเขตนี้แล้ว`,
      );
    }

    return await candidateRepo.create({
      candidateNumber: data.candidateNumber,
      policy: data.policy || null,
      user: { connect: { id: data.userId } },
      party: { connect: { id: data.partyId } },
      constituency: { connect: { id: data.constituencyId } },
    });
  };

  /**
   * ปิดการลงคะแนนในเขต (EC only)
   */
  public closePoll = async (constituencyId: number) => {
    const constituency = await constituencyRepo.findById(constituencyId);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${constituencyId}`);
    }

    if (constituency.isClosed) {
      throw new Error(`เขตเลือกตั้งนี้ปิดการลงคะแนนไปแล้ว`);
    }

    return await constituencyRepo.close(constituencyId);
  };

  /**
   * ดึงรายการเขตเลือกตั้งทั้งหมดตามจังหวัดถ้ามีนะ
   */
  public getConstituencies = async (filters?: { province?: string }) => {
    if (filters?.province) {
      return await constituencyRepo.findByProvince(filters.province);
    }
    return await constituencyRepo.findAll();
  };

  /**
   * ดึงรายการเขตเลือกตั้งตามจังหวัด
   */
  public getConstituenciesByProvince = async (province: string) => {
    if (!province) {
      throw new Error('กรุณาระบุชื่อจังหวัด');
    }
    return await constituencyRepo.findByProvince(province);
  };

  /**
   * ดูผลการเลือกตั้งในเขต
   */
  public getConstituencyResults = async (constituencyId: number) => {
    const data = await constituencyRepo.findWithResults(constituencyId);

    if (!data) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${constituencyId}`);
    }

    const candidatesWithVotes = data.candidates.map((candidate) => ({
      id: candidate.id,
      candidateNumber: candidate.candidateNumber,
      title: candidate.user.title,
      firstName: candidate.user.firstName,
      lastName: candidate.user.lastName,
      imageUrl: candidate.user.imageUrl,
      policy: candidate.policy,
      party: {
        id: candidate.party.id,
        name: candidate.party.name,
        logoUrl: candidate.party.logoUrl,
      },
      voteCount: data.isClosed ? candidate.votes.length : null,
    }));

    return {
      constituency: {
        id: data.id,
        province: data.province,
        districtNumber: data.districtNumber,
        isClosed: data.isClosed,
      },
      candidates: candidatesWithVotes,
    };
  };

  /**
   * ดูภาพรวมพรรคทั้งหมด พร้อมจำนวน MPs
   */
  public getPartyOverview = async (filters?: {
    id?: number;
    districtNumber?: number;
  }) => {
    const parties = await partyRepo.findAllWithCandidates();
    const allConstituencies = await constituencyRepo.findAll();
    let scopedConstituencies = allConstituencies;

    if (filters?.id !== undefined) {
      const constituency = await constituencyRepo.findById(filters.id);

      if (!constituency) {
        throw new Error(`ไม่พบเขตเลือกตั้งจาก id: ${filters.id}`);
      }

      if (
        filters.districtNumber !== undefined &&
        constituency.districtNumber !== filters.districtNumber
      ) {
        scopedConstituencies = [];
      } else {
        scopedConstituencies = [constituency];
      }
    }

    const scopedConstituencyIds = scopedConstituencies.map((c) => c.id);
    const scopedCandidates = await candidateRepo.findByConstituencyIds(
      scopedConstituencyIds,
    );

    const candidateCountByPartyId = new Map<number, number>();
    for (const candidate of scopedCandidates) {
      const currentCount = candidateCountByPartyId.get(candidate.partyId) ?? 0;
      candidateCountByPartyId.set(candidate.partyId, currentCount + 1);
    }

    const partiesInScope =
      filters?.id !== undefined
        ? parties.filter((party) => candidateCountByPartyId.has(party.id))
        : parties;

    const closedConstituencyIds = scopedConstituencies
      .filter((c) => c.isClosed)
      .map((c) => c.id);

    const closedConstituencyIdSet = new Set(closedConstituencyIds);
    const closedCandidates = scopedCandidates.filter((candidate) =>
      closedConstituencyIdSet.has(candidate.constituencyId),
    );

    if (!closedConstituencyIds.length) {
      return partiesInScope.map((party) => ({
        id: party.id,
        name: party.name,
        logoUrl: party.logoUrl,
        policy: party.policy,
        totalCandidates:
          filters?.id !== undefined
            ? candidateCountByPartyId.get(party.id) ?? 0
            : party.candidates.length,
        totalElectedMPs: 0,
      }));
    }

    const voteCounts = await candidateRepo.countVotesByCandidateIds(
      closedCandidates.map((candidate) => candidate.id),
    );

    const voteCountByCandidateId = new Map<number, number>();
    for (const voteCount of voteCounts) {
      voteCountByCandidateId.set(voteCount.candidateId, voteCount._count._all);
    }

    const winnerPartyByConstituencyId = new Map<number, number>();

    for (const constituencyId of closedConstituencyIds) {
      const constituencyCandidates = closedCandidates.filter(
        (candidate) => candidate.constituencyId === constituencyId,
      );

      let maxVotes = -1;
      let winnerPartyId: number | null = null;

      for (const candidate of constituencyCandidates) {
        const voteCount = voteCountByCandidateId.get(candidate.id) ?? 0;

        if (voteCount > maxVotes) {
          maxVotes = voteCount;
          winnerPartyId = candidate.partyId;
        }
      }

      if (winnerPartyId !== null) {
        winnerPartyByConstituencyId.set(constituencyId, winnerPartyId);
      }
    }

    return partiesInScope.map((party) => {
      let totalElectedMPs = 0;

      for (const winnerPartyId of winnerPartyByConstituencyId.values()) {
        if (winnerPartyId === party.id) {
          totalElectedMPs++;
        }
      }

      return {
        id: party.id,
        name: party.name,
        logoUrl: party.logoUrl,
        policy: party.policy,
        totalCandidates:
          filters?.id !== undefined
            ? candidateCountByPartyId.get(party.id) ?? 0
            : party.candidates.length,
        totalElectedMPs,
      };
    });
  };

  public getPublicPartyList = async () => {
    const parties = await partyRepo.findAllWithCandidates();
    const allConstituencies = await constituencyRepo.findAll();
    const closedConstituencyIds = allConstituencies
      .filter((c) => c.isClosed)
      .map((c) => c.id);

    // Get closed constituencies with full data
    const closedConstituenciesData = await Promise.all(
      closedConstituencyIds.map((id) => constituencyRepo.findWithResults(id)),
    );

    return parties.map((party) => {
      let totalElectedMPs = 0;

      for (const constituency of closedConstituenciesData) {
        if (!constituency) continue;

        let maxVotes = -1;
        let winnerPartyId: number | null = null;

        for (const candidate of constituency.candidates) {
          const voteCount = candidate.votes.length;
          if (voteCount > maxVotes) {
            maxVotes = voteCount;
            winnerPartyId = candidate.partyId;
          }
        }

        if (winnerPartyId === party.id) {
          totalElectedMPs++;
        }
      }

      return {
        id: party.id,
        name: party.name,
        logoUrl: party.logoUrl,
        policy: party.policy,
        totalCandidates: party.candidates.length,
        totalElectedMPs,
      };
    });
  };

  public getPublicPartyDetails = async (partyId: number) => {
    const party = await partyRepo.findByIdWithCandidates(partyId);

    if (!party) {
      throw new Error(`ไม่พบพรรค ID: ${partyId}`);
    }

    const allConstituencies = await constituencyRepo.findAll();
    const closedConstituencyIds = allConstituencies
      .filter((c) => c.isClosed)
      .map((c) => c.id);

    // Determine winners for closed constituencies
    const winners = new Map<number, number>(); // constituencyId -> winnerId
    const closedConstituenciesData = await Promise.all(
      closedConstituencyIds.map((id) => constituencyRepo.findWithResults(id)),
    );

    for (const constituency of closedConstituenciesData) {
      if (!constituency) continue;

      let maxVotes = -1;
      let winnerId: number | null = null;

      for (const candidate of constituency.candidates) {
        const voteCount = candidate.votes.length;
        if (voteCount > maxVotes) {
          maxVotes = voteCount;
          winnerId = candidate.id;
        }
      }

      if (winnerId !== null) {
        winners.set(constituency.id, winnerId);
      }
    }

    const candidates = party.candidates.map((candidate) => {
      const isClosed = closedConstituencyIds.includes(candidate.constituencyId);
      const isElected = winners.get(candidate.constituencyId) === candidate.id;

      return {
        id: candidate.id,
        candidateNumber: candidate.candidateNumber,
        title: candidate.user.title,
        firstName: candidate.user.firstName,
        lastName: candidate.user.lastName,
        imageUrl: candidate.user.imageUrl,
        policy: candidate.policy,
        constituency: {
          id: candidate.constituency.id,
          province: candidate.constituency.province,
          districtNumber: candidate.constituency.districtNumber,
          isClosed: candidate.constituency.isClosed,
        },
        voteCount: isClosed ? candidate.votes.length : null,
        isElected,
      };
    });

    const totalElectedMPs = candidates.filter((c) => c.isElected).length;

    return {
      id: party.id,
      name: party.name,
      logoUrl: party.logoUrl,
      policy: party.policy,
      totalCandidates: candidates.length,
      totalElectedMPs,
      candidates,
    };
  };

  public getAllParties = async () => {
    return await partyRepo.findAllWithCandidateCount();
  };

  public getPartyById = async (id: number) => {
    const party = await partyRepo.findById(id);

    if (!party) {
      throw new Error(`ไม่พบพรรค ID: ${id}`);
    }

    return party;
  };

  public updateParty = async (
    id: number,
    data: { name?: string; logoUrl?: string; policy?: string },
  ) => {
    const party = await partyRepo.findById(id);

    if (!party) {
      throw new Error(`ไม่พบพรรค ID: ${id}`);
    }

    // ถ้ามีการเปลี่ยนชื่อพรรค ต้องตรวจสอบว่าไม่ซ้ำ
    if (data.name && data.name !== party.name) {
      const existing = await partyRepo.findByName(data.name);

      if (existing) {
        throw new Error(`พรรค "${data.name}" มีอยู่แล้ว`);
      }
    }

    return await partyRepo.update(id, data);
  };

  public deleteParty = async (id: number) => {
    const party = await partyRepo.findById(id);

    if (!party) {
      throw new Error(`ไม่พบพรรค ID: ${id}`);
    }

    return await partyRepo.remove(id);
  };

  public getEligibleVoters = async (filters: {
    constituencyId?: number;
    province?: string;
  }) => {
    if (!filters.constituencyId && !filters.province) {
      throw new Error("กรุณาระบุ constituencyId หรือ province");
    }

    if (filters.constituencyId) {
      return await this.getEligibleVotersByConstituency(filters.constituencyId);
    }

    return await this.getEligibleVotersByProvince(filters.province!);
  };

  public getEligibleVotersByConstituency = async (constituencyId: number) => {
    const constituency = await constituencyRepo.findById(constituencyId);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${constituencyId}`);
    }

    const users =
      await userRepo.findByConstituencyWithCandidateInfo(constituencyId);

    return {
      constituency: {
        id: constituency.id,
        province: constituency.province,
        districtNumber: constituency.districtNumber,
        isClosed: constituency.isClosed,
      },
      voters: users.map((user) => ({
        id: user.id,
        nationalId: user.nationalId,
        title: user.title,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        address: user.address,
        role: user.role,
        isCandidate: !!user.candidateProfile,
        candidateInfo: user.candidateProfile
          ? {
            id: user.candidateProfile.id,
            candidateNumber: user.candidateProfile.candidateNumber,
            policy: user.candidateProfile.policy,
            party: user.candidateProfile.party,
          }
          : null,
      })),
    };
  };

  public getEligibleVotersByProvince = async (province: string) => {
    const users = await userRepo.findByProvince(province);

    return users.map((user) => ({
      id: user.id,
      nationalId: user.nationalId,
      title: user.title,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      address: user.address,
      role: user.role,
      constituency: user.constituency,
      isCandidate: !!user.candidateProfile,
      candidateInfo: user.candidateProfile
        ? {
          id: user.candidateProfile.id,
          candidateNumber: user.candidateProfile.candidateNumber,
          policy: user.candidateProfile.policy,
          party: user.candidateProfile.party,
        }
        : null,
    }));
  };

  public getCandidates = async (filters?: { constituencyId?: number }) => {
    if (filters?.constituencyId) {
      return await this.getCandidatesByConstituency(filters.constituencyId);
    }
    return await candidateRepo.findAllWithUserInfo();
  };

  public getAllCandidates = async () => {
    return await candidateRepo.findAllWithUserInfo();
  };

  public getCandidatesByConstituency = async (constituencyId: number) => {
    const constituency = await constituencyRepo.findById(constituencyId);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${constituencyId}`);
    }

    const candidates =
      await candidateRepo.findByConstituencyWithFullDetails(constituencyId);

    return {
      constituency: {
        id: constituency.id,
        province: constituency.province,
        districtNumber: constituency.districtNumber,
        isClosed: constituency.isClosed,
      },
      candidates: candidates.map((candidate) => ({
        id: candidate.id,
        candidateNumber: candidate.candidateNumber,
        title: candidate.user.title,
        firstName: candidate.user.firstName,
        lastName: candidate.user.lastName,
        imageUrl: candidate.user.imageUrl,
        policy: candidate.policy,
        party: candidate.party,
        user: {
          id: candidate.user.id,
          nationalId: candidate.user.nationalId,
        },
        voteCount: candidate.votes.length,
      })),
    };
  };

  public getCandidateById = async (candidateId: number) => {
    const candidate = await candidateRepo.findById(candidateId);

    if (!candidate) {
      throw new Error(`ไม่พบผู้สมัคร ID: ${candidateId}`);
    }

    return candidate;
  };

  public updateCandidate = async (
    candidateId: number,
    data: {
      candidateNumber?: number;
      title?: string;
      firstName?: string;
      lastName?: string;
      imageUrl?: string;
      policy?: string;
      partyId?: number;
    },
  ) => {
    const candidate = await candidateRepo.findById(candidateId);

    if (!candidate) {
      throw new Error(`ไม่พบผู้สมัคร ID: ${candidateId}`);
    }

    // ตรวจสอบว่าหมายเลขผู้สมัครไม่ซ้ำในเขต
    if (data.candidateNumber && data.candidateNumber !== candidate.candidateNumber) {
      const isUsed = await candidateRepo.isCandidateNumberUsed(
        candidate.constituencyId,
        data.candidateNumber,
        candidateId,
      );

      if (isUsed) {
        throw new Error(
          `หมายเลขผู้สมัคร ${data.candidateNumber} ถูกใช้ในเขตนี้แล้ว`,
        );
      }
    }

    // ตรวจสอบว่าพรรคมีอยู่จริง
    if (data.partyId) {
      const party = await partyRepo.findById(data.partyId);
      if (!party) {
        throw new Error(`ไม่พบพรรค ID: ${data.partyId}`);
      }
    }

    return await candidateRepo.update(candidateId, data);
  };

  public deleteCandidate = async (candidateId: number) => {
    const candidate = await candidateRepo.findById(candidateId);

    if (!candidate) {
      throw new Error(`ไม่พบผู้สมัคร ID: ${candidateId}`);
    }

    return await candidateRepo.remove(candidateId);
  };

  public getNextCandidateNumber = async (constituencyId: number) => {
    const constituency = await constituencyRepo.findById(constituencyId);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${constituencyId}`);
    }

    return await candidateRepo.getNextCandidateNumber(constituencyId);
  };

  public getAllProvinces = async () => {
    const constituencies = await constituencyRepo.findAll();
    const provinces = [...new Set(constituencies.map((c) => c.province))];
    return provinces.sort();
  };

  public uploadPartyLogo = async (partyId: number, file: Express.Multer.File) => {
    const party = await partyRepo.findById(partyId);

    if (!party) {
      throw new Error(`ไม่พบพรรค ID: ${partyId}`);
    }

    // Delete old logo if exists
    if (party.logoUrl) {
      await deleteFromSupabase(party.logoUrl);
    }

    // Upload new logo
    const logoUrl = await uploadToSupabase(file, "parties");

    // Update party with new logo URL
    const updatedParty = await partyRepo.update(partyId, { logoUrl });

    return {
      id: updatedParty.id,
      name: updatedParty.name,
      logoUrl: updatedParty.logoUrl,
    };
  };
}
