import { Prisma } from "../generated/prisma";
import { prisma } from "../lib/prisma";

export const create = async (data: Prisma.CandidateCreateInput) => {
  return await prisma.candidate.create({
    data,
    include: {
      user: true,
      party: true,
      constituency: true,
    },
  });
};

export const findById = async (id: number) => {
  return await prisma.candidate.findUnique({
    where: { id },
    include: {
      party: true,
      constituency: true,
    },
  });
};

export const findWithResults = async (id: number) => {
  return await prisma.constituency.findUnique({
    where: { id },
    include: {
      candidates: {
        include: {
          user: true,
          party: true,
          votes: true,
        },
        orderBy: {
          candidateNumber: "asc",
        },
      },
    },
  });
};

export const findByConstituency = async (constituencyId: number) => {
  return await prisma.candidate.findMany({
    where: { constituencyId },
    include: {
      user: true,
      party: true,
      votes: true,
    },
    orderBy: {
      candidateNumber: "asc",
    },
  });
};

export const findAllWithUserInfo = async () => {
  return await prisma.candidate.findMany({
    include: {
      user: true,
      party: true,
      constituency: true,
      votes: true,
    },
    orderBy: [
      { constituency: { province: "asc" } },
      { constituency: { districtNumber: "asc" } },
      { candidateNumber: "asc" },
    ],
  });
};

export const findByConstituencyWithFullDetails = async (
  constituencyId: number,
) => {
  return await prisma.candidate.findMany({
    where: { constituencyId },
    include: {
      user: true,
      party: true,
      constituency: true,
      votes: true,
    },
    orderBy: { candidateNumber: "asc" },
  });
};

export const findByUserId = async (userId: number) => {
  return await prisma.candidate.findUnique({
    where: { userId },
    include: {
      party: true,
      constituency: true,
    },
  });
};


export const update = async (
  id: number,
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
  return await prisma.candidate.update({
    where: { id },
    data,
    include: {
      user: true,
      party: true,
      constituency: true,
    },
  });
};

export const remove = async (id: number) => {
  return await prisma.candidate.delete({
    where: { id },
  });
};

export const getNextCandidateNumber = async (constituencyId: number) => {
  const lastCandidate = await prisma.candidate.findFirst({
    where: { constituencyId },
    orderBy: { candidateNumber: "desc" },
  });

  return lastCandidate ? lastCandidate.candidateNumber + 1 : 1;
};

export const isCandidateNumberUsed = async (
  constituencyId: number,
  candidateNumber: number,
  excludeCandidateId?: number,
) => {
  const existing = await prisma.candidate.findFirst({
    where: {
      constituencyId,
      candidateNumber,
      ...(excludeCandidateId ? { NOT: { id: excludeCandidateId } } : {}),
    },
  });

  return !!existing;
};

export const findByConstituencyIds = async (constituencyIds: number[]) => {
  return await prisma.candidate.findMany({
    where: {
      constituencyId: { in: constituencyIds },
    },
    select: {
      id: true,
      partyId: true,
      constituencyId: true,
    },
  });
};

export const countVotesByCandidateIds = async (candidateIds: number[]) => {
  if (!candidateIds.length) {
    return [];
  }

  return await prisma.vote.groupBy({
    by: ["candidateId"],
    where: {
      candidateId: { in: candidateIds },
    },
    _count: {
      _all: true,
    },
  });
};