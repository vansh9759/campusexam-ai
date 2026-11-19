import { Request } from 'express';

export type UserRole = 'ADMIN' | 'FACULTY' | 'STUDENT';

export interface AuthUserPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  profileId?: string; // studentProfile.id or facultyProfile.id
  departmentId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export interface TestCaseResult {
  testCaseId: string;
  isSample: boolean;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  executionTimeMs?: number;
  error?: string;
}

export interface CodeExecutionResponse {
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR' | 'SANDBOX_NOT_CONFIGURED';
  testsPassed: number;
  totalTests: number;
  executionTimeMs: number;
  memoryUsageKb: number;
  results: TestCaseResult[];
  errorOutput?: string;
}
