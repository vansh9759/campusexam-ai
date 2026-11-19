import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Code,
  Terminal,
  Wifi,
  Sparkles,
  X
} from 'lucide-react';

const FormattedQuestionContent: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  // Split by markdown code blocks ```lang\ncode\n```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-sm text-slate-800 leading-relaxed font-sans">
      {parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const inner = part.slice(3, -3).trim();
          const firstLineEnd = inner.indexOf('\n');
          let lang = '';
          let code = inner;

          if (firstLineEnd !== -1) {
            const potentialLang = inner.slice(0, firstLineEnd).trim().toLowerCase();
            if (['python', 'py', 'cpp', 'c++', 'c', 'java', 'javascript', 'js', 'sql', 'ts', 'typescript'].includes(potentialLang)) {
              lang = potentialLang;
              code = inner.slice(firstLineEnd + 1);
            }
          }

          return (
            <div key={idx} className="my-3 rounded-xl overflow-hidden border border-slate-800 shadow-sm">
              <div className="bg-slate-950 px-4 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
                <span>{lang || 'Code Snippet'}</span>
                <span className="text-[10px] text-slate-500 font-sans">Programming Logic</span>
              </div>
              <pre className="bg-slate-900 text-emerald-300 p-4 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        if (!part.trim()) return null;

        // Regular text
        return (
          <p key={idx} className="whitespace-pre-line text-slate-700 font-medium">
            {part.trim()}
          </p>
        );
      })}
    </div>
  );
};

