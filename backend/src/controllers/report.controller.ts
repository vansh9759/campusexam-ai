import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ReportService } from '../services/report.service';

export class ReportController {
  static async exportExamExcel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { examId } = req.params;
      const buffer = await ReportService.generateExamExcel(examId);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=exam_report_${examId}.xlsx`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  static async exportStudentResultPdf(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { attemptId } = req.params;
      const buffer = await ReportService.generateStudentResultPdf(attemptId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=grade_transcript_${attemptId}.pdf`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}
