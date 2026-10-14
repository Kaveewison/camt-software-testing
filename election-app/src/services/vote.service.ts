// src/services/vote.service.ts
import * as voteRepo from "../repositories/vote.repository";
import * as userRepo from "../repositories/user.repository";
import * as candidateRepo from "../repositories/candidate.repository";
import * as constituencyRepo from "../repositories/constituency.repository";

export class VoteService {
  public getBallot = async (userId: number) => {
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    if (!user.constituencyId) {
      throw new Error(`ผู้ใช้ยังไม่ได้ลงทะเบียนในเขตเลือกตั้ง`);
    }

    const candidates = await candidateRepo.findByConstituency(
      user.constituencyId,
    );

    const ballot = candidates.map((candidate) => ({
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
    }));

    return {
      constituency: {
        id: user.constituency.id,
        province: user.constituency.province,
        districtNumber: user.constituency.districtNumber,
        isClosed: user.constituency.isClosed,
      },
      candidates: ballot,
    };
  };

  public castVote = async (userId: number, candidateId: number) => {
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    if (!user.constituencyId) {
      throw new Error(`ผู้ใช้ยังไม่ได้ลงทะเบียนในเขตเลือกตั้ง`);
    }

    if (user.constituency.isClosed) {
      throw new Error(
        `การลงคะแนนในเขต ${user.constituency.province} เขตที่ ${user.constituency.districtNumber} ปิดแล้ว`,
      );
    }

    const candidate = await candidateRepo.findById(candidateId);

    if (!candidate) {
      throw new Error(`ไม่พบผู้สมัคร ID: ${candidateId}`);
    }

    if (candidate.constituencyId !== user.constituencyId) {
      throw new Error(`ผู้สมัครนี้ไม่ได้อยู่ในเขตเลือกตั้งของคุณ`);
    }

    const vote = await voteRepo.upsertVote(userId, candidateId);

    return {
      message: "ลงคะแนนสำเร็จ",
      vote: {
        id: vote.id,
        timestamp: vote.timestamp,
        candidate: {
          id: vote.candidate.id,
          candidateNumber: vote.candidate.candidateNumber,
          firstName: vote.candidate.user.firstName,
          lastName: vote.candidate.user.lastName,
          party: {
            id: vote.candidate.party.id,
            name: vote.candidate.party.name,
          },
        },
      },
    };
  };


  public getMyVote = async (userId: number) => {
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    if (!user.constituencyId) {
      throw new Error(`ผู้ใช้ยังไม่ได้ลงทะเบียนในเขตเลือกตั้ง`);
    }

    const vote = await voteRepo.findVoteByUserId(userId);

    if (!vote) {
      return {
        hasVoted: false,
        constituency: {
          id: user.constituency.id,
          province: user.constituency.province,
          districtNumber: user.constituency.districtNumber,
          isClosed: user.constituency.isClosed,
        },
        vote: null,
      };
    }

    return {
      hasVoted: true,
      constituency: {
        id: user.constituency.id,
        province: user.constituency.province,
        districtNumber: user.constituency.districtNumber,
        isClosed: user.constituency.isClosed,
      },
      vote: {
        id: vote.id,
        timestamp: vote.timestamp,
        candidate: {
          id: vote.candidate.id,
          candidateNumber: vote.candidate.candidateNumber,
          title: vote.candidate.user.title,
          firstName: vote.candidate.user.firstName,
          lastName: vote.candidate.user.lastName,
          imageUrl: vote.candidate.user.imageUrl,
          party: {
            id: vote.candidate.party.id,
            name: vote.candidate.party.name,
            logoUrl: vote.candidate.party.logoUrl,
          },
        },
      },
    };
  };

