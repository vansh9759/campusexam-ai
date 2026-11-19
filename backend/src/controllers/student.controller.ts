import { Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../types';

export class StudentController {
  // 1. Student Dashboard Overview
  static async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user?.userId },
        include: {
          department: true,
          course: true,
          currentSemester: true,
          enrollments: {
            include: { subject: true },
          },
        },
      });

      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found' });
        return;
      }

      const subjectIds = student.enrollments.map((e) => e.subjectId);
      const now = new Date();

      // Find exams for student's enrolled subjects
      const [allExams, attempts, notifications] = await Promise.all([
        prisma.examination.findMany({
          where: {
            subjectId: { in: subjectIds },
            isPublished: true,
          },
          include: {
            subject: true,
            faculty: { include: { user: true } },
          },
          orderBy: { startTime: 'asc' },
        }),
        prisma.examAttempt.findMany({
          where: { studentId: student.id },
          include: {
            gradingResult: true,
            examination: { include: { subject: true } },
          },
          orderBy: { startedAt: 'desc' },
        }),
        prisma.notification.findMany({
          where: { userId: req.user?.userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      const attemptMap = new Map(attempts.map((a) => [a.examinationId, a]));

      const activeExams = allExams.filter((e) => {
        const hasSubmitted = attemptMap.get(e.id)?.status === 'SUBMITTED';
        return (
          e.status === 'ACTIVE' &&
          !hasSubmitted &&
          now >= new Date(e.startTime) &&
          now <= new Date(e.endTime)
        );
      });

      const upcomingExams = allExams.filter((e) => {
        return (
          (e.status === 'PUBLISHED' || e.status === 'ACTIVE') &&
          now < new Date(e.startTime)
        );
      });

      const completedAttempts = attempts.filter((a) => a.status === 'SUBMITTED');

      res.status(200).json({
        success: true,
        data: {
          profile: student,
          activeExams,
          upcomingExams,
          completedAttempts,
          notifications,
          stats: {
            enrolledSubjectsCount: student.enrollments.length,
            activeExamsCount: activeExams.length,
            upcomingExamsCount: upcomingExams.length,
            completedExamsCount: completedAttempts.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // 2. Student Results History (Only officially published results)
  static async getResults(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user?.userId },
      });

      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found' });
        return;
      }

      const results = await prisma.examAttempt.findMany({
        where: {
          studentId: student.id,
          status: 'SUBMITTED',
          examination: {
            resultsPublished: true,
          },
        },
        include: {
          examination: {
            include: {
              subject: true,
              publications: true,
            },
          },
          gradingResult: true,
        },
        orderBy: { submittedAt: 'desc' },
      });

      res.status(200).json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  // 3. Detailed Result Scorecard
  static async getResultDetail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { attemptId } = req.params;
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user?.userId },
      });

      const attempt = await prisma.examAttempt.findFirst({
        where: {
          id: attemptId,
          studentId: student?.id,
          examination: { resultsPublished: true },
        },
        include: {
          examination: {
            include: { subject: true, publications: true },
          },
          gradingResult: true,
          answers: {
            include: {
              question: {
                include: { options: true },
              },
            },
          },
        },
      });

      if (!attempt) {
        res.status(404).json({ success: false, message: 'Exam scorecard not found or results not yet published.' });
        return;
      }

      const canViewKey = attempt.examination.publications[0]?.releaseAnswersToStudents ?? false;

      // Sanitize options if faculty chose not to release answers
      const sanitizedAnswers = attempt.answers.map((a) => ({
        id: a.id,
        questionId: a.questionId,
        questionTitle: a.question.title,
        questionContent: a.question.content,
        questionType: a.question.type,
        marksPossible: a.question.marks,
        marksAwarded: a.marksAwarded,
        evaluationComment: a.evaluationComment,
        selectedOptionIds: a.selectedOptionIds ? JSON.parse(a.selectedOptionIds) : [],
        textAnswer: a.textAnswer,
        codeAnswer: a.codeAnswer,
        options: a.question.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: canViewKey ? opt.isCorrect : undefined,
        })),
      }));

      res.status(200).json({
        success: true,
        data: {
          attempt: {
            id: attempt.id,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            tabSwitchCount: attempt.tabSwitchCount,
          },
          examination: attempt.examination,
          gradingResult: attempt.gradingResult,
          answers: sanitizedAnswers,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
