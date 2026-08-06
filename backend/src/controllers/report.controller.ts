import { Response } from 'express';
import { reportService } from '../services/report.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class ReportController {
  async getReports(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const reports = await reportService.getReports(req.user.id);
      return res.json(reports);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      return res.status(500).json({ error: 'Internal Server Error', details: error.message || String(error) });
    }
  }

  async getReportById(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const reportId = req.params.id as string;
      const report = await reportService.getReportById(reportId, req.user.id);
      return res.json(report);
    } catch (error: any) {
      console.error('Error fetching report:', error);
      if (error.message === 'Report not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Forbidden') {
        return res.status(403).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal Server Error', details: error.message || String(error) });
    }
  }

  async deleteReport(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const reportId = req.params.id as string;
      await reportService.deleteReport(reportId, req.user.id);
      return res.json({ success: true, message: 'Report deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting report:', error);
      if (error.message === 'Report not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Forbidden') {
        return res.status(403).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal Server Error', details: error.message || String(error) });
    }
  }
}

export const reportController = new ReportController();
