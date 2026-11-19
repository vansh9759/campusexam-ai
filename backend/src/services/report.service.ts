import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import prisma from '../prisma';

export class ReportService {
  static async generateExamExcel(examId: string): Promise<Buffer> {
    const exam = await prisma.examination.findUnique({
      where: { id: examId },
      include: {
        subject: true,
        faculty: { include: { user: true } },
        session: true,
        attempts: {
          include: {
            student: { include: { user: true, department: true } },
            gradingResult: true,
          },
        },
      },
    });

    if (!exam) {
      throw { statusCode: 404, message: 'Examination not found' };
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CampusExam AI';
    workbook.created = new Date();

    // 1. Sheet: Summary
    const summarySheet = workbook.addWorksheet('Exam Overview');
    summarySheet.columns = [
      { header: 'Property', key: 'prop', width: 25 },
      { header: 'Value', key: 'val', width: 45 },
    ];

    summarySheet.addRows([
      { prop: 'Examination Title', val: exam.title },
      { prop: 'Subject', val: `${exam.subject.code} - ${exam.subject.name}` },
      { prop: 'Academic Session', val: exam.session.name },
      { prop: 'Faculty In-Charge', val: exam.faculty.user.name },
      { prop: 'Total Marks', val: exam.totalMarks },
      { prop: 'Passing Marks', val: exam.passingMarks },
      { prop: 'Status', val: exam.status },
      { prop: 'Total Candidates Attempted', val: exam.attempts.length },
    ]);

    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0B3D6F' },
    };

    // 2. Sheet: Student Results
    const resultsSheet = workbook.addWorksheet('Candidate Marks');
    resultsSheet.columns = [
      { header: 'Roll Number', key: 'roll', width: 18 },
      { header: 'Student Name', key: 'name', width: 28 },
      { header: 'Department', key: 'dept', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Marks Obtained', key: 'obtained', width: 18 },
      { header: 'Maximum Marks', key: 'total', width: 18 },
      { header: 'Percentage (%)', key: 'percentage', width: 18 },
      { header: 'Result', key: 'result', width: 15 },
      { header: 'Tab Switches', key: 'switches', width: 15 },
      { header: 'Submitted At', key: 'submittedAt', width: 22 },
    ];

    resultsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    resultsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0C87EB' },
    };

    for (const att of exam.attempts) {
      const res = att.gradingResult;
      resultsSheet.addRow({
        roll: att.student.rollNumber,
        name: att.student.user.name,
        dept: att.student.department.name,
        status: att.status,
        obtained: res ? res.totalObtained : 'Pending',
        total: res ? res.totalPossible : exam.totalMarks,
        percentage: res ? `${res.percentage}%` : 'N/A',
        result: res ? (res.isPassed ? 'PASSED' : 'FAILED') : 'PENDING',
        switches: att.tabSwitchCount,
        submittedAt: att.submittedAt ? att.submittedAt.toISOString() : 'In Progress',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  static async generateStudentResultPdf(attemptId: string): Promise<Buffer> {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        examination: {
          include: {
            subject: true,
            session: true,
            faculty: { include: { user: true } },
          },
        },
        student: {
          include: {
            user: true,
            department: true,
            course: true,
            currentSemester: true,
          },
        },
        gradingResult: true,
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!attempt || !attempt.gradingResult) {
      throw { statusCode: 404, message: 'Result transcript not found or not yet graded.' };
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (data) => buffers.push(data));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const exam = attempt.examination;
        const stu = attempt.student;
        const res = attempt.gradingResult!;

        // Header
        doc.fillColor('#0b3d6f').fontSize(22).font('Helvetica-Bold').text('CAMPUS EXAM AI', { align: 'center' });
        doc.fillColor('#64748b').fontSize(11).font('Helvetica').text('College Examination Board & Academic Assessment Division', { align: 'center' });
        doc.moveDown(0.5);
        doc.strokeColor('#0c87eb').lineWidth(2).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(1);

        // Subtitle
        doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('OFFICIAL EXAMINATION GRADE TRANSCRIPT', { align: 'center' });
        doc.moveDown(1);

        // Student Info Box
        doc.rect(40, doc.y, 515, 80).fillAndStroke('#f8fafc', '#e2e8f0');
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold');

        const boxY = doc.y + 10;
        doc.text(`Candidate Name:   ${stu.user.name}`, 55, boxY);
        doc.text(`Roll Number:      ${stu.rollNumber}`, 55, boxY + 18);
        doc.text(`Enrollment ID:    ${stu.enrollmentNumber}`, 55, boxY + 36);

        doc.text(`Department:  ${stu.department.name}`, 300, boxY);
        doc.text(`Course:      ${stu.course.name}`, 300, boxY + 18);
        doc.text(`Semester:    Semester ${stu.currentSemester.number}`, 300, boxY + 36);

        doc.y = boxY + 65;
        doc.moveDown(1);

        // Exam Details Box
        doc.rect(40, doc.y, 515, 75).fillAndStroke('#f0f7ff', '#bae0fd');
        const examBoxY = doc.y + 10;
        doc.fillColor('#0b3d6f').fontSize(10).font('Helvetica-Bold');
        doc.text(`Exam Title:       ${exam.title}`, 55, examBoxY);
        doc.text(`Subject:          ${exam.subject.code} - ${exam.subject.name}`, 55, examBoxY + 18);
        doc.text(`Academic Session: ${exam.session.name}`, 55, examBoxY + 36);

        doc.text(`Duration:     ${exam.durationMinutes} Minutes`, 350, examBoxY);
        doc.text(`Date Taken:   ${attempt.submittedAt ? attempt.submittedAt.toISOString().split('T')[0] : 'N/A'}`, 350, examBoxY + 18);
        doc.text(`Faculty:      ${exam.faculty.user.name}`, 350, examBoxY + 36);

        doc.y = examBoxY + 60;
        doc.moveDown(1.5);

        // Performance Summary Cards
        const cardY = doc.y;
        doc.rect(40, cardY, 160, 60).fillAndStroke('#ffffff', '#cbd5e1');
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('TOTAL OBTAINED', 50, cardY + 10);
        doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text(`${res.totalObtained} / ${res.totalPossible}`, 50, cardY + 28);

        doc.rect(215, cardY, 160, 60).fillAndStroke('#ffffff', '#cbd5e1');
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('PERCENTAGE', 225, cardY + 10);
        doc.fillColor('#0c87eb').fontSize(16).font('Helvetica-Bold').text(`${res.percentage}%`, 225, cardY + 28);

        doc.rect(390, cardY, 165, 60).fillAndStroke(res.isPassed ? '#f0fdf4' : '#fef2f2', res.isPassed ? '#86efac' : '#fca5a5');
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('FINAL RESULT', 400, cardY + 10);
        doc.fillColor(res.isPassed ? '#166534' : '#991b1b').fontSize(16).font('Helvetica-Bold').text(res.isPassed ? 'PASSED' : 'FAILED', 400, cardY + 28);

        doc.y = cardY + 80;
        doc.moveDown(1);

        // Detailed Question Scores
        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Question-Wise Evaluation Breakdown', 40, doc.y);
        doc.moveDown(0.5);

        // Table Header
        const tableTop = doc.y;
        doc.rect(40, tableTop, 515, 20).fill('#0b3d6f');
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
        doc.text('#', 50, tableTop + 5);
        doc.text('Question Title', 80, tableTop + 5);
        doc.text('Type', 280, tableTop + 5);
        doc.text('Max', 380, tableTop + 5);
        doc.text('Awarded', 430, tableTop + 5);
        doc.text('Remarks', 485, tableTop + 5);

        let rowY = tableTop + 20;
        attempt.answers.forEach((ans, idx) => {
          const isEven = idx % 2 === 0;
          doc.rect(40, rowY, 515, 20).fill(isEven ? '#ffffff' : '#f8fafc');
          doc.fillColor('#334155').fontSize(8).font('Helvetica');
          doc.text(String(idx + 1), 50, rowY + 5);
          doc.text(ans.question.title.substring(0, 35), 80, rowY + 5);
          doc.text(ans.question.type, 280, rowY + 5);
          doc.text(String(ans.question.marks), 385, rowY + 5);
          doc.font('Helvetica-Bold').text(String(ans.marksAwarded ?? 0), 435, rowY + 5).font('Helvetica');
          doc.text((ans.evaluationComment || 'Evaluated').substring(0, 15), 485, rowY + 5);
          rowY += 20;
        });

        // Verification Footer
        doc.y = Math.max(rowY + 40, 720);
        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(0.8);
        doc.fillColor('#64748b').fontSize(8).font('Helvetica');
        doc.text(`Digitally certified by CampusExam AI on ${new Date().toISOString()}`, 40, doc.y);
        doc.text('This is a tamper-evident system-generated transcript. Controller of Examinations.', 40, doc.y + 12);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
