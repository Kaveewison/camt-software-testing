import { Prisma } from "../generated/prisma";
import { prisma } from "../lib/prisma";

/**
 * Create a new party
 */
export const create = async (data: Prisma.PartyCreateInput) => {
  return await prisma.party.create({
    data,
  });
};

/**
 * Find party by ID
 */
export const findById = async (id: number) => {
  return await prisma.party.findUnique({
    where: { id },
  });
};

/**
 * Get all parties
 */
export const findAll = async () => {
  return await prisma.party.findMany({
    orderBy: { name: "asc" },
  });
};

/**
 * Get all parties with candidates and votes (for MP counting)
 */
export const findAllWithCandidates = async () => {
  return await prisma.party.findMany({
    include: {
      candidates: {
        include: {
          votes: true,
          constituency: true,
        },
      },
    },
  });
};

export const update = async (
  id: number,
  data: { name?: string; logoUrl?: string; policy?: string },
) => {
  return await prisma.party.update({
    where: { id },
    data,
  });
};

export const remove = async (id: number) => {
  return await prisma.party.delete({
    where: { id },
  });
};

export const findByName = async (name: string) => {
  return await prisma.party.findFirst({
    where: { name },
  });
};

export const findAllWithCandidateCount = async () => {
  return await prisma.party.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { candidates: true },
      },
    },
  });
};

export const findByIdWithCandidates = async (id: number) => {
  return await prisma.party.findUnique({
    where: { id },
    include: {
      candidates: {
        include: {
          user: true,
          constituency: true,
          votes: true,
        },
        orderBy: [
          { constituency: { province: "asc" } },
          { constituency: { districtNumber: "asc" } },
          { candidateNumber: "asc" },
        ],
      },
    },
  });
};