import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../types';
import { AuditService } from '../services/audit.service';

export class AdminController {
  // 1. Dashboard Overview Stats & Performance Charts
  static async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const [
        totalStudents,
        totalFaculty,
        totalDepartments,
        totalExams,
        activeExams,
        upcomingExams,
        completedExams,
        gradingResults,
      ] = await Promise.all([
        prisma.studentProfile.count(),
        prisma.facultyProfile.count(),
        prisma.department.count(),
        prisma.examination.count(),
        prisma.examination.count({ where: { status: 'ACTIVE' } }),
        prisma.examination.count({ where: { status: 'PUBLISHED' } }),
        prisma.examination.count({ where: { status: 'COMPLETED' } }),
        prisma.gradingResult.findMany({ select: { percentage: true, isPassed: true } }),
      ]);

      const totalGraded = gradingResults.length;
      const passedCount = gradingResults.filter((g) => g.isPassed).length;
      const passPercentage = totalGraded > 0 ? Math.round((passedCount / totalGraded) * 1000) / 10 : 0;
      const avgScore = totalGraded > 0 
        ? Math.round((gradingResults.reduce((acc, g) => acc + g.percentage, 0) / totalGraded) * 10) / 10 
        : 0;

      // Department-wise student counts & performance
      const departments = await prisma.department.findMany({
        include: {
          students: {
            include: {
              attempts: {
                include: { gradingResult: true },
              },
            },
          },
        },
      });

      const departmentPerformance = departments.map((dept) => {
        const deptResults = dept.students.flatMap((s) => s.attempts.map((a) => a.gradingResult).filter(Boolean));
        const avg = deptResults.length > 0 
          ? Math.round((deptResults.reduce((acc, r) => acc + r!.percentage, 0) / deptResults.length) * 10) / 10 
          : 0;
        return {
          id: dept.id,
          code: dept.code,
          name: dept.name,
          studentCount: dept.students.length,
          avgScore: avg,
        };
      });

      // Recent 5 audits
      const recentActivity = await prisma.auditLog.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { name: true, role: true } } },
      });

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalStudents,
            totalFaculty,
            totalDepartments,
            totalExams,
            activeExams,
            upcomingExams,
            completedExams,
            passPercentage,
            avgScore,
          },
          departmentPerformance,
          recentActivity,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // 2. Department Management
  static async getDepartments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const departments = await prisma.department.findMany({
        include: {
          courses: true,
          _count: { select: { students: true, faculty: true, subjects: true } },
        },
      });
      res.status(200).json({ success: true, data: departments });
    } catch (error) {
      next(error);
    }
  }

  static async createDepartment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { code, name, description } = req.body;
      if (!code || !name) {
        res.status(400).json({ success: false, message: 'Code and Name are required.' });
        return;
      }

      const dept = await prisma.department.create({
        data: { code: code.toUpperCase().trim(), name, description },
      });

      await AuditService.log({
        userId: req.user?.userId,
        action: 'DEPARTMENT_CREATED',
        resource: 'Department',
        resourceId: dept.id,
        metadata: { code, name },
      });

      res.status(201).json({ success: true, data: dept });
    } catch (error) {
      next(error);
    }
  }

  // 3. Subject Management
  static async getSubjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const subjects = await prisma.subject.findMany({
        include: {
          department: true,
          semester: true,
          facultySubjects: { include: { faculty: { include: { user: true } } } },
          _count: { select: { enrollments: true, examinations: true, questions: true } },
        },
      });
      res.status(200).json({ success: true, data: subjects });
    } catch (error) {
      next(error);
    }
  }

  static async createSubject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { code, name, credits, departmentId, semesterId } = req.body;
      const sub = await prisma.subject.create({
        data: {
          code: code.toUpperCase().trim(),
          name,
          credits: Number(credits) || 3,
          departmentId,
          semesterId,
        },
      });
      res.status(201).json({ success: true, data: sub });
    } catch (error) {
      next(error);
    }
  }

  // 4. Student Management
  static async getStudents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const students = await prisma.studentProfile.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, isActive: true } },
          department: true,
          course: true,
          currentSemester: true,
          _count: { select: { enrollments: true, attempts: true } },
        },
      });
      res.status(200).json({ success: true, data: students });
    } catch (error) {
      next(error);
    }
  }

  static async createStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, email, password, enrollmentNumber, rollNumber, departmentId, courseId, semesterId } = req.body;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password || 'Student@123', salt);

      const user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          passwordHash,
          role: 'STUDENT',
          studentProfile: {
            create: {
              enrollmentNumber,
              rollNumber,
              departmentId,
              courseId,
              currentSemesterId: semesterId,
            },
          },
        },
        include: { studentProfile: true },
      });

      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  // 5. Faculty Management
  static async getFaculty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const faculty = await prisma.facultyProfile.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, isActive: true } },
          department: true,
          subjects: { include: { subject: true } },
          _count: { select: { examinations: true, evaluations: true, questions: true } },
        },
      });
      res.status(200).json({ success: true, data: faculty });
    } catch (error) {
      next(error);
    }
  }

  static async createFaculty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, email, password, employeeId, departmentId, designation } = req.body;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password || 'Faculty@123', salt);

      const user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          passwordHash,
          role: 'FACULTY',
          facultyProfile: {
            create: {
              employeeId,
              departmentId,
              designation: designation || 'Assistant Professor',
            },
          },
        },
        include: { facultyProfile: true },
      });

      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  // 6. Audit Logs
  static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 25;
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          skip,
          take: limit,
          orderBy: { timestamp: 'desc' },
          include: { user: { select: { name: true, email: true, role: true } } },
        }),
        prisma.auditLog.count(),
      ]);

      res.status(200).json({
        success: true,
        data: { logs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } },
      });
    } catch (error) {
      next(error);
    }
  }

  // 7. Academic Sessions & Courses for dropdowns
  static async getMetadata(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const [sessions, courses, semesters] = await Promise.all([
        prisma.academicSession.findMany({ orderBy: { startDate: 'desc' } }),
        prisma.course.findMany({ include: { department: true } }),
        prisma.semester.findMany({ include: { course: true }, orderBy: { number: 'asc' } }),
      ]);
      res.status(200).json({ success: true, data: { sessions, courses, semesters } });
    } catch (error) {
      next(error);
    }
  }
}
