import { Request, Response } from 'express';
import { ElectionService } from '../services/election.service';

export class ElectionController {
  constructor(
    private electionService: ElectionService = new ElectionService(),
  ) { }

  /**
   * POST /api/election/party
   * สร้างพรรคการเมืองใหม่ (EC only)
   */
  createParty = async (req: Request, res: Response) => {
    try {
      const { name, logoUrl, policy } = req.body;

      const party = await this.electionService.createParty({
        name,
        logoUrl,
        policy,
      });

      res.status(201).json({
        success: true,
        message: "สร้างพรรคสำเร็จ",
        data: party,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * POST /api/election/candidate
   * เพิ่มผู้สมัคร (EC only)
   */

  addCandidate = async (req: Request, res: Response) => {
    try {
      const {
        candidateNumber,
        policy,
        partyId,
        constituencyId,
        userId,
      } = req.body;

      const candidate = await this.electionService.addCandidate({
        candidateNumber,
        policy,
        partyId,
        constituencyId,
        userId,
      });

      res.status(201).json({
        success: true,
        message: "เพิ่มผู้สมัครสำเร็จ",
        data: candidate,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
 * PATCH /api/election/close/:id
 * ปิดการลงคะแนนในเขต (EC only)
 */

  closePoll = async (req: Request, res: Response) => {
    try {
      const constituencyId = parseInt(req.params.id as string);

      if (isNaN(constituencyId)) {
        return res.status(400).json({
          success: false,
          message: 'Constituency ID ไม่ถูกต้อง',
        });
      }

      const constituency = await this.electionService.closePoll(constituencyId);

      res.status(200).json({
        success: true,
        message: 'ปิดการลงคะแนนสำเร็จ',
        data: constituency,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * GET /api/election/constituency/:id
   * ดูผลการเลือกตั้งในเขต
   */
  getConstituencyData = async (req: Request, res: Response) => {
    try {
      const constituencyId = parseInt(req.params.id as string);

      if (isNaN(constituencyId)) {
        return res.status(400).json({
          success: false,
          message: 'Constituency ID ไม่ถูกต้อง',
        });
      }

      const data =
        await this.electionService.getConstituencyResults(constituencyId);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * GET /api/election/party-overview
   * ดูภาพรวมพรรคทั้งหมดพร้อมจำนวน MPs
   */
  getPartyOverview = async (req: Request, res: Response) => {
    try {
      const { id, districtNumber } = req.query;

      const parsedId =
        typeof id === "string" ? parseInt(id) : undefined;
      const parsedDistrictNumber =
        typeof districtNumber === "string"
          ? parseInt(districtNumber)
          : undefined;

      if (parsedId !== undefined && isNaN(parsedId)) {
        return res.status(400).json({
          success: false,
          message: "id ต้องเป็นตัวเลข",
        });
      }

      if (
        parsedDistrictNumber !== undefined &&
        isNaN(parsedDistrictNumber)
      ) {
        return res.status(400).json({
          success: false,
          message: "districtNumber ต้องเป็นตัวเลข",
        });
      }

      if (parsedDistrictNumber !== undefined && parsedId === undefined) {
        return res.status(400).json({
          success: false,
          message: "กรุณาระบุ id เมื่อส่ง districtNumber",
        });
      }

      const parties = await this.electionService.getPartyOverview({
        id: parsedId,
        districtNumber: parsedDistrictNumber,
      });

      res.status(200).json({
        success: true,
        data: parties,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * GET /api/election/constituencies
   * ดูรายการเขตเลือกตั้งทั้งหมด (Public)
   */
  getAllConstituencies = async (req: Request, res: Response) => {
    try {
      const { province } = req.query;

      const constituencies = await this.electionService.getConstituencies({
        province: typeof province === "string" ? province : undefined,
      });

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

  getPublicPartyList = async (req: Request, res: Response) => {
    try {
      const parties = await this.electionService.getPublicPartyList();

      res.status(200).json({
        success: true,
        data: parties,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getPublicPartyDetails = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Party ID ไม่ถูกต้อง",
        });
      }

      const party = await this.electionService.getPublicPartyDetails(id);

      res.status(200).json({
        success: true,
        data: party,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getAllParties = async (req: Request, res: Response) => {
    try {
      const parties = await this.electionService.getAllParties();

      res.status(200).json({
        success: true,
        data: parties,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getPartyById = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Party ID ไม่ถูกต้อง",
        });
      }

      const party = await this.electionService.getPartyById(id);

      res.status(200).json({
        success: true,
        data: party,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  updateParty = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
      const { name, logoUrl, policy } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Party ID ไม่ถูกต้อง",
        });
      }

      const party = await this.electionService.updateParty(id, {
        name,
        logoUrl,
        policy,
      });

      res.status(200).json({
        success: true,
        message: "อัปเดตพรรคสำเร็จ",
        data: party,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  deleteParty = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Party ID ไม่ถูกต้อง",
        });
      }

      await this.electionService.deleteParty(id);

      res.status(200).json({
        success: true,
        message: "ลบพรรคสำเร็จ",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getEligibleVoters = async (req: Request, res: Response) => {
    try {
      const { constituencyId, province } = req.query;

      const data = await this.electionService.getEligibleVoters({
        constituencyId:
          typeof constituencyId === "string"
            ? parseInt(constituencyId)
            : undefined,
        province: typeof province === "string" ? province : undefined,
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getCandidates = async (req: Request, res: Response) => {
    try {
      const { constituencyId } = req.query;

      const data = await this.electionService.getCandidates({
        constituencyId:
          typeof constituencyId === "string"
            ? parseInt(constituencyId)
            : undefined,
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getCandidateById = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Candidate ID ไม่ถูกต้อง",
        });
      }

      const candidate = await this.electionService.getCandidateById(id);

      res.status(200).json({
        success: true,
        data: candidate,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  updateCandidate = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
      const { candidateNumber, title, firstName, lastName, imageUrl, policy, partyId } =
        req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Candidate ID ไม่ถูกต้อง",
        });
      }

      const candidate = await this.electionService.updateCandidate(id, {
        candidateNumber,
        title,
        firstName,
        lastName,
        imageUrl,
        policy,
        partyId,
      });

      res.status(200).json({
        success: true,
        message: "อัปเดตผู้สมัครสำเร็จ",
        data: candidate,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  deleteCandidate = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Candidate ID ไม่ถูกต้อง",
        });
      }

      await this.electionService.deleteCandidate(id);

      res.status(200).json({
        success: true,
        message: "ลบผู้สมัครสำเร็จ",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getNextCandidateNumber = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.constituencyId;
      const constituencyId = parseInt(
        Array.isArray(idParam) ? idParam[0] : idParam,
      );

      if (isNaN(constituencyId)) {
        return res.status(400).json({
          success: false,
          message: "Constituency ID ไม่ถูกต้อง",
        });
      }

      const nextNumber =
        await this.electionService.getNextCandidateNumber(constituencyId);

      res.status(200).json({
        success: true,
        data: { nextCandidateNumber: nextNumber },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getAllProvinces = async (req: Request, res: Response) => {
    try {
      const provinces = await this.electionService.getAllProvinces();

      res.status(200).json({
        success: true,
        data: provinces,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };


  uploadPartyLogo = async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const partyId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(partyId)) {
        return res.status(400).json({
          success: false,
          message: "Party ID ไม่ถูกต้อง",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "กรุณาเลือกไฟล์รูปภาพ",
        });
      }

      const result = await this.electionService.uploadPartyLogo(partyId, req.file);

      res.status(200).json({
        success: true,
        message: "อัปโหลดโลโก้พรรคสำเร็จ",
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
