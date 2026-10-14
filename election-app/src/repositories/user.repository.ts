// src/repositories/user.repository.ts
import { Prisma } from "../generated/prisma";
import { prisma } from "../lib/prisma";


export const create = async (data: Prisma.UserCreateInput) => {
  return await prisma.user.create({
    data,
    include: { constituency: true },
  });
};

export const findById = async (id: number) => {
  return await prisma.user.findUnique({
    where: { id },
    include: { constituency: true },
  });
};

export const findByNationalId = async (nationalId: string) => {
  return await prisma.user.findUnique({
    where: { nationalId },
    include: { constituency: true },
  });
};

export const updateRole = async (
  id: number,
  role: Prisma.EnumRoleFieldUpdateOperationsInput | any,
) => {
  return await prisma.user.update({
    where: { id },
    data: { role },
    include: { constituency: true },
  });
};

export const findAll = async () => {
  return await prisma.user.findMany({
    include: { constituency: true },
    orderBy: { id: "asc" },
  });
};

export const findAllWithFullDetails = async () => {
  return await prisma.user.findMany({
    include: {
      constituency: true,
      candidateProfile: {
        include: {
          party: true,
        },
      },
      vote: true,
    },
    orderBy: { id: "asc" },
  });
};

export const findByConstituencyWithCandidateInfo = async (
  constituencyId: number,
) => {
  return await prisma.user.findMany({
    where: { constituencyId },
    include: {
      constituency: true,
      candidateProfile: {
        include: {
          party: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });
};

export const findByProvince = async (province: string) => {
  return await prisma.user.findMany({
    where: {
      constituency: {
        province,
      },
    },
    include: {
      constituency: true,
      candidateProfile: {
        include: {
          party: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });
};

export const findByRole = async (role: "VOTER" | "EC" | "ADMIN") => {
  return await prisma.user.findMany({
    where: { role },
    include: {
      constituency: true,
      candidateProfile: {
        include: {
          party: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });
};

export const update = async (
  id: number,
  data: {
    firstName?: string;
    lastName?: string;
    address?: string;
    imageUrl?: string;
    constituencyId?: number;
    title?: string;
  },
) => {
  return await prisma.user.update({
    where: { id },
    data,
    include: {
      constituency: true,
      candidateProfile: true,
    },
  });
};
