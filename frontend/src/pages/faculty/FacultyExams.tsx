import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  FileCheck2,
  Plus,
  Clock,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2,
  Layers,
  X,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FacultyExams: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [totalMarks, setTotalMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(40);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarkValue, setNegativeMarkValue] = useState(0.25);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeOptions, setRandomizeOptions] = useState(false);
  const [status, setStatus] = useState('PUBLISHED');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const [exRes, subRes, metaRes] = await Promise.all([
        api.get('/faculty/exams'),
        api.get('/admin/subjects'),
        api.get('/admin/metadata'),
      ]);
      if (exRes.data.success) setExams(exRes.data.data);
      if (subRes.data.success) setSubjects(subRes.data.data);
      if (metaRes.data.success) {
        setSessions(metaRes.data.data.sessions);
        if (metaRes.data.data.sessions.length > 0 && !sessionId) {
          setSessionId(metaRes.data.data.sessions[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/faculty/exams', {
        title,
        description,
        subjectId,
        sessionId,
        startTime,
        endTime,
        durationMinutes,
        totalMarks,
        passingMarks,
        negativeMarking,
        negativeMarkValue,
        randomizeQuestions,
        randomizeOptions,
        status,
      });

      if (res.data.success) {
        setShowModal(false);
        resetForm();
        fetchExams();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setDurationMinutes(60);
    setTotalMarks(100);
    setPassingMarks(40);
    setNegativeMarking(false);
    setStatus('PUBLISHED');
  };

  const handleStatusChange = async (examId: string, newStatus: string) => {
    try {
      await api.patch(`/faculty/exams/${examId}/status`, { status: newStatus });
      fetchExams();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Examinations Management</h1>
          <p className="text-sm text-slate-500 mt-1">Schedule, author, configure grading rules, and publish university exams</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Examination</span>
        </button>
      </div>

      {/* Examination Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exams.map((ex) => (
          <div key={ex.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-blue-50 text-brand-700 rounded-md">
                  {ex.subject?.code} - {ex.subject?.name}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-2">{ex.title}</h2>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  ex.status === 'ACTIVE'
                    ? 'bg-blue-100 text-blue-700'
                    : ex.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-700'
                    : ex.status === 'PUBLISHED'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {ex.status}
              </span>
            </div>

            <p className="text-xs text-slate-500 line-clamp-2">{ex.description || 'No description provided.'}</p>

            <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50 rounded-xl text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                <span className="font-bold text-slate-800">{ex.durationMinutes} Mins</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Marks</span>
                <span className="font-bold text-slate-800">{ex.totalMarks}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Candidates</span>
                <span className="font-bold text-brand-600">{ex._count?.attempts ?? 0}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <div className="text-slate-500">
                {ex.negativeMarking ? (
                  <span className="text-amber-600 font-semibold">Negative Marking: -{ex.negativeMarkValue}</span>
                ) : (
                  <span>No negative marking</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  to={`/faculty/submissions?examId=${ex.id}`}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Submissions
                </Link>
                <Link
                  to={`/faculty/analytics?examId=${ex.id}`}
                  className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg font-semibold"
                >
                  Analytics
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Author Examination</h2>
                <p className="text-xs text-slate-500">Configure scheduling, scoring models, and publication status</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Examination Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Examination: Computer Networks"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <select
                    required
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Academic Session
                  </label>
                  <select
                    required
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                  >
                    {sessions.map((ses) => (
                      <option key={ses.id} value={ses.id}>{ses.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Description & Candidate Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific rules, proctoring guidelines, or topic scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Start Window
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    End Window
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="360"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Maximum Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Passing Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                  >
                    <option value="DRAFT">Save as Draft</option>
                    <option value="PUBLISHED">Published (Upcoming)</option>
                    <option value="ACTIVE">Active (Immediate)</option>
                  </select>
                </div>
              </div>

              {/* Negative marking controls */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Negative Marking</span>
                    <p className="text-[11px] text-slate-500">Deduct marks for incorrect MCQ and True/False answers</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={negativeMarking}
                    onChange={(e) => setNegativeMarking(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                  />
                </div>

                {negativeMarking && (
                  <div className="pt-2 border-t border-slate-200 flex items-center space-x-3">
                    <span className="text-xs text-slate-600">Penalty per incorrect response:</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={negativeMarkValue}
                      onChange={(e) => setNegativeMarkValue(Number(e.target.value))}
                      className="w-24 px-2 py-1 border border-slate-300 rounded-lg text-xs"
                    />
                    <span className="text-xs text-slate-400">marks</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-500 disabled:opacity-50"
                >
                  {submitting ? 'Creating Exam...' : 'Create Examination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
