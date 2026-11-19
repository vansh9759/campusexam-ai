import prisma from '../prisma';
import { AuditService } from './audit.service';

export class GradingService {
  static async evaluateAttempt(attemptId: string): Promise<any> {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        examination: {
          include: {
            questions: {
              include: {
                questionBank: {
                  include: {
                    options: true,
                    testCases: true,
                  },
                },
              },
            },
          },
        },
        answers: true,
        evaluations: true,
        codingSubmissions: true,
      },
    });

    if (!attempt) {
      throw { statusCode: 404, message: 'Exam attempt not found' };
    }

    const exam = attempt.examination;
    let totalObtained = 0;
    let totalPossible = 0;
    let hasPendingManual = false;

    // Map answers by questionId
    const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));
    const manualMap = new Map(attempt.evaluations.map((m) => [m.questionId, m]));

    for (const eq of exam.questions) {
      const q = eq.questionBank;
      const qMarks = eq.marksOverride ?? q.marks;
      totalPossible += qMarks;

      const studentAns = answerMap.get(q.id);
      let awardedMarks = 0;
      let evalComment = '';

      if (!studentAns) {
        // Unanswered
        awardedMarks = 0;
        evalComment = 'Unanswered question.';
      } else {
        switch (q.type) {
          case 'MCQ_SINGLE': {
            const correctOpt = q.options.find((o) => o.isCorrect);
            let selectedIds: string[] = [];
            try {
              selectedIds = studentAns.selectedOptionIds ? JSON.parse(studentAns.selectedOptionIds) : [];
            } catch (_) {}

            if (selectedIds.length === 0) {
              awardedMarks = 0;
              evalComment = 'No option selected.';
            } else if (correctOpt && selectedIds[0] === correctOpt.id) {
              awardedMarks = qMarks;
              evalComment = 'Correct answer.';
            } else {
              awardedMarks = exam.negativeMarking ? -Math.abs(exam.negativeMarkValue || q.negativeMarks || 0) : 0;
              evalComment = `Incorrect answer. Correct option: ${correctOpt?.text}`;
            }
            break;
          }

          case 'MCQ_MULTIPLE': {
            const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id).sort();
            let selectedIds: string[] = [];
            try {
              selectedIds = (studentAns.selectedOptionIds ? JSON.parse(studentAns.selectedOptionIds) : []).sort();
            } catch (_) {}

            if (selectedIds.length === 0) {
              awardedMarks = 0;
              evalComment = 'No options selected.';
            } else {
              const isFullMatch =
                correctIds.length === selectedIds.length &&
                correctIds.every((id, idx) => id === selectedIds[idx]);

              if (isFullMatch) {
                awardedMarks = qMarks;
                evalComment = 'All correct options selected.';
              } else {
                awardedMarks = exam.negativeMarking ? -Math.abs(exam.negativeMarkValue || q.negativeMarks || 0) : 0;
                evalComment = 'Incorrect option combination.';
              }
            }
            break;
          }

          case 'TRUE_FALSE': {
            const correctOpt = q.options.find((o) => o.isCorrect);
            let selectedIds: string[] = [];
            try {
              selectedIds = studentAns.selectedOptionIds ? JSON.parse(studentAns.selectedOptionIds) : [];
            } catch (_) {}

            if (selectedIds.length > 0 && correctOpt && selectedIds[0] === correctOpt.id) {
              awardedMarks = qMarks;
              evalComment = 'Correct answer.';
            } else if (selectedIds.length > 0) {
              awardedMarks = exam.negativeMarking ? -Math.abs(exam.negativeMarkValue || q.negativeMarks || 0) : 0;
              evalComment = `Incorrect. Correct answer is ${correctOpt?.text}`;
            }
            break;
          }

          case 'SHORT_ANSWER': {
            const textAns = (studentAns.textAnswer || '').trim().toLowerCase();
            let keywords: string[] = [];
            try {
              keywords = q.keywords ? JSON.parse(q.keywords) : [];
            } catch (_) {}

            if (!textAns) {
              awardedMarks = 0;
              evalComment = 'Unanswered.';
            } else {
              const matched = keywords.some((kw) => textAns.includes(kw.toLowerCase()));
              if (matched) {
                awardedMarks = qMarks;
                evalComment = 'Automated keyword matching: Accepted';
              } else {
                awardedMarks = 0;
                evalComment = 'Keywords not matched. Saved for faculty review.';
              }
            }
            break;
          }

          case 'DESCRIPTIVE': {
            const manualEval = manualMap.get(q.id);
            if (manualEval) {
              awardedMarks = manualEval.marksAwarded;
              evalComment = manualEval.feedback || 'Manually evaluated by faculty with rubric.';
            } else {
              hasPendingManual = true;
              awardedMarks = 0;
              evalComment = 'Pending faculty manual evaluation.';
            }
            break;
          }

          case 'CODING': {
            const latestSub = await prisma.codingSubmission.findFirst({
              where: { attemptId, questionId: q.id },
              orderBy: { submittedAt: 'desc' },
            });

            if (latestSub && latestSub.totalTests > 0) {
              const ratio = latestSub.testsPassed / latestSub.totalTests;
              awardedMarks = Math.round(ratio * qMarks * 100) / 100;
              evalComment = `Passed ${latestSub.testsPassed}/${latestSub.totalTests} test cases (${latestSub.status})`;
            } else {
              awardedMarks = 0;
              evalComment = 'No successful code submission.';
            }
            break;
          }
        }

        // Update studentAnswer record with evaluated marks
        await prisma.studentAnswer.update({
          where: { id: studentAns.id },
          data: {
            marksAwarded: awardedMarks,
            evaluationComment: evalComment,
          },
        });
      }

      totalObtained += awardedMarks;
    }

    // Floor total marks at 0
    totalObtained = Math.max(0, Math.round(totalObtained * 100) / 100);
    const percentage = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 10000) / 100 : 0;
    const isPassed = totalObtained >= exam.passingMarks;

    const gradingResult = await prisma.gradingResult.upsert({
      where: { attemptId },
      update: {
        totalObtained,
        totalPossible,
        percentage,
        isPassed,
        gradedAt: new Date(),
        auditNotes: hasPendingManual
          ? 'Automated evaluation completed; descriptive questions pending faculty review.'
          : 'Complete evaluation processed.',
      },
      create: {
        attemptId,
        totalObtained,
        totalPossible,
        percentage,
        isPassed,
        gradedAt: new Date(),
        auditNotes: hasPendingManual
          ? 'Automated evaluation completed; descriptive questions pending faculty review.'
          : 'Complete evaluation processed.',
      },
    });

    await AuditService.log({
      action: 'EXAM_EVALUATED',
      resource: 'ExamAttempt',
      resourceId: attemptId,
      metadata: { totalObtained, totalPossible, percentage, isPassed, hasPendingManual },
    });

    return {
      attemptId,
      totalObtained,
      totalPossible,
      percentage,
      isPassed,
      hasPendingManual,
      gradingResult,
    };
  }
}
