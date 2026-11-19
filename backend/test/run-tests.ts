import prisma from '../src/prisma';
import { AuthService } from '../src/services/auth.service';
import { GradingService } from '../src/services/grading.service';
import { CodingService } from '../src/services/coding.service';
import { ReportService } from '../src/services/report.service';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✔ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✖ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting CampusExam AI Automated Verification Suite');
  console.log('====================================================\n');

  try {
    // Test 1: User & Auth Tests
    console.log('[Test Suite 1: Authentication & RBAC]');
    const adminLogin = await AuthService.login('admin@campusexam.edu', 'Admin@123');
    assert(adminLogin.user.role === 'ADMIN', 'Admin login successful and role verified');
    assert(typeof adminLogin.token === 'string' && adminLogin.token.length > 20, 'JWT token correctly generated');

    const facultyLogin = await AuthService.login('prof.sharma@campusexam.edu', 'Faculty@123');
    assert(facultyLogin.user.role === 'FACULTY', 'Faculty login successful and role verified');

    const studentLogin = await AuthService.login('student1@campusexam.edu', 'Student@123');
    assert(studentLogin.user.role === 'STUDENT', 'Student login successful and role verified');

    let badLoginFailed = false;
    try {
      await AuthService.login('student1@campusexam.edu', 'WrongPassword!');
    } catch (e: any) {
      badLoginFailed = e.statusCode === 401;
    }
    assert(badLoginFailed, 'Invalid password correctly rejected with 401 Unauthorized');

    // Test 2: Database Relational Integrity
    console.log('\n[Test Suite 2: Database Schema & Relational Integrity]');
    const deptCount = await prisma.department.count();
    assert(deptCount >= 3, `Departments seeded properly (Found: ${deptCount})`);

    const activeExam = await prisma.examination.findFirst({
      where: { status: 'ACTIVE' },
      include: { questions: { include: { questionBank: { include: { options: true, testCases: true } } } } },
    });
    assert(!!activeExam, 'Active examination found in database');
    const allAreMCQ = activeExam!.questions.every((q) => q.questionBank.type.startsWith('MCQ'));
    assert(allAreMCQ, `All examination questions are strictly MCQs (Total MCQs: ${activeExam!.questions.length})`);

    // Test 3: Autograding & Negative Marking Logic
    console.log('\n[Test Suite 3: Autograding Engine & Negative Marking]');
    const completedExam = await prisma.examination.findFirst({
      where: { status: 'COMPLETED' },
      include: { attempts: { include: { gradingResult: true } } },
    });
    assert(!!completedExam, 'Completed examination found with historical results');
    assert(completedExam!.attempts.length >= 2, 'Candidate attempts populated for completed exam');
    const firstGrading = completedExam!.attempts[0].gradingResult;
    assert(!!firstGrading && firstGrading.percentage > 0, `Student percentage evaluated correctly (${firstGrading?.percentage}%)`);

    // Test 4: Coding Sandbox Execution
    console.log('\n[Test Suite 4: Coding Autograder Sandbox]');
    const pythonCode = `
n = int(input())
nums = list(map(int, input().split()))
target = int(input())
mp = {}
for i, num in enumerate(nums):
    comp = target - num
    if comp in mp:
        print(f"{mp[comp]} {i}")
        break
    mp[num] = i
`;
    const testCases = [
      { id: 'tc1', input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isSample: true, isHidden: false },
      { id: 'tc2', input: '3\n3 2 4\n6', expectedOutput: '1 2', isSample: true, isHidden: false },
      { id: 'tc3_hidden', input: '5\n10 20 35 70 80\n105', expectedOutput: '2 3', isSample: false, isHidden: true },
    ];

    const execResult = await CodingService.executeCode(pythonCode, 'python', testCases, 2, true);
    assert(execResult.status === 'ACCEPTED', `Python sandbox execution status: ${execResult.status}`);
    assert(execResult.testsPassed === 3, `All 3 test cases passed (${execResult.testsPassed}/${execResult.totalTests})`);

    // Test 5: Hidden Test Case Masking
    console.log('\n[Test Suite 5: Security & Hidden Test Case Masking]');
    const hiddenResult = execResult.results.find((r) => r.testCaseId === 'tc3_hidden');
    assert(hiddenResult?.input === '[HIDDEN]', 'Hidden test case input strictly masked from student output');
    assert(hiddenResult?.expectedOutput === '[HIDDEN]', 'Hidden test case expectedOutput strictly masked from student output');

    // Test 6: Report Generation (PDF & Excel)
    console.log('\n[Test Suite 6: PDF & Excel Academic Report Engines]');
    const excelBuffer = await ReportService.generateExamExcel(completedExam!.id);
    assert(excelBuffer.length > 1000, `Excel report generated successfully (Size: ${excelBuffer.length} bytes)`);

    const pdfBuffer = await ReportService.generateStudentResultPdf(completedExam!.attempts[0].id);
    assert(pdfBuffer.length > 1000, `Student PDF transcript generated successfully (Size: ${pdfBuffer.length} bytes)`);

    console.log('\n====================================================');
    console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
