import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { VoteService } from "../services/vote.service";

export class VoteController {
  constructor(private voteService: VoteService = new VoteService()) { }

  getBallot = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "กรุณาล็อกอินเข้าสู่ระบบ",
        });
      }

      const ballot = await this.voteService.getBallot(userId);

      res.status(200).json({
        success: true,
        data: ballot,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  vote = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { candidateId } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "กรุณาล็อกอินเข้าสู่ระบบ",
        });
      }

      if (!candidateId) {
        return res.status(400).json({
          success: false,
          message: "กรุณาระบุ candidateId",
        });
      }

      const result = await this.voteService.castVote(userId, candidateId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.vote,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getMyVote = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "กรุณาล็อกอินเข้าสู่ระบบ",
        });
      }

      const result = await this.voteService.getMyVote(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getMyConstituencyResults = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "กรุณาล็อกอินเข้าสู่ระบบ",
        });
      }

      const result = await this.voteService.getMyConstituencyResults(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getAllConstituencies = async (req: AuthRequest, res: Response) => {
    try {
      const { province } = req.query;

      const result = await this.voteService.getConstituenciesList(
        typeof province === "string" ? province : undefined,
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getResultsByConstituency = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "กรุณาล็อกอินเข้าสู่ระบบ",
        });
      }

      const { province, districtNumber } = req.query;

      const result = await this.voteService.getResultsByFilter(
        userId,
        typeof province === "string" ? province : undefined,
        districtNumber ? parseInt(districtNumber as string) : undefined,
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };
}
