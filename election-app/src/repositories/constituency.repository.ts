// src/repositories/constituency.repository.ts
import { Prisma } from "../generated/prisma";
import { prisma } from "../lib/prisma";


export const findByLocation = async (
  province: string,
  districtNumber: number,
) => {
  return await prisma.constituency.findUnique({
    where: {
      province_districtNumber: {
        province,
        districtNumber,
      },
    },
  });
};
export const findById = async (id: number) => {
  return await prisma.constituency.findUnique({
    where: { id },
  });
};

export const create = async (data: Prisma.ConstituencyCreateInput) => {
  return await prisma.constituency.create({
    data,
  });
};

export const close = async (id: number) => {
  return await prisma.constituency.update({
    where: { id },
    data: { isClosed: true },
  });
};

export const findAll = async () => {
  return await prisma.constituency.findMany({
    orderBy: [{ province: "asc" }, { districtNumber: "asc" }],
  });
};

export const findByProvince = async (province: string) => {
  return await prisma.constituency.findMany({
    where: { province },
    orderBy: { districtNumber: "asc" },
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


export const update = async (
  id: number,
  data: { province?: string; districtNumber?: number; isClosed?: boolean },
) => {
  return await prisma.constituency.update({
    where: { id },
    data,
  });
};

export const remove = async (id: number) => {
  return await prisma.constituency.delete({
    where: { id },
  });
};

export const findAllWithCandidateCount = async () => {
  return await prisma.constituency.findMany({
    orderBy: [{ province: "asc" }, { districtNumber: "asc" }],
    include: {
      _count: {
        select: { candidates: true },
      },
    },
  });
};