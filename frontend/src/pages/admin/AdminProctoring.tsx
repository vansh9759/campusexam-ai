import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import {
  Radio,
  Users,
  AlertTriangle,
  Send,
  CheckCircle2,
  Wifi,
  WifiOff,
  Clock,
  ShieldAlert,
  Search
} from 'lucide-react';

interface CandidateState {
  studentId: string;
  studentName: string;
  rollNumber: string;
  attemptId: string;
  status: 'ONLINE' | 'DISCONNECTED' | 'SUBMITTED';
  lastPing: number;
  tabSwitchCount: number;
  answeredCount: number;
  totalQuestions: number;
  currentQuestionIndex: number;
}

export const AdminProctoring: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [candidates, setCandidates] = useState<Map<string, CandidateState>>(new Map());
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [alertLogs, setAlertLogs] = useState<any[]>([]);
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

  // Fetch active exams on load
  useEffect(() => {
    fetchActiveExams();
  }, []);

  const fetchActiveExams = async () => {
    try {
      const res = await api.get('/admin/dashboard-stats');
      const examsRes = await api.get('/faculty/exams');
      if (examsRes.data.success) {
        const activeList = examsRes.data.data.filter((e: any) => e.status === 'ACTIVE');
        setExams(activeList);
        if (activeList.length > 0 && !selectedExamId) {
          setSelectedExamId(activeList[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Socket room join & listeners
  useEffect(() => {
    if (!socket || !selectedExamId) return;

    // Join proctor room
    socket.emit('proctor:join', { examId: selectedExamId });

    const handleInitState = ({ students }: { students: CandidateState[] }) => {
      const map = new Map<string, CandidateState>();
      students.forEach((s) => map.set(s.studentId, s));
      setCandidates(map);
    };

    const handleStudentJoined = (student: CandidateState) => {
      setCandidates((prev) => new Map(prev).set(student.studentId, student));
    };

    const handleStudentUpdated = (student: CandidateState) => {
      setCandidates((prev) => new Map(prev).set(student.studentId, student));
    };

    const handleStudentAlert = (alert: any) => {
      setAlertLogs((prev) => [alert, ...prev.slice(0, 19)]);
      setCandidates((prev) => {
        const next = new Map(prev);
        const existing = next.get(alert.studentId);
        if (existing) {
          existing.tabSwitchCount = alert.tabSwitchCount;
          next.set(alert.studentId, { ...existing });
        }
        return next;
      });
    };

    const handleStudentSubmitted = (student: CandidateState) => {
      setCandidates((prev) => {
        const next = new Map(prev);
        next.set(student.studentId, { ...student, status: 'SUBMITTED' });
        return next;
      });
    };

    const handleStudentDisconnected = ({ studentId }: { studentId: string }) => {
      setCandidates((prev) => {
        const next = new Map(prev);
        const existing = next.get(studentId);
        if (existing) {
          next.set(studentId, { ...existing, status: 'DISCONNECTED' });
        }
        return next;
      });
    };

    socket.on('proctor:init_state', handleInitState);
    socket.on('proctor:student_joined', handleStudentJoined);
    socket.on('proctor:student_updated', handleStudentUpdated);
    socket.on('proctor:student_alert', handleStudentAlert);
    socket.on('proctor:student_submitted', handleStudentSubmitted);
    socket.on('proctor:student_disconnected', handleStudentDisconnected);

    return () => {
      socket.off('proctor:init_state', handleInitState);
      socket.off('proctor:student_joined', handleStudentJoined);
      socket.off('proctor:student_updated', handleStudentUpdated);
      socket.off('proctor:student_alert', handleStudentAlert);
      socket.off('proctor:student_submitted', handleStudentSubmitted);
      socket.off('proctor:student_disconnected', handleStudentDisconnected);
    };
  }, [socket, selectedExamId]);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim() || !socket || !selectedExamId) return;

    socket.emit('proctor:broadcast', {
      examId: selectedExamId,
      message: broadcastMsg,
      senderName: 'Exam Proctor (Control Center)',
    });

    setBroadcastMsg('');
    setBroadcastStatus('Announcement broadcasted to all active candidates!');
    setTimeout(() => setBroadcastStatus(null), 4000);
  };

  const candidatesList = Array.from(candidates.values());
  const onlineCount = candidatesList.filter((c) => c.status === 'ONLINE').length;
  const submittedCount = candidatesList.filter((c) => c.status === 'SUBMITTED').length;
  const totalAlerts = candidatesList.reduce((acc, c) => acc + c.tabSwitchCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Real-Time Examination Proctoring Console</h1>
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span>LIVE</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Socket-powered live examination monitoring, heartbeat telemetry, and integrity event detection</p>
        </div>

        {/* Exam Selector */}
        {exams.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Exam:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.subject?.code} - {ex.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Proctor Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Candidates Live</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">{onlineCount}</div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wifi className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Submitted Attempts</span>
            <div className="text-2xl font-extrabold text-brand-600 mt-0.5">{submittedCount}</div>
          </div>
          <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Integrity Alerts</span>
            <div className="text-2xl font-extrabold text-red-600 mt-0.5">{totalAlerts}</div>
          </div>
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Proctor Status</span>
            <div className="text-sm font-extrabold text-slate-800 mt-1">
              {isConnected ? 'Connected (Room Active)' : 'Connecting...'}
            </div>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
            <Radio className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Candidates Live Telemetry Board */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Active Candidate Sessions</h2>
            <span className="text-xs text-slate-500">{candidatesList.length} total monitored students</span>
          </div>

          {candidatesList.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Waiting for Candidates</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Once students launch the examination on their portal, their live sessions, answer progress, and proctoring telemetry will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {candidatesList.map((c) => (
                <div
                  key={c.studentId}
                  className={`bg-white p-4 rounded-2xl border transition-all ${
                    c.tabSwitchCount > 0
                      ? 'border-red-300 bg-red-50/20 shadow-xs'
                      : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{c.studentName}</div>
                      <div className="text-xs text-slate-500 font-mono">{c.rollNumber}</div>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        c.status === 'ONLINE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : c.status === 'SUBMITTED'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  {/* Answer Progress */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Questions Answered:</span>
                      <span className="font-bold text-slate-700">
                        {c.answeredCount} / {c.totalQuestions || 6}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round((c.answeredCount / (c.totalQuestions || 6)) * 100))}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Tab Switch Alert Indicator */}
                  {c.tabSwitchCount > 0 && (
                    <div className="mt-3 p-2 bg-red-100/70 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-700 font-semibold">
                      <div className="flex items-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span>Tab Switches Logged:</span>
                      </div>
                      <span className="px-2 py-0.5 bg-red-600 text-white rounded-md font-mono text-[11px]">
                        {c.tabSwitchCount}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Broadcast & Integrity Feed */}
        <div className="space-y-6">
          
          {/* Proctor Broadcast Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-bold text-slate-900">Broadcast Official Announcement</h2>
            </div>
            <p className="text-xs text-slate-500">Pushes an alert to every active candidate screen in this examination room.</p>

            {broadcastStatus && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium">
                {broadcastStatus}
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-3">
              <textarea
                rows={3}
                placeholder="e.g. Attention students: 15 minutes remaining. Please review your answers..."
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={!broadcastMsg.trim()}
                className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Candidates</span>
              </button>
            </form>
          </div>

          {/* Real-time Alerts Stream */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Integrity Events Stream</h2>
              <span className="text-[10px] uppercase font-bold text-slate-400">Real-Time</span>
            </div>

            {alertLogs.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center italic">
                No suspicious events or tab-switches detected yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {alertLogs.map((log, idx) => (
                  <div key={idx} className="p-2.5 bg-red-50/70 border border-red-200 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center text-red-800 font-bold">
                      <span>{log.studentName} ({log.rollNumber})</span>
                      <span className="text-[10px] font-mono text-red-500">Alert #{log.tabSwitchCount}</span>
                    </div>
                    <div className="text-[11px] text-red-600">
                      Window minimized or switched tabs at {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
