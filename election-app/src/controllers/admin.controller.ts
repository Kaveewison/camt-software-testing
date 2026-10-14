// src/controllers/admin.controller.ts
import { Request, Response } from "express";
import { AdminService } from "../services/admin.service";

export class AdminController {
  constructor(private adminService: AdminService = new AdminService()) { }



  getAllUsers = async (req: Request, res: Response) => {

    try {
      const { role, province } = req.query;

      const users = await this.adminService.getAllUsers({
        role: typeof role === "string" ? role : undefined,
        province: typeof province === "string" ? province : undefined,
      });

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };


  createConstituency = async (req: Request, res: Response) => {
    try {
      const { province, districtNumber } = req.body;

      const constituency = await this.adminService.createConstituency({
        province,
        districtNumber,
      });

      res.status(201).json({
        success: true,
        message: "สร้างเขตเลือกตั้งสำเร็จ",
        data: constituency,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  promoteUserToEC = async (req: Request, res: Response) => {
    try {
      const userIdParam = req.params.userId;
      const userId = parseInt(
        Array.isArray(userIdParam) ? userIdParam[0] : userIdParam,
      );

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: "User ID ไม่ถูกต้อง",
        });
      }

      const user = await this.adminService.promoteUserToEC(userId);

      res.status(200).json({
        success: true,
        message: "เปลี่ยน Role เป็น EC สำเร็จ",
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getUserById = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "User ID ไม่ถูกต้อง",
        });
      }

      const user = await this.adminService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  updateUser = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
      const { title, firstName, lastName, address, constituencyId } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "User ID ไม่ถูกต้อง",
        });
      }

      const user = await this.adminService.updateUser(id, {
        title,
        firstName,
        lastName,
        address,
        constituencyId,
      });

      res.status(200).json({
        success: true,
        message: "อัปเดตข้อมูลผู้ใช้สำเร็จ",
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };
  demoteECToVoter = async (req: Request, res: Response) => {
    try {
      const userIdParam = req.params.userId;
      const userId = parseInt(
        Array.isArray(userIdParam) ? userIdParam[0] : userIdParam,
      );

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: "User ID ไม่ถูกต้อง",
        });
      }

      const user = await this.adminService.demoteECToVoter(userId);

      res.status(200).json({
        success: true,
        message: "เปลี่ยน Role เป็น Voter สำเร็จ",
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getAllConstituencies = async (req: Request, res: Response) => {
    try {
      const constituencies = await this.adminService.getAllConstituencies();

      res.status(200).json({
        success: true,
        data: constituencies,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getConstituencyById = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Constituency ID ไม่ถูกต้อง",
        });
      }

      const constituency = await this.adminService.getConstituencyById(id);

      res.status(200).json({
        success: true,
        data: constituency,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  updateConstituency = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
      const { province, districtNumber, isClosed } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Constituency ID ไม่ถูกต้อง",
        });
      }

      const constituency = await this.adminService.updateConstituency(id, {
        province,
        districtNumber,
        isClosed,
      });

      res.status(200).json({
        success: true,
        message: "อัปเดตเขตเลือกตั้งสำเร็จ",
        data: constituency,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  deleteConstituency = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Constituency ID ไม่ถูกต้อง",
        });
      }

      await this.adminService.deleteConstituency(id);

      res.status(200).json({
        success: true,
        message: "ลบเขตเลือกตั้งสำเร็จ",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  toggleConstituencyStatus = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Constituency ID ไม่ถูกต้อง",
        });
      }

      const constituency = await this.adminService.toggleConstituencyStatus(id);

      res.status(200).json({
        success: true,
        message: constituency.isClosed
          ? "ปิดการลงคะแนนสำเร็จ"
          : "เปิดการลงคะแนนสำเร็จ",
        data: constituency,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };
}