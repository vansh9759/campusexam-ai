import { Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../types';
import { GradingService } from '../services/grading.service';
import { CodingService } from '../services/coding.service';
import { AuditService } from '../services/audit.service';
import { SocketService } from '../services/socket.service';

export class ExamController {
  // 1. Start or Resume Exam Attempt
  static async startAttempt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { examId } = req.params;
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user?.userId },
      });

      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      const exam = await prisma.examination.findUnique({
        where: { id: examId },
        include: {
          questions: {
            include: { questionBank: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      if (!exam) {
        res.status(404).json({ success: false, message: 'Examination not found.' });
        return;
      }

      const now = new Date();
      if (exam.status !== 'ACTIVE' || now < exam.startTime || now > exam.endTime) {
        res.status(403).json({ success: false, message: 'This examination is currently not active or has ended.' });
        return;
      }

      // Check existing attempt
      const existingAttempt = await prisma.examAttempt.findFirst({
        where: { examinationId: examId, studentId: student.id },
        orderBy: { attemptNumber: 'desc' },
      });

      if (existingAttempt) {
        if (existingAttempt.status === 'SUBMITTED' || existingAttempt.status === 'AUTO_SUBMITTED') {
          res.status(400).json({ success: false, message: 'You have already submitted this examination.' });
          return;
        }

        // Resume active attempt
        const remainingSeconds = Math.max(0, Math.floor((new Date(existingAttempt.expiresAt).getTime() - Date.now()) / 1000));
        
        // Auto-submit if expired
        if (remainingSeconds <= 0) {
          await prisma.examAttempt.update({
            where: { id: existingAttempt.id },
            data: { status: 'AUTO_SUBMITTED', submittedAt: new Date() },
          });
          await GradingService.evaluateAttempt(existingAttempt.id);
          res.status(400).json({ success: false, message: 'Examination time has expired. Your exam was automatically submitted.' });
          return;
        }

        res.status(200).json({
          success: true,
          message: 'Resuming ongoing attempt.',
          data: {
            attemptId: existingAttempt.id,
            startedAt: existingAttempt.startedAt,
            expiresAt: existingAttempt.expiresAt,
            serverTime: new Date().toISOString(),
            remainingSeconds,
          },
        });
        return;
      }

      // Compute server-authoritative expiration
      const durationMs = exam.durationMinutes * 60 * 1000;
      const computedExpiry = new Date(now.getTime() + durationMs);
      const expiresAt = computedExpiry > exam.endTime ? exam.endTime : computedExpiry;
      const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

      const attempt = await prisma.examAttempt.create({
        data: {
          examinationId: examId,
          studentId: student.id,
          attemptNumber: 1,
          startedAt: now,
          expiresAt,
          status: 'IN_PROGRESS',
          ipAddress,
        },
      });

      // Pre-seed blank answers for each question
      for (const eq of exam.questions) {
        let codeAnswer: string | null = null;
        let codeLanguage: string | null = null;

        if (eq.questionBank.type === 'CODING' && eq.questionBank.codingDetails) {
          try {
            const details = JSON.parse(eq.questionBank.codingDetails);
            codeAnswer = details.languageTemplates?.python || '';
            codeLanguage = 'python';
          } catch (_) {}
        }

        await prisma.studentAnswer.create({
          data: {
            attemptId: attempt.id,
            questionId: eq.questionBankId,
            codeAnswer,
            codeLanguage,
          },
        });
      }

      await AuditService.log({
        userId: req.user?.userId,
        action: 'EXAM_STARTED',
        resource: 'ExamAttempt',
        resourceId: attempt.id,
        ipAddress,
        metadata: { examId, expiresAt },
      });

      res.status(201).json({
        success: true,
        message: 'Exam attempt started successfully.',
        data: {
          attemptId: attempt.id,
          startedAt: attempt.startedAt,
          expiresAt: attempt.expiresAt,
          serverTime: new Date().toISOString(),
          remainingSeconds,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // 2. Fetch Sanitized Exam Paper
  static async getExamPaper(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { attemptId } = req.params;
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user?.userId },
      });

      const attempt = await prisma.examAttempt.findFirst({
        where: { id: attemptId, studentId: student?.id },
        include: {
          examination: {
            include: {
              subject: true,
              questions: {
                include: {
                  questionBank: {
                    include: {
                      options: {
                        select: { id: true, text: true, orderIndex: true }, // isCorrect strictly omitted!
                        orderBy: { orderIndex: 'asc' },
                      },
                      testCases: {
                        where: { isSample: true }, // hidden test cases strictly omitted!
                        select: { id: true, input: true, expectedOutput: true, isSample: true },
                      },
                    },
                  },
                },
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
          answers: true,
        },
      });

      if (!attempt) {
        res.status(404).json({ success: false, message: 'Exam attempt not found' });
        return;
      }

      if (attempt.status !== 'IN_PROGRESS') {
        res.status(403).json({ success: false, message: 'This attempt is no longer active.' });
        return;
      }

      // Check server time expiry with 30s grace period
      const remainingSeconds = Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000));
      if (remainingSeconds <= 0) {
        await prisma.examAttempt.update({
          where: { id: attempt.id },
          data: { status: 'AUTO_SUBMITTED', submittedAt: new Date() },
        });
        await GradingService.evaluateAttempt(attempt.id);
        res.status(400).json({ success: false, message: 'Time expired. Exam has been auto-submitted.' });
        return;
      }

      const answersMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

      // Format questions for student
      const questions = attempt.examination.questions.map((eq, idx) => {
        const q = eq.questionBank;
        const currentAnswer = answersMap.get(q.id);

        let parsedCodingDetails = null;
        if (q.codingDetails) {
          try {
            parsedCodingDetails = JSON.parse(q.codingDetails);
          } catch (_) {}
        }

        return {
          id: q.id,
          index: idx + 1,
          type: q.type,
          title: q.title,
          content: q.content,
          marks: eq.marksOverride ?? q.marks,
          negativeMarks: attempt.examination.negativeMarking ? (attempt.examination.negativeMarkValue || q.negativeMarks) : 0,
          difficulty: q.difficulty,
          options: q.options,
          sampleTestCases: q.testCases,
          codingDetails: parsedCodingDetails,
          savedAnswer: {
            selectedOptionIds: currentAnswer?.selectedOptionIds ? JSON.parse(currentAnswer.selectedOptionIds) : [],
            textAnswer: currentAnswer?.textAnswer || '',
            codeAnswer: currentAnswer?.codeAnswer || parsedCodingDetails?.languageTemplates?.python || '',
            codeLanguage: currentAnswer?.codeLanguage || 'python',
            isMarkedForReview: currentAnswer?.isMarkedForReview || false,
            savedAt: currentAnswer?.savedAt,
          },
        };
      });

      res.status(200).json({
        success: true,
        data: {
          attemptId: attempt.id,
          examTitle: attempt.examination.title,
          subjectCode: attempt.examination.subject.code,
          subjectName: attempt.examination.subject.name,
          durationMinutes: attempt.examination.durationMinutes,
          totalMarks: attempt.examination.totalMarks,
          negativeMarking: attempt.examination.negativeMarking,
          startedAt: attempt.startedAt,
          expiresAt: attempt.expiresAt,
          serverTime: new Date().toISOString(),
          remainingSeconds,
          questions,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // 3. Autosave Student Answer
  static async autosaveAnswer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { attemptId } = req.params;
      const { questionId, selectedOptionIds, textAnswer, codeAnswer, codeLanguage, isMarkedForReview } = req.body;

      const attempt = await prisma.examAttempt.findUnique({
        where: { id: attemptId },
      });

      if (!attempt || attempt.status !== 'IN_PROGRESS') {
        res.status(400).json({ success: false, message: 'Attempt is not active' });
        return;
      }

      // Reject if timer expired with 30s grace
      if (Date.now() > new Date(attempt.expiresAt).getTime() + 30000) {
        res.status(403).json({ success: false, message: 'Exam time expired. Cannot save answer.' });
        return;
      }

      const updated = await prisma.studentAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId,
          },
        },
        update: {
          selectedOptionIds: selectedOptionIds ? JSON.stringify(selectedOptionIds) : null,
          textAnswer,
          codeAnswer,
          codeLanguage,
          isMarkedForReview: Boolean(isMarkedForReview),
          savedAt: new Date(),
        },
        create: {
          attemptId,
          questionId,
          selectedOptionIds: selectedOptionIds ? JSON.stringify(selectedOptionIds) : null,
          textAnswer,
          codeAnswer,
          codeLanguage,
          isMarkedForReview: Boolean(isMarkedForReview),
          savedAt: new Date(),
        },
      });

      res.status(200).json({
        success: true,
        message: 'Answer saved',
        savedAt: updated.savedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  // 4. Run Sample Code in Sandbox
  static async runSampleCode(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { attemptId } = req.params;
      const { questionId, sourceCode, language } = req.body;

      const question = await prisma.questionBank.findUnique({
        where: { id: questionId },
        include: {
          testCases: { where: { isSample: true } },
        },
      });

      if (!question || question.type !== 'CODING') {
        res.status(400).json({ success: false, message: 'Invalid coding question' });
        return;
      }

      const execution = await CodingService.executeCode(
        sourceCode,
        language,
        question.testCases,
        2,
        false // Sample tests can show expected/actual
      );

      res.status(200).json({
        success: true,
        data: execution,
      });
    } catch (error) {
      next(error);
    }
  }

  // 5. Final Exam Submission
  static async submitExam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { attemptId } = req.params;
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user?.userId },
      });

      const attempt = await prisma.examAttempt.findFirst({
        where: { id: attemptId, studentId: student?.id },
        include: { examination: true },
      });

      if (!attempt) {
        res.status(404).json({ success: false, message: 'Exam attempt not found' });
        return;
      }

      if (attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED') {
        res.status(400).json({ success: false, message: 'Exam has already been submitted.' });
        return;
      }

      // Check if student has coding questions: execute against ALL (sample + hidden) test cases
      const codingAnswers = await prisma.studentAnswer.findMany({
        where: {
          attemptId,
          codeAnswer: { not: null },
        },
        include: {
          question: {
            include: { testCases: true },
          },
        },
      });

      for (const ca of codingAnswers) {
        if (ca.question.type === 'CODING' && ca.codeAnswer && ca.question.testCases.length > 0) {
          const runRes = await CodingService.executeCode(
            ca.codeAnswer,
            ca.codeLanguage || 'python',
            ca.question.testCases,
            2,
            true // Mask hidden test cases
          );

          await prisma.codingSubmission.create({
            data: {
              attemptId,
              questionId: ca.questionId,
              sourceCode: ca.codeAnswer,
              language: ca.codeLanguage || 'python',
              status: runRes.status,
              testsPassed: runRes.testsPassed,
              totalTests: runRes.totalTests,
              executionTimeMs: runRes.executionTimeMs,
              memoryUsageKb: runRes.memoryUsageKb,
              feedback: JSON.stringify(runRes.results),
            },
          });
        }
      }

      // Mark attempt as submitted
      const submittedAttempt = await prisma.examAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });

      // Run automatic grading engine
      const gradingResult = await GradingService.evaluateAttempt(attemptId);

      // Audit submission
      await AuditService.log({
        userId: req.user?.userId,
        action: 'EXAM_SUBMITTED',
        resource: 'ExamAttempt',
        resourceId: attemptId,
        metadata: {
          examId: attempt.examinationId,
          tabSwitchCount: attempt.tabSwitchCount,
          totalObtained: gradingResult.totalObtained,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Examination submitted successfully.',
        data: {
          attemptId: submittedAttempt.id,
          submittedAt: submittedAttempt.submittedAt,
          gradingSummary: gradingResult,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
