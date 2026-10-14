import { Router } from "express";
import { VoteController } from "../controllers/vote.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();
const voteController = new VoteController();

router.get(
  "/ballot",
  authenticate,
  authorize("VOTER", "EC"),
  voteController.getBallot,
);

router.post("/", authenticate, authorize("VOTER", "EC"), voteController.vote);

router.get(
  "/my-vote",
  authenticate,
  authorize("VOTER", "EC"),
  voteController.getMyVote,
);

router.get(
  "/my-results",
  authenticate,
  authorize("VOTER", "EC"),
  voteController.getMyConstituencyResults,
);

router.get(
  "/constituencies",
  authenticate,
  authorize("VOTER", "EC"),
  voteController.getAllConstituencies,
);


export default router;