import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import prisma from '../prisma';
import { AuditService } from './audit.service';

export interface ProctorStudentState {
  studentId: string;
  studentName: string;
  rollNumber: string;
  attemptId: string;
  status: string;
  lastPing: number;
  tabSwitchCount: number;
  answeredCount: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  socketId: string;
}

export class SocketService {
  private static io: Server | null = null;
  // Map of examId -> Map of studentId -> ProctorStudentState
  private static activeExams = new Map<string, Map<string, ProctorStudentState>>();

  public static initialize(server: HttpServer, clientOrigin: string): Server {
    this.io = new Server(server, {
      cors: {
        origin: true,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket: Socket) => {
      // 1. Proctor joins exam monitor room
      socket.on('proctor:join', ({ examId }) => {
        if (!examId) return;
        socket.join(`exam:${examId}:proctor`);
        
        // Send initial student state
        const studentsMap = this.activeExams.get(examId);
        const stateList = studentsMap ? Array.from(studentsMap.values()) : [];
        socket.emit('proctor:init_state', { examId, students: stateList });
      });

      // 2. Student connects to exam session
      socket.on('student:join_exam', async ({ examId, attemptId, studentId, studentName, rollNumber, totalQuestions }) => {
        if (!examId || !studentId) return;
        socket.join(`exam:${examId}`);

        if (!this.activeExams.has(examId)) {
          this.activeExams.set(examId, new Map());
        }

        const studentsMap = this.activeExams.get(examId)!;
        const existing = studentsMap.get(studentId);

        const studentState: ProctorStudentState = {
          studentId,
          studentName: studentName || 'Student',
          rollNumber: rollNumber || 'N/A',
          attemptId,
          status: 'ONLINE',
          lastPing: Date.now(),
          tabSwitchCount: existing ? existing.tabSwitchCount : 0,
          answeredCount: existing ? existing.answeredCount : 0,
          totalQuestions: totalQuestions || 0,
          currentQuestionIndex: existing ? existing.currentQuestionIndex : 0,
          socketId: socket.id,
        };

        studentsMap.set(studentId, studentState);

        // Notify proctors
        this.io?.to(`exam:${examId}:proctor`).emit('proctor:student_joined', studentState);
      });

      // 3. Student periodic heartbeat
      socket.on('student:heartbeat', ({ examId, studentId, answeredCount, currentQuestionIndex }) => {
        if (!examId || !studentId) return;
        const studentsMap = this.activeExams.get(examId);
        if (studentsMap && studentsMap.has(studentId)) {
          const state = studentsMap.get(studentId)!;
          state.lastPing = Date.now();
          state.status = 'ONLINE';
          if (answeredCount !== undefined) state.answeredCount = answeredCount;
          if (currentQuestionIndex !== undefined) state.currentQuestionIndex = currentQuestionIndex;

          this.io?.to(`exam:${examId}:proctor`).emit('proctor:student_updated', state);
        }
      });

      // 4. Student suspicious tab-switch or window blur
      socket.on('student:tab_switch', async ({ examId, attemptId, studentId, timestamp }) => {
        if (!examId || !studentId) return;
        
        const studentsMap = this.activeExams.get(examId);
        let currentCount = 1;
        if (studentsMap && studentsMap.has(studentId)) {
          const state = studentsMap.get(studentId)!;
          state.tabSwitchCount += 1;
          currentCount = state.tabSwitchCount;

          this.io?.to(`exam:${examId}:proctor`).emit('proctor:student_alert', {
            type: 'TAB_SWITCH',
            studentId,
            studentName: state.studentName,
            rollNumber: state.rollNumber,
            tabSwitchCount: currentCount,
            timestamp: timestamp || new Date().toISOString(),
          });
        }

        // Persist tab switch increment in DB if attemptId provided
        if (attemptId) {
          try {
            await prisma.examAttempt.update({
              where: { id: attemptId },
              data: { tabSwitchCount: { increment: 1 } },
            });

            await AuditService.log({
              userId: studentId,
              action: 'EXAM_TAB_SWITCH_ALERT',
              resource: 'ExamAttempt',
              resourceId: attemptId,
              metadata: { examId, currentCount, timestamp },
            });
          } catch (e) {
            // Ignore DB error for tab switch update
          }
        }
      });

      // 5. Proctor broadcast announcement
      socket.on('proctor:broadcast', ({ examId, message, senderName }) => {
        if (!examId || !message) return;
        this.io?.to(`exam:${examId}`).emit('exam:announcement', {
          message,
          senderName: senderName || 'Exam Proctor',
          timestamp: new Date().toISOString(),
        });
      });

      // 6. Student final submission notification
      socket.on('student:submitted_exam', ({ examId, studentId }) => {
        if (!examId || !studentId) return;
        const studentsMap = this.activeExams.get(examId);
        if (studentsMap && studentsMap.has(studentId)) {
          const state = studentsMap.get(studentId)!;
          state.status = 'SUBMITTED';
          this.io?.to(`exam:${examId}:proctor`).emit('proctor:student_submitted', state);
        }
      });

      // 7. Disconnect handler
      socket.on('disconnect', () => {
        for (const [examId, studentsMap] of this.activeExams.entries()) {
          for (const [studentId, state] of studentsMap.entries()) {
            if (state.socketId === socket.id) {
              state.status = 'DISCONNECTED';
              this.io?.to(`exam:${examId}:proctor`).emit('proctor:student_disconnected', {
                studentId,
                studentName: state.studentName,
                rollNumber: state.rollNumber,
                status: 'DISCONNECTED',
              });
              break;
            }
          }
        }
      });
    });

    return this.io;
  }

  public static getIO(): Server | null {
    return this.io;
  }
}
