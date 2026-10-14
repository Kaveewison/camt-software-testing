// src/middlewares/role.middleware.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // ตรวจสอบว่ามีข้อมูล user จาก authenticate middleware หรือไม่
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "กรุณาล็อกอินเข้าสู่ระบบ",
      });
    }

    // ตรวจสอบว่า role ของ user อยู่ใน roles ที่อนุญาตหรือไม่
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `คุณไม่มีสิทธิ์เข้าถึงฟีเจอร์นี้ (ต้องการสิทธิ์: ${roles.join(" หรือ ")})`,
      });
    }

    next();
  };
};
