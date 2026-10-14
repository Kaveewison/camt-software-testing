import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const imageFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files (jpg, jpeg, png, gif, webp) are allowed"));
    }
};

export const uploadImage = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
}).single("image");

export const uploadImageSafe = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    uploadImage(req, res, (err: any) => {
        if (!err) return next();

        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "ไฟล์มีขนาดใหญ่เกินไป (ไม่เกิน 5MB)",
                });
            }

            return res.status(400).json({
                success: false,
                message: "Upload error: " + err.message,
            });
        }

        return res.status(400).json({
            success: false,
            message: err.message || "Upload failed",
        });
    });
};