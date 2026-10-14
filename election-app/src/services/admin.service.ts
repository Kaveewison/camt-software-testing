// src/services/admin.service.ts
import { $Enums } from "../generated/prisma";
import * as userRepo from "../repositories/user.repository";
import * as constituencyRepo from "../repositories/constituency.repository";

export class AdminService {
  private static readonly VALID_ROLES = ["VOTER", "EC", "ADMIN"] as const;


  public getAllUsers = async (filters?: { role?: string; province?: string }) => {
    if (filters?.role) {
      const upperRole = filters.role.toUpperCase();
      if (!AdminService.VALID_ROLES.includes(upperRole as any)) {
        throw new Error("Role ไม่ถูกต้อง (VOTER, EC, ADMIN)");
      }
      return await userRepo.findByRole(upperRole as "VOTER" | "EC" | "ADMIN");
    }

    if (filters?.province) {
      return await userRepo.findByProvince(filters.province);
    }

    return await userRepo.findAllWithFullDetails();
  };

  public getUserById = async (userId: number) => {
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    return user;
  };


  public createConstituency = async (data: {
    province: string;
    districtNumber: number;
  }) => {
    if (!data.province || !data.districtNumber) {
      throw new Error("กรุณาระบุ province และ districtNumber");
    }

    const existing = await constituencyRepo.findByLocation(
      data.province,
      data.districtNumber,
    );

    if (existing) {
      throw new Error(
        `เขตเลือกตั้ง ${data.province} เขตที่ ${data.districtNumber} มีอยู่แล้ว`,
      );
    }

    const constituency = await constituencyRepo.create({
      province: data.province,
      districtNumber: data.districtNumber,
      isClosed: false,
    });

    return constituency;
  };

  public promoteUserToEC = async (userId: number) => {
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    if (user.role === $Enums.Role.EC) {
      throw new Error(`ผู้ใช้นี้เป็น EC อยู่แล้ว`);
    }

    if (user.role === $Enums.Role.ADMIN) {
      throw new Error(`ไม่สามารถเปลี่ยน Admin เป็น EC ได้`);
    }

    const updatedUser = await userRepo.updateRole(userId, $Enums.Role.EC);

    return updatedUser;
  };

  public updateUser = async (
    userId: number,
    data: {
      title?: string;
      firstName?: string;
      lastName?: string;
      address?: string;
      constituencyId?: number;
    },
  ) => {
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    if (data.constituencyId) {
      const constituency = await constituencyRepo.findById(data.constituencyId);
      if (!constituency) {
        throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${data.constituencyId}`);
      }
    }

    return await userRepo.update(userId, data);
  };

  public demoteECToVoter = async (userId: number) => {
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new Error(`ไม่พบผู้ใช้ ID: ${userId}`);
    }

    if (user.role === $Enums.Role.VOTER) {
      throw new Error(`ผู้ใช้นี้เป็น Voter อยู่แล้ว`);
    }

    if (user.role === $Enums.Role.ADMIN) {
      throw new Error(`ไม่สามารถเปลี่ยน Admin เป็น Voter ได้`);
    }

    const updatedUser = await userRepo.updateRole(userId, $Enums.Role.VOTER);

    return updatedUser;
  };

  public getAllConstituencies = async () => {
    return await constituencyRepo.findAllWithCandidateCount();
  };

  public getConstituencyById = async (id: number) => {
    const constituency = await constituencyRepo.findById(id);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${id}`);
    }

    return constituency;
  };

  public updateConstituency = async (
    id: number,
    data: { province?: string; districtNumber?: number; isClosed?: boolean },
  ) => {
    const constituency = await constituencyRepo.findById(id);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${id}`);
    }

    // ถ้ามีการเปลี่ยน province หรือ districtNumber ต้องตรวจสอบว่าไม่ซ้ำ
    if (data.province || data.districtNumber) {
      const newProvince = data.province || constituency.province;
      const newDistrictNumber =
        data.districtNumber || constituency.districtNumber;

      const existing = await constituencyRepo.findByLocation(
        newProvince,
        newDistrictNumber,
      );

      if (existing && existing.id !== id) {
        throw new Error(
          `เขตเลือกตั้ง ${newProvince} เขตที่ ${newDistrictNumber} มีอยู่แล้ว`,
        );
      }
    }

    return await constituencyRepo.update(id, data);
  };

  public deleteConstituency = async (id: number) => {
    const constituency = await constituencyRepo.findById(id);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${id}`);
    }

    return await constituencyRepo.remove(id);
  };

  public toggleConstituencyStatus = async (id: number) => {
    const constituency = await constituencyRepo.findById(id);

    if (!constituency) {
      throw new Error(`ไม่พบเขตเลือกตั้ง ID: ${id}`);
    }

    return await constituencyRepo.update(id, {
      isClosed: !constituency.isClosed,
    });
  };
}