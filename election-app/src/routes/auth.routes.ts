// src/routes/auth.routes.ts
import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { uploadImageSafe } from "../middlewares/upload.middleware";

const router = Router();
const authController = new AuthController();

router.get("/me", authenticate, authController.getProfile);
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post(
    "/upload-profile-image",
    authenticate,
    uploadImageSafe,
    authController.uploadProfileImage,
);

router.put("/profile", authenticate, authController.updateProfile);


export default router;
