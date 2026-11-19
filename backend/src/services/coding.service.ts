import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { CodeExecutionResponse, TestCaseResult } from '../types';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  isHidden: boolean;
  marksWeight?: number;
}

export class CodingService {
  private static tempDir = path.join(os.tmpdir(), 'campusexam_sandbox');

  static init() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  static async executeCode(
    sourceCode: string,
    language: string,
    testCases: TestCase[],
    timeLimitSec: number = 2,
    maskHiddenTestCases: boolean = true
  ): Promise<CodeExecutionResponse> {
    this.init();

    const lang = language.toLowerCase();
    if (lang !== 'python' && lang !== 'py' && lang !== 'cpp' && lang !== 'java') {
      return {
        status: 'COMPILATION_ERROR',
        testsPassed: 0,
        totalTests: testCases.length,
        executionTimeMs: 0,
        memoryUsageKb: 0,
        results: [],
        errorOutput: `Unsupported programming language: ${language}`,
      };
    }

    const sessionId = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const results: TestCaseResult[] = [];
    let passedCount = 0;
    let maxTimeMs = 0;
    let overallStatus: CodeExecutionResponse['status'] = 'ACCEPTED';
    let globalError: string | undefined = undefined;

    // Check if Python execution is available
    if (lang === 'python' || lang === 'py') {
      const scriptFile = path.join(this.tempDir, `${sessionId}.py`);
      try {
        fs.writeFileSync(scriptFile, sourceCode, 'utf8');

        for (const tc of testCases) {
          const runRes = await this.runProcess('python', [scriptFile], tc.input, timeLimitSec * 1000);
          maxTimeMs = Math.max(maxTimeMs, runRes.executionTimeMs);

          if (runRes.timedOut) {
            overallStatus = 'TIME_LIMIT_EXCEEDED';
            results.push({
              testCaseId: tc.id,
              isSample: tc.isSample,
              passed: false,
              input: maskHiddenTestCases && tc.isHidden ? '[HIDDEN]' : tc.input,
              expectedOutput: maskHiddenTestCases && tc.isHidden ? '[HIDDEN]' : tc.expectedOutput,
              actualOutput: 'Time Limit Exceeded (Terminated)',
              executionTimeMs: runRes.executionTimeMs,
              error: 'Execution exceeded time limit.',
            });
            break;
          }

          if (runRes.exitCode !== 0) {
            overallStatus = runRes.stderr.includes('SyntaxError') ? 'COMPILATION_ERROR' : 'RUNTIME_ERROR';
            globalError = runRes.stderr;
            results.push({
              testCaseId: tc.id,
              isSample: tc.isSample,
              passed: false,
              input: maskHiddenTestCases && tc.isHidden ? '[HIDDEN]' : tc.input,
              expectedOutput: maskHiddenTestCases && tc.isHidden ? '[HIDDEN]' : tc.expectedOutput,
              actualOutput: runRes.stdout,
              executionTimeMs: runRes.executionTimeMs,
              error: runRes.stderr.trim(),
            });
            break;
          }

          const cleanActual = runRes.stdout.trim().replace(/\r\n/g, '\n');
          const cleanExpected = tc.expectedOutput.trim().replace(/\r\n/g, '\n');
          const isMatch = cleanActual === cleanExpected;

          if (isMatch) {
            passedCount++;
          } else if (overallStatus === 'ACCEPTED') {
            overallStatus = 'WRONG_ANSWER';
          }

          results.push({
            testCaseId: tc.id,
            isSample: tc.isSample,
            passed: isMatch,
            input: maskHiddenTestCases && tc.isHidden ? '[HIDDEN]' : tc.input,
            expectedOutput: maskHiddenTestCases && tc.isHidden ? '[HIDDEN]' : cleanExpected,
            actualOutput: maskHiddenTestCases && tc.isHidden ? (isMatch ? '[MATCHED]' : '[OUTPUT MISMATCH]') : cleanActual,
            executionTimeMs: runRes.executionTimeMs,
          });
        }
      } catch (err: any) {
        overallStatus = 'RUNTIME_ERROR';
        globalError = err.message || 'Execution error';
      } finally {
        try {
          if (fs.existsSync(scriptFile)) fs.unlinkSync(scriptFile);
        } catch (_) {}
      }
    } else {
      // C++ or Java fallback check
      return {
        status: 'SANDBOX_NOT_CONFIGURED',
        testsPassed: 0,
        totalTests: testCases.length,
        executionTimeMs: 0,
        memoryUsageKb: 0,
        results: [],
        errorOutput: `${language.toUpperCase()} compiler/sandbox container is not available in the current environment. Python 3 runtime is configured and active.`,
      };
    }

    return {
      status: overallStatus,
      testsPassed: passedCount,
      totalTests: testCases.length,
      executionTimeMs: maxTimeMs,
      memoryUsageKb: 14200, // Process footprint estimation
      results,
      errorOutput: globalError,
    };
  }

  private static runProcess(
    command: string,
    args: string[],
    inputData: string,
    timeoutMs: number
  ): Promise<{ stdout: string; stderr: string; exitCode: number; executionTimeMs: number; timedOut: boolean }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const child = spawn(command, args, {
        windowsHide: true,
      });

      const timer = setTimeout(() => {
        timedOut = true;
        try {
          child.kill('SIGKILL');
        } catch (_) {}
      }, timeoutMs);

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      if (inputData) {
        child.stdin.write(inputData);
        child.stdin.end();
      } else {
        child.stdin.end();
      }

      child.on('close', (code) => {
        clearTimeout(timer);
        const executionTimeMs = Date.now() - startTime;
        resolve({
          stdout,
          stderr,
          exitCode: code ?? (timedOut ? 124 : 1),
          executionTimeMs,
          timedOut,
        });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          stdout: '',
          stderr: err.message,
          exitCode: 1,
          executionTimeMs: Date.now() - startTime,
          timedOut: false,
        });
      });
    });
  }
}
