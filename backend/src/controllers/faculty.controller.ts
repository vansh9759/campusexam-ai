import { Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../types';
import { GradingService } from '../services/grading.service';
import { AuditService } from '../services/audit.service';

export class FacultyController {
  // 1. Dashboard Overview
  static async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const facultyProfile = await prisma.facultyProfile.findUnique({
        where: { userId: req.user?.userId },
      });

      if (!facultyProfile) {
        res.status(404).json({ success: false, message: 'Faculty profile not found.' });
        return;
      }

      const [assignedSubjects, exams, questionsCount] = await Promise.all([
        prisma.facultySubject.findMany({
          where: { facultyId: facultyProfile.id },
          include: { subject: true, session: true },
        }),
        prisma.examination.findMany({
          where: { facultyId: facultyProfile.id },
          include: {
            subject: true,
            attempts: {
              include: { gradingResult: true, evaluations: true },
            },
            questions: true,
          },
        }),
        prisma.questionBank.count({
          where: { facultyId: facultyProfile.id },
        }),
      ]);

      const totalExams = exams.length;
      const activeExams = exams.filter((e) => e.status === 'ACTIVE').length;
      const totalAttempts = exams.reduce((acc, e) => acc + e.attempts.length, 0);

      // Pending evaluations: descriptive questions without manual evaluation
      let pendingEvaluations = 0;
      exams.forEach((e) => {
        e.attempts.forEach((att) => {
          if (att.status === 'SUBMITTED' && (!att.gradingResult || att.gradingResult.auditNotes?.includes('pending'))) {
            pendingEvaluations++;
          }
        });
      });

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            assignedSubjectsCount: assignedSubjects.length,
            totalExams,
            activeExams,
            totalAttempts,
            pendingEvaluations,
            questionsCount,
          },
          assignedSubjects,
          recentExams: exams.slice(0, 5),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // 2. Exam Management
  static async getExams(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const faculty = await prisma.facultyProfile.findUnique({ where: { userId: req.user?.userId } });
      if (!faculty) {
        res.status(404).json({ success: false, message: 'Faculty profile not found' });
        return;
      }

      const exams = await prisma.examination.findMany({
        where: { facultyId: faculty.id },
        include: {
          subject: true,
          session: true,
          _count: { select: { questions: true, attempts: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ success: true, data: exams });
    } catch (error) {
      next(error);
    }
  }

  static async getExamById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const exam = await prisma.examination.findUnique({
        where: { id },
        include: {
          subject: true,
          session: true,
          questions: {
            include: {
              questionBank: {
                include: { options: true, testCases: true },
              },
            },
            orderBy: { orderIndex: 'asc' },
          },
          attempts: {
            include: {
              student: { include: { user: true, department: true } },
              gradingResult: true,
            },
          },
        },
      });

      if (!exam) {
        res.status(404).json({ success: false, message: 'Examination not found' });
        return;
      }

      res.status(200).json({ success: true, data: exam });
    } catch (error) {
      next(error);
    }
  }

  static async createExam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const faculty = await prisma.facultyProfile.findUnique({ where: { userId: req.user?.userId } });
      if (!faculty) {
        res.status(404).json({ success: false, message: 'Faculty not found' });
        return;
      }

      const {
        title,
        description,
        subjectId,
        sessionId,
        startTime,
        endTime,
        durationMinutes,
        totalMarks,
        passingMarks,
        negativeMarking,
        negativeMarkValue,
        randomizeQuestions,
        randomizeOptions,
        maxAttempts,
        status,
        questionIds, // optional array of questionBankIds to associate
      } = req.body;

      const exam = await prisma.examination.create({
        data: {
          title,
          description,
          subjectId,
          sessionId,
          facultyId: faculty.id,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          durationMinutes: Number(durationMinutes) || 60,
          totalMarks: Number(totalMarks) || 100,
          passingMarks: Number(passingMarks) || 40,
          negativeMarking: Boolean(negativeMarking),
          negativeMarkValue: Number(negativeMarkValue) || 0,
          randomizeQuestions: Boolean(randomizeQuestions),
          randomizeOptions: Boolean(randomizeOptions),
          maxAttempts: Number(maxAttempts) || 1,
          status: status || 'DRAFT',
          isPublished: status === 'PUBLISHED' || status === 'ACTIVE',
          questions: questionIds && questionIds.length > 0
            ? {
                create: questionIds.map((qId: string, idx: number) => ({
                  questionBankId: qId,
                  orderIndex: idx,
                })),
              }
            : undefined,
        },
      });

      await AuditService.log({
        userId: req.user?.userId,
        action: 'EXAM_CREATED',
        resource: 'Examination',
        resourceId: exam.id,
        metadata: { title, status: exam.status },
      });

      res.status(201).json({ success: true, data: exam });
    } catch (error) {
      next(error);
    }
  }

  static async updateExamStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const exam = await prisma.examination.update({
        where: { id },
        data: {
          status,
          isPublished: status === 'PUBLISHED' || status === 'ACTIVE',
        },
      });

      res.status(200).json({ success: true, data: exam });
    } catch (error) {
      next(error);
    }
  }

  // 3. Question Bank Management
  static async getQuestionBank(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { subjectId, type } = req.query;
      const whereClause: any = {};
      if (subjectId) whereClause.subjectId = subjectId as string;
      if (type) whereClause.type = type as string;

      const questions = await prisma.questionBank.findMany({
        where: whereClause,
        include: {
          subject: true,
          options: true,
          testCases: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ success: true, data: questions });
    } catch (error) {
      next(error);
    }
  }

  static async createQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const faculty = await prisma.facultyProfile.findUnique({ where: { userId: req.user?.userId } });
      if (!faculty) {
        res.status(404).json({ success: false, message: 'Faculty profile not found' });
        return;
      }

      const {
        subjectId,
        type,
        title,
        content,
        marks,
        negativeMarks,
        difficulty,
        explanation,
        options,
        keywords,
        rubric,
        codingDetails,
        testCases,
      } = req.body;

      // Enforce MCQs-only policy
      if (type !== 'MCQ_SINGLE' && type !== 'MCQ_MULTIPLE') {
        res.status(400).json({
          success: false,
          message: 'Policy restriction: Examinations and question repository only permit Multiple Choice Questions (MCQ Single or Multiple Correct).',
        });
        return;
      }

      if (!options || options.length < 2) {
        res.status(400).json({
          success: false,
          message: 'Multiple Choice Questions require at least 2 distinct answer options.',
        });
        return;
      }

      const question = await prisma.questionBank.create({
        data: {
          subjectId,
          facultyId: faculty.id,
          type,
          title,
          content,
          marks: Number(marks) || 1,
          negativeMarks: Number(negativeMarks) || 0,
          difficulty: difficulty || 'MEDIUM',
          explanation,
          keywords: keywords ? (typeof keywords === 'string' ? keywords : JSON.stringify(keywords)) : null,
          rubricJson: rubric ? (typeof rubric === 'string' ? rubric : JSON.stringify(rubric)) : null,
          codingDetails: codingDetails ? (typeof codingDetails === 'string' ? codingDetails : JSON.stringify(codingDetails)) : null,
          options: options && options.length > 0
            ? {
                create: options.map((opt: any, idx: number) => ({
                  text: opt.text,
                  isCorrect: Boolean(opt.isCorrect),
                  orderIndex: idx,
                })),
              }
            : undefined,
          testCases: testCases && testCases.length > 0
            ? {
                create: testCases.map((tc: any) => ({
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  isSample: Boolean(tc.isSample),
                  isHidden: Boolean(tc.isHidden),
                  marksWeight: Number(tc.marksWeight) || 1.0,
                })),
              }
            : undefined,
        },
        include: { options: true, testCases: true },
      });

      res.status(201).json({ success: true, data: question });
    } catch (error) {
      next(error);
    }
  }

  // 4. Manual Evaluation of Descriptive Answers
  static async evaluateStudentSubmission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { attemptId } = req.params;
      const { evaluations } = req.body; // Array of { questionId, marksAwarded, rubricScores, feedback }
      const faculty = await prisma.facultyProfile.findUnique({ where: { userId: req.user?.userId } });

      if (!faculty) {
        res.status(404).json({ success: false, message: 'Faculty profile not found' });
        return;
      }

      for (const ev of evaluations) {
        await prisma.manualEvaluation.upsert({
          where: {
            attemptId_questionId: {
              attemptId,
              questionId: ev.questionId,
            },
          },
          update: {
            evaluatorId: faculty.id,
            marksAwarded: Number(ev.marksAwarded),
            rubricScores: ev.rubricScores ? JSON.stringify(ev.rubricScores) : null,
            feedback: ev.feedback,
            evaluatedAt: new Date(),
          },
          create: {
            attemptId,
            questionId: ev.questionId,
            evaluatorId: faculty.id,
            marksAwarded: Number(ev.marksAwarded),
            rubricScores: ev.rubricScores ? JSON.stringify(ev.rubricScores) : null,
            feedback: ev.feedback,
            evaluatedAt: new Date(),
          },
        });
      }

      // Re-run overall grading engine to update total marks, percentage and pass status
      const updatedResult = await GradingService.evaluateAttempt(attemptId);

      res.status(200).json({
        success: true,
        message: 'Evaluation saved and grades updated successfully.',
        data: updatedResult,
      });
    } catch (error) {
      next(error);
    }
  }

  // 5. Publish Results
  static async publishResults(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { examId } = req.params;
      const { releaseAnswersToStudents = true } = req.body;

      const exam = await prisma.examination.update({
        where: { id: examId },
        data: { resultsPublished: true, status: 'COMPLETED' },
      });

      await prisma.resultPublication.upsert({
        where: { examinationId: examId },
        update: {
          publishedBy: req.user?.name || 'Faculty',
          publishedAt: new Date(),
          releaseAnswersToStudents: Boolean(releaseAnswersToStudents),
        },
        create: {
          examinationId: examId,
          publishedBy: req.user?.name || 'Faculty',
          publishedAt: new Date(),
          releaseAnswersToStudents: Boolean(releaseAnswersToStudents),
        },
      });

      await AuditService.log({
        userId: req.user?.userId,
        action: 'RESULTS_PUBLISHED',
        resource: 'Examination',
        resourceId: examId,
        metadata: { releaseAnswersToStudents },
      });

      res.status(200).json({
        success: true,
        message: 'Results officially published to students.',
        data: exam,
      });
    } catch (error) {
      next(error);
    }
  }

  // 6. Exam Class Analytics
  static async getExamAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { examId } = req.params;
      const exam = await prisma.examination.findUnique({
        where: { id: examId },
        include: {
          subject: true,
          questions: {
            include: { questionBank: true },
          },
          attempts: {
            include: {
              student: { include: { user: true } },
              gradingResult: true,
              answers: true,
            },
          },
        },
      });

      if (!exam) {
        res.status(404).json({ success: false, message: 'Examination not found' });
        return;
      }

      const results = exam.attempts.map((a) => a.gradingResult).filter(Boolean);
      const totalCandidates = exam.attempts.length;
      const gradedCount = results.length;

      let highest = 0;
      let lowest = exam.totalMarks;
      let sum = 0;
      let passedCount = 0;

      results.forEach((r) => {
        if (r!.totalObtained > highest) highest = r!.totalObtained;
        if (r!.totalObtained < lowest) lowest = r!.totalObtained;
        sum += r!.totalObtained;
        if (r!.isPassed) passedCount++;
      });

      const average = gradedCount > 0 ? Math.round((sum / gradedCount) * 10) / 10 : 0;
      const passRate = gradedCount > 0 ? Math.round((passedCount / gradedCount) * 1000) / 10 : 0;

      // Score distribution buckets: <40%, 40-59%, 60-74%, 75-89%, 90-100%
      const distribution = [
        { range: '0-39% (Fail)', count: 0 },
        { range: '40-59% (Pass)', count: 0 },
        { range: '60-74% (First Class)', count: 0 },
        { range: '75-89% (Distinction)', count: 0 },
        { range: '90-100% (Outstanding)', count: 0 },
      ];

      results.forEach((r) => {
        const pct = r!.percentage;
        if (pct < 40) distribution[0].count++;
        else if (pct < 60) distribution[1].count++;
        else if (pct < 75) distribution[2].count++;
        else if (pct < 90) distribution[3].count++;
        else distribution[4].count++;
      });

      res.status(200).json({
        success: true,
        data: {
          examTitle: exam.title,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          totalCandidates,
          gradedCount,
          highest,
          lowest: gradedCount > 0 ? lowest : 0,
          average,
          passRate,
          distribution,
          attempts: exam.attempts.map((att) => ({
            id: att.id,
            studentName: att.student.user.name,
            rollNumber: att.student.rollNumber,
            status: att.status,
            totalObtained: att.gradingResult?.totalObtained,
            percentage: att.gradingResult?.percentage,
            isPassed: att.gradingResult?.isPassed,
            tabSwitchCount: att.tabSwitchCount,
            submittedAt: att.submittedAt,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
