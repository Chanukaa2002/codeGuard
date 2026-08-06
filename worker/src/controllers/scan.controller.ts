import { Request, Response } from 'express';
import { scanService } from '../services/scan.service';

export class ScanController {
  async process(req: Request, res: Response): Promise<any> {
    const data = req.body;
    if (!data.scanReportId) {
      return res.status(400).json({ error: 'Missing scanReportId' });
    }
    
    // Kick off background job immediately and return 202
    scanService.processScanJob(data).catch(console.error);
    
    return res.status(202).json({ message: 'Job accepted' });
  }
}

export const scanController = new ScanController();