  public getMyConstituencyResults = async (userId: number) => {
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    if (!user.constituencyId) {
      throw new Error(`ผู้ใช้ยังไม่ได้ลงทะเบียนในเขตเลือกตั้ง`);
    }

    const data = await constituencyRepo.findWithResults(user.constituencyId);

    if (!data) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${user.constituencyId}`);
    }

    // Get user's vote
    const myVote = await voteRepo.findVoteByUserId(userId);

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
      isMyVote: myVote ? myVote.candidateId === candidate.id : false,
    }));

    // Determine winner if poll is closed
    let winner = null;
    if (data.isClosed && candidatesWithVotes.length > 0) {
      const maxVotes = Math.max(
        ...candidatesWithVotes.map((c) => c.voteCount || 0),
      );
      winner = candidatesWithVotes.find((c) => c.voteCount === maxVotes);
    }

    return {
      constituency: {
        id: data.id,
        province: data.province,
        districtNumber: data.districtNumber,
        isClosed: data.isClosed,
      },
      candidates: candidatesWithVotes,
      winner: winner
        ? {
          id: winner.id,
          candidateNumber: winner.candidateNumber,
          title: winner.title,
          firstName: winner.firstName,
          lastName: winner.lastName,
          party: winner.party,
          voteCount: winner.voteCount,
        }
        : null,
      myVoteStatus: {
        hasVoted: !!myVote,
        votedAt: myVote?.timestamp || null,
      },
    };
  };

  public getConstituenciesList = async (province?: string) => {
    if (province) {
      const constituencies = await constituencyRepo.findByProvince(province);
      return { constituencies };
    }
    const constituencies = await constituencyRepo.findAll();

    // Group by province for easy frontend usage
    const provinces = [...new Set(constituencies.map((c) => c.province))].sort();

    return { provinces, constituencies };
  };

  public getResultsByFilter = async (
    userId: number,
    province?: string,
    districtNumber?: number,
  ) => {
    let constituencyId: number;

    if (province && districtNumber) {
      // ค้นหาเขตจาก province + districtNumber
      const constituency = await constituencyRepo.findByLocation(province, districtNumber);
      if (!constituency) {
        throw new Error(`ไม่พบเขตเลือกตั้ง: ${province} เขต ${districtNumber}`);
      }
      constituencyId = constituency.id;
    } else if (province) {
      // ถ้าระบุแค่จังหวัด ดึงเขตแรกของจังหวัด
      const constituencies = await constituencyRepo.findByProvince(province);
      if (constituencies.length === 0) {
        throw new Error(`ไม่พบเขตเลือกตั้งในจังหวัด: ${province}`);
      }
      constituencyId = constituencies[0].id;
    } else {
      // ถ้าไม่ระบุ filter ใช้เขตของ user
      const user = await userRepo.findById(userId);
      if (!user) throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
      if (!user.constituencyId) throw new Error(`ผู้ใช้ยังไม่ได้ลงทะเบียนในเขตเลือกตั้ง`);
      constituencyId = user.constituencyId;
    }

    const data = await constituencyRepo.findWithResults(constituencyId);
    if (!data) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${constituencyId}`);
    }

    const myVote = await voteRepo.findVoteByUserId(userId);

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
        policy: candidate.party.policy,
      },
      voteCount: data.isClosed ? candidate.votes.length : null,
      isMyVote: myVote ? myVote.candidateId === candidate.id : false,
    }));

    let winner = null;
    if (data.isClosed && candidatesWithVotes.length > 0) {
      const maxVotes = Math.max(...candidatesWithVotes.map((c) => c.voteCount || 0));
      winner = candidatesWithVotes.find((c) => c.voteCount === maxVotes);
    }

    return {
      constituency: {
        id: data.id,
        province: data.province,
        districtNumber: data.districtNumber,
        isClosed: data.isClosed,
      },
      candidates: candidatesWithVotes,
      winner: winner
        ? {
          id: winner.id,
          candidateNumber: winner.candidateNumber,
          title: winner.title,
          firstName: winner.firstName,
          lastName: winner.lastName,
          party: winner.party,
          voteCount: winner.voteCount,
        }
        : null,
      myVoteStatus: {
        hasVoted: !!myVote,
        votedAt: myVote?.timestamp || null,
      },
    };
  };
}
