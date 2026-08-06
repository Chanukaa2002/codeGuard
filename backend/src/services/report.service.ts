import { prisma } from '../config/db';
import { redis } from '../utils/redis';

export class ReportService {
  async getReports(userId: string) {
    const cacheKey = `reports:user:${userId}`;
    let cachedData = null;
    try {
      cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (redisError) {
      console.warn('Redis cache read failed for reports:', redisError);
    }

    const reports = await prisma.scanReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    try {
      await redis.set(cacheKey, JSON.stringify(reports), 'EX', 60);
    } catch (redisError) {
      console.warn('Redis cache write failed for reports:', redisError);
    }

    return reports;
  }

  async getReportById(reportId: string, userId: string) {
    const report = await prisma.scanReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    if (report.userId !== userId) {
      throw new Error('Forbidden');
    }

    return report;
  }

  async deleteReport(reportId: string, userId: string) {
    const report = await prisma.scanReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    if (report.userId !== userId) {
      throw new Error('Forbidden');
    }

    await prisma.scanReport.delete({
      where: { id: reportId },
    });

    try {
      await redis.del(`reports:user:${userId}`);
    } catch (redisError) {
      console.warn('Redis cache delete failed:', redisError);
    }

    return true;
  }
}

export const reportService = new ReportService();
