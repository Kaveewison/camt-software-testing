// src/routes/admin.routes.ts
import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const adminController = new AdminController();


router.get(
  "/users",
  authenticate,
  authorize("ADMIN", "EC"),
  adminController.getAllUsers,
);

router.post(
  "/constituency",
  authenticate,
  authorize("ADMIN"),
  adminController.createConstituency,
);

router.patch(
  "/promote-ec/:userId",
  authenticate,
  authorize("ADMIN"),
  adminController.promoteUserToEC,
);

router.get(
  "/user/:id",
  authenticate,
  authorize("ADMIN", "EC"),
  adminController.getUserById,
);

router.put(
  "/user/:id",
  authenticate,
  authorize("ADMIN"),
  adminController.updateUser,
);

router.patch(
  "/demote-voter/:userId",
  authenticate,
  authorize("ADMIN"),
  adminController.demoteECToVoter,
);

router.get(
  "/constituencies",
  authenticate,
  authorize("ADMIN"),
  adminController.getAllConstituencies,
);

router.get(
  "/constituency/:id",
  authenticate,
  authorize("ADMIN"),
  adminController.getConstituencyById,
);

router.put(
  "/constituency/:id",
  authenticate,
  authorize("ADMIN"),
  adminController.updateConstituency,
);

router.delete(
  "/constituency/:id",
  authenticate,
  authorize("ADMIN"),
  adminController.deleteConstituency,
);

router.patch(
  "/constituency/:id/toggle-status",
  authenticate,
  authorize("ADMIN", "EC"),
  adminController.toggleConstituencyStatus,
);

export default router;