import { Router } from "express";
import { ElectionController } from "../controllers/election.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { uploadImageSafe } from "../middlewares/upload.middleware";

const router = Router();
const electionController = new ElectionController();

router.post(
  "/party",
  authenticate,
  authorize("EC"),
  electionController.createParty,
);

router.post(
  "/candidate",
  authenticate,
  authorize("EC"),
  electionController.addCandidate,
);

router.get("/public/parties", electionController.getPublicPartyList);

router.get("/public/party/:id", electionController.getPublicPartyDetails);

router.get(
  "/parties",
  authenticate,
  authorize("EC"),
  electionController.getAllParties,
);

router.get(
  "/party/:id",
  authenticate,
  authorize("EC"),
  electionController.getPartyById,
);

router.put(
  "/party/:id",
  authenticate,
  authorize("EC"),
  electionController.updateParty,
);

router.delete(
  "/party/:id",
  authenticate,
  authorize("EC"),
  electionController.deleteParty,
);

router.get(
  "/voters",
  authenticate,
  authorize("EC"),
  electionController.getEligibleVoters,
);

router.get(
  "/candidates",
  authenticate,
  authorize("EC"),
  electionController.getCandidates,
);

router.get(
  "/candidate/:id",
  authenticate,
  authorize("EC"),
  electionController.getCandidateById,
);

router.put(
  "/candidate/:id",
  authenticate,
  authorize("EC"),
  electionController.updateCandidate,
);

router.delete(
  "/candidate/:id",
  authenticate,
  authorize("EC"),
  electionController.deleteCandidate,
);

router.get(
  "/next-candidate-number/:constituencyId",
  authenticate,
  authorize("EC"),
  electionController.getNextCandidateNumber,
);

router.get(
  "/provinces",
  authenticate,
  authorize("EC"),
  electionController.getAllProvinces,
);

router.post(
  "/party/:id/logo",
  authenticate,
  uploadImageSafe,
  authorize("EC"),
  electionController.uploadPartyLogo,
);

router.get("/constituency/:id", electionController.getConstituencyData);

router.patch(
  "/close/:id",
  authenticate,
  authorize("EC"),
  electionController.closePoll,
);

router.get("/party-overview", electionController.getPartyOverview);

router.get("/constituencies", electionController.getAllConstituencies);

export default router;