export const ExamRoom: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [paper, setPaper] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Synchronized server timer
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Student answer state: Map of questionId -> { selectedOptionIds, textAnswer, codeAnswer, codeLanguage, isMarkedForReview }
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING'>('SAVED');
  const autosaveTimeoutRef = useRef<any>(null);

  // Code runner state
  const [runningCode, setRunningCode] = useState(false);
  const [codeOutput, setCodeOutput] = useState<any>(null);

  // Modals & warnings
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tabSwitchWarning, setTabSwitchWarning] = useState<string | null>(null);
  const [proctorAnnouncement, setProctorAnnouncement] = useState<string | null>(null);

  // 1. Fetch Exam Paper
  useEffect(() => {
    fetchPaper();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, [attemptId]);

  const fetchPaper = async () => {
    try {
      const res = await api.get(`/exam/attempts/${attemptId}/paper`);
      if (res.data.success) {
        const data = res.data.data;
        setPaper(data);
        setRemainingSeconds(data.remainingSeconds);

        // Populate initial answers
        const initialMap: Record<string, any> = {};
        data.questions.forEach((q: any) => {
          initialMap[q.id] = {
            selectedOptionIds: q.savedAnswer?.selectedOptionIds || [],
            textAnswer: q.savedAnswer?.textAnswer || '',
            codeAnswer: q.savedAnswer?.codeAnswer || '',
            codeLanguage: q.savedAnswer?.codeLanguage || 'python',
            isMarkedForReview: q.savedAnswer?.isMarkedForReview || false,
          };
        });
        setAnswers(initialMap);

        // Join socket examination session
        if (socket && user) {
          socket.emit('student:join_exam', {
            examId: data.attemptId,
            attemptId: data.attemptId,
            studentId: user.id,
            studentName: user.name,
            rollNumber: user.studentProfile?.rollNumber || 'N/A',
            totalQuestions: data.questions.length,
          });
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load examination paper');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // 2. Server-Authoritative Timer Loop
  useEffect(() => {
    if (remainingSeconds <= 0 && paper) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleFinalSubmit(true); // Auto-submit when time expires!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [remainingSeconds, paper]);

  // 3. Tab Switch Detection & Telemetry
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && paper) {
        // Emit alert to proctors via Socket
        if (socket) {
          socket.emit('student:tab_switch', {
            examId: paper.attemptId,
            attemptId: paper.attemptId,
            studentId: user?.id,
            timestamp: new Date().toISOString(),
          });
        }
        setTabSwitchWarning('Notice: Switching tabs or minimizing the window has been recorded by the proctor.');
      }
    };

    const handleWindowBlur = () => {
      if (paper && socket) {
        socket.emit('student:tab_switch', {
          examId: paper.attemptId,
          attemptId: paper.attemptId,
          studentId: user?.id,
          timestamp: new Date().toISOString(),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    // Socket proctor announcement listener
    if (socket) {
      socket.on('exam:announcement', ({ message, senderName }: any) => {
        setProctorAnnouncement(`${senderName}: ${message}`);
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      if (socket) {
        socket.off('exam:announcement');
      }
    };
  }, [socket, paper, user]);

  // 4. Debounced Answer Autosave
  const triggerAutosave = (qId: string, currentAnswer: any) => {
    setSaveStatus('SAVING');
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);

    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.post(`/exam/attempts/${attemptId}/autosave`, {
          questionId: qId,
          selectedOptionIds: currentAnswer.selectedOptionIds,
          textAnswer: currentAnswer.textAnswer,
          codeAnswer: currentAnswer.codeAnswer,
          codeLanguage: currentAnswer.codeLanguage,
          isMarkedForReview: currentAnswer.isMarkedForReview,
        });
        setSaveStatus('SAVED');

        // Heartbeat to socket
        if (socket && paper) {
          const answeredCount = Object.values(answers).filter(isQuestionAnswered).length;
          socket.emit('student:heartbeat', {
            examId: paper.attemptId,
            studentId: user?.id,
            answeredCount,
            currentQuestionIndex: currentIndex,
          });
        }
      } catch (e) {
        setSaveStatus('SAVED');
      }
    }, 400);
  };

  const updateAnswer = (qId: string, updates: Partial<any>) => {
    setAnswers((prev) => {
      const updatedQ = { ...prev[qId], ...updates };
      triggerAutosave(qId, updatedQ);
      return { ...prev, [qId]: updatedQ };
    });
  };

  const isQuestionAnswered = (ans: any) => {
    if (!ans) return false;
    if (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) return true;
    if (ans.textAnswer && ans.textAnswer.trim().length > 0) return true;
    if (ans.codeAnswer && ans.codeAnswer.trim().length > 0) return true;
    return false;
  };

  // 5. Run Sample Tests for Coding Problem
  const handleRunSampleCode = async () => {
    const currentQ = paper?.questions[currentIndex];
    const currentAns = answers[currentQ.id];
    if (!currentQ || currentQ.type !== 'CODING') return;

    setRunningCode(true);
    setCodeOutput(null);

    try {
      const res = await api.post(`/exam/attempts/${attemptId}/run-code`, {
        questionId: currentQ.id,
        sourceCode: currentAns.codeAnswer,
        language: currentAns.codeLanguage || 'python',
      });
      if (res.data.success) {
        setCodeOutput(res.data.data);
      }
    } catch (err: any) {
      setCodeOutput({ errorOutput: err.response?.data?.message || 'Execution failed' });
    } finally {
      setRunningCode(false);
    }
  };

  // 6. Submit Final Examination
  const handleFinalSubmit = async (isAuto = false) => {
    setSubmitting(true);
    try {
      const res = await api.post(`/exam/attempts/${attemptId}/submit`);
      if (res.data.success) {
        if (socket) {
          socket.emit('student:submitted_exam', {
            examId: paper?.attemptId,
            studentId: user?.id,
          });
        }
        alert(isAuto ? 'Time has expired. Your examination was automatically submitted.' : 'Examination submitted successfully!');
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !paper) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center text-white">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentQ = paper.questions[currentIndex];
  const currentAns = answers[currentQ?.id] || {};
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isUrgent = remainingSeconds < 300; // < 5 minutes

  const totalAnswered = Object.values(answers).filter(isQuestionAnswered).length;
  const totalMarked = Object.values(answers).filter((a) => a.isMarkedForReview).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      
      {/* Top Examination Security Bar */}
      <header className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-400/30">
            {paper.subjectCode}
          </span>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">{paper.examTitle}</h1>
        </div>

        {/* Server Countdown Timer */}
        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${saveStatus === 'SAVING' ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`}></span>
            <span>{saveStatus === 'SAVING' ? 'Saving answer...' : 'All changes autosaved'}</span>
          </div>

          <div
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition-all ${
              isUrgent
                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-brand-400" />
            <span>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            Submit Exam
          </button>
        </div>
      </header>

      {/* Proctor Announcement Toast */}
      {proctorAnnouncement && (
        <div className="bg-amber-500 text-slate-950 px-6 py-2.5 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{proctorAnnouncement}</span>
          </div>
          <button onClick={() => setProctorAnnouncement(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Switch Warning Dialog */}
      {tabSwitchWarning && (
        <div className="bg-red-600 text-white px-6 py-2 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{tabSwitchWarning}</span>
          </div>
          <button onClick={() => setTabSwitchWarning(null)} className="underline text-[11px]">
            Acknowledge
          </button>
        </div>
      )}

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left: Active Question Canvas */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          
          <div className="space-y-6">
            
            {/* Question Meta Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded-xl">
                  Question {currentIndex + 1} of {paper.questions.length}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-50 text-brand-700 rounded-md">
                  {currentQ.type}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() =>
                    updateAnswer(currentQ.id, { isMarkedForReview: !currentAns.isMarkedForReview })
                  }
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                    currentAns.isMarkedForReview
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{currentAns.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>

                <div className="text-right">
                  <span className="text-xs font-bold text-brand-600">+{currentQ.marks} Marks</span>
                  {currentQ.negativeMarks > 0 && (
                    <span className="block text-[10px] text-red-500 font-semibold">-{currentQ.negativeMarks} penalty</span>
                  )}
                </div>
              </div>
            </div>

            {/* Question Title & Content */}
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{currentQ.title}</h2>
              <div className="bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <FormattedQuestionContent content={currentQ.content} />
              </div>
            </div>

            {/* Dynamic Question Input Controls */}
            
            {/* 1. MCQ Single */}
            {currentQ.type === 'MCQ_SINGLE' && (
              <div className="space-y-2.5 pt-2">
                {currentQ.options?.map((opt: any, optIdx: number) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isSelected = currentAns.selectedOptionIds?.[0] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateAnswer(currentQ.id, { selectedOptionIds: [opt.id] })}
                      className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-brand-50/70 border-brand-500 text-brand-900 font-bold shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50/80 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold font-mono flex items-center justify-center border ${
                          isSelected ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {letter}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-brand-600 bg-brand-600' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. MCQ Multiple */}
            {currentQ.type === 'MCQ_MULTIPLE' && (
              <div className="space-y-2.5 pt-2">
                <span className="text-xs font-bold text-purple-700 block bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
                  Multiple Choice (Multiple Correct Options Allowed - Select all that apply):
                </span>
                {currentQ.options?.map((opt: any, optIdx: number) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const selectedList = currentAns.selectedOptionIds || [];
                  const isSelected = selectedList.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        const nextList = isSelected
                          ? selectedList.filter((id: string) => id !== opt.id)
                          : [...selectedList, opt.id];
                        updateAnswer(currentQ.id, { selectedOptionIds: nextList });
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-50/70 border-purple-500 text-purple-900 font-bold shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50/80 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold font-mono flex items-center justify-center border ${
                          isSelected ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {letter}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md border-2 flex items-center justify-center ${
                          isSelected ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. True / False */}
            {currentQ.type === 'TRUE_FALSE' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                {currentQ.options?.map((opt: any) => {
                  const isSelected = currentAns.selectedOptionIds?.[0] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateAnswer(currentQ.id, { selectedOptionIds: [opt.id] })}
                      className={`p-5 rounded-2xl border-2 text-center text-base font-extrabold transition-all ${
                        isSelected
                          ? 'bg-brand-50 border-brand-600 text-brand-900 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 4. Short Answer */}
            {currentQ.type === 'SHORT_ANSWER' && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-600 uppercase">Your Concise Answer:</label>
                <input
                  type="text"
                  placeholder="Type your exact keyword or short response..."
                  value={currentAns.textAnswer || ''}
                  onChange={(e) => updateAnswer(currentQ.id, { textAnswer: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                />
              </div>
            )}

            {/* 5. Descriptive Answer */}
            {currentQ.type === 'DESCRIPTIVE' && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-600 uppercase">Detailed Response:</label>
                  <span className="text-xs text-slate-400 font-mono">
                    {(currentAns.textAnswer || '').trim().split(/\s+/).filter(Boolean).length} Words
                  </span>
                </div>
                <textarea
                  rows={8}
                  placeholder="Provide your in-depth analysis, comparisons, and technical explanations..."
                  value={currentAns.textAnswer || ''}
                  onChange={(e) => updateAnswer(currentQ.id, { textAnswer: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-sm font-sans focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                />
              </div>
            )}

            {/* 6. Coding Problem Runner */}
            {currentQ.type === 'CODING' && (
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-600 uppercase">Language:</span>
                    <select
                      value={currentAns.codeLanguage || 'python'}
                      onChange={(e) => updateAnswer(currentQ.id, { codeLanguage: e.target.value })}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      <option value="python">Python 3.12 (Active Sandbox)</option>
                      <option value="cpp">C++17 (GCC)</option>
                      <option value="java">Java 17 (OpenJDK)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleRunSampleCode}
                    disabled={runningCode}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{runningCode ? 'Executing Sandbox...' : 'Run Sample Tests'}</span>
                  </button>
                </div>

                {/* Code Editor Area */}
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-md">
                  <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
                    <span>solution.{currentAns.codeLanguage === 'cpp' ? 'cpp' : currentAns.codeLanguage === 'java' ? 'java' : 'py'}</span>
                    <span className="text-[10px] text-emerald-400 font-sans">Sandbox Protected</span>
                  </div>
                  <textarea
                    rows={12}
                    spellCheck={false}
                    value={currentAns.codeAnswer || ''}
                    onChange={(e) => updateAnswer(currentQ.id, { codeAnswer: e.target.value })}
                    className="w-full p-4 bg-slate-900 text-emerald-400 font-mono text-xs focus:outline-hidden leading-relaxed resize-none"
                  />
                </div>

                {/* Sample Test Cases & Execution Output */}
                {codeOutput && (
                  <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="font-bold">Sandbox Output:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        codeOutput.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {codeOutput.status}
                      </span>
                    </div>

                    {codeOutput.errorOutput && (
                      <div className="text-red-400 whitespace-pre-wrap">{codeOutput.errorOutput}</div>
                    )}

                    {codeOutput.results?.map((res: any, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-950 rounded border border-slate-800 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span>Sample Test #{idx + 1}</span>
                          <span className={res.passed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                            {res.passed ? 'PASSED' : 'WRONG ANSWER'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Input: <span className="text-white">{res.input}</span> | Expected: <span className="text-white">{res.expectedOutput}</span> | Actual: <span className="text-white">{res.actualOutput}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-6">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Question</span>
            </button>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(paper.questions.length - 1, prev + 1))}
              disabled={currentIndex === paper.questions.length - 1}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-colors shadow-xs"
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Right Sidebar: Question Palette & Overview */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Question Navigation Palette</h3>

            {/* Question Numbers Grid */}
            <div className="grid grid-cols-5 gap-2">
              {paper.questions.map((q: any, idx: number) => {
                const ans = answers[q.id];
                const answered = isQuestionAnswered(ans);
                const marked = ans?.isMarkedForReview;
                const isCurrent = idx === currentIndex;

                let btnClass = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                if (answered) {
                  btnClass = 'bg-emerald-600 text-white border-emerald-700';
                }
                if (marked) {
                  btnClass = 'bg-amber-500 text-white border-amber-600';
                }
                if (isCurrent) {
                  btnClass = `${btnClass} ring-3 ring-brand-400 ring-offset-1 font-black`;
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                  <span>Answered</span>
                </div>
                <span className="font-bold">{totalAnswered}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span>Marked for Review</span>
                </div>
                <span className="font-bold">{totalMarked}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  <span>Unanswered</span>
                </div>
                <span className="font-bold">{paper.questions.length - totalAnswered}</span>
              </div>
            </div>
          </div>

          {/* Final Submit CTA Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 shadow-md">
            <h4 className="text-sm font-bold">Ready to Complete?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Once submitted, your answers will be locked and automatically evaluated.
            </p>
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              Confirm & Submit Examination
            </button>
          </div>

        </div>

      </div>

      {/* Final Submission Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto">
                <Send className="w-6 h-6 ml-0.5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Confirm Final Submission</h2>
              <p className="text-xs text-slate-500">
                Please verify your examination status before submitting.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Questions:</span>
                <span className="font-bold text-slate-900">{paper.questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700 font-semibold">Answered:</span>
                <span className="font-bold text-emerald-700">{totalAnswered}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700 font-semibold">Marked for Review:</span>
                <span className="font-bold text-amber-700">{totalMarked}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unanswered Remaining:</span>
                <span className="font-bold text-red-600">{paper.questions.length - totalAnswered}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Return to Exam
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinalSubmit(false)}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-500 disabled:opacity-50"
              >
                {submitting ? 'Evaluating & Submitting...' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
