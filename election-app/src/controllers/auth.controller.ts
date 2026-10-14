// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthService } from "../services/auth.service";

export class AuthController {
  constructor(private authService: AuthService = new AuthService()) { }

  public getProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "กรุณาล็อกอินเข้าสู่ระบบ",
        });
      }

      const user = await this.authService.getUserProfile(userId);

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          nationalId: user.nationalId,
          title: user.title,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          constituency: user.constituency,
          address: user.address,
          imageUrl: user.imageUrl,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  public register = async (req: Request, res: Response) => {
    try {
      // รับค่าจาก Body
      const {
        nationalId,
        laserCode,
        title,
        firstName,
        lastName,
        address,
        province,
        districtNumber,
        imageUrl,
      } = req.body;

      // Validate required fields
      if (
        !nationalId ||
        !laserCode ||
        !firstName ||
        !lastName ||
        !province ||
        !districtNumber
      ) {
        return res.status(400).json({
          success: false,
          message:
            "กรุณาระบุข้อมูลให้ครบถ้วน (nationalId, laserCode, firstName, lastName, province, districtNumber)",
        });
      }

      // เรียก Service เพื่อทำงาน
      const newUser = await this.authService.registerUser(
        nationalId,
        laserCode,
        title,
        firstName,
        lastName,
        address,
        province,
        parseInt(districtNumber),
        imageUrl,
      );

      // สร้าง JWT Token
      const token = jwt.sign(
        {
          id: newUser.id,
          nationalId: newUser.nationalId,
          role: newUser.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }, // Token มีอายุ 7 วัน
      );

      // ส่งผลลัพธ์กลับพร้อม Token
      res.status(201).json({
        success: true,
        message: "ลงทะเบียนสำเร็จ",
        data: {
          user: {
            id: newUser.id,
            nationalId: newUser.nationalId,
            title: newUser.title,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            constituency: newUser.constituency,
            imageUrl: newUser.imageUrl,
          },
          token,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  public login = async (req: Request, res: Response) => {
    try {
      const { nationalId, laserCode } = req.body;

      if (!nationalId || !laserCode) {
        return res.status(400).json({
          success: false,
          message: "กรุณาระบุเลขบัตรประชาชนและ Laser Code",
        });
      }

      // เรียก Service เพื่อหาผู้ใช้
      const user = await this.authService.loginUser(nationalId, laserCode);

      // สร้าง JWT Token
      const token = jwt.sign(
        {
          id: user.id,
          nationalId: user.nationalId,
          role: user.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" },
      );

      res.status(200).json({
        success: true,
        message: "เข้าสู่ระบบสำเร็จ",
        data: {
          user: {
            id: user.id,
            nationalId: user.nationalId,
            title: user.title,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            constituency: user.constituency,
          },
          token,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  public uploadProfileImage = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "กรุณาล็อกอินเข้าสู่ระบบ",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "กรุณาเลือกไฟล์รูปภาพ",
        });
      }

      const result = await this.authService.uploadProfileImage(userId, req.file);

      res.status(200).json({
        success: true,
        message: "อัปโหลดรูปโปรไฟล์สำเร็จ",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  public updateProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "กรุณาล็อกอินเข้าสู่ระบบ",
        });
      }

      const { title, firstName, lastName, address, imageUrl } = req.body;

      const user = await this.authService.updateProfile(userId, {
        title,
        firstName,
        lastName,
        address,
        imageUrl,
      });

      res.status(200).json({
        success: true,
        message: "อัปเดตข้อมูลสำเร็จ",
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };
}
