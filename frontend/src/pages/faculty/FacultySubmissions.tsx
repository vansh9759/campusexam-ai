import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import {
  CheckCircle2,
  AlertTriangle,
  Award,
  Send,
  Eye,
  X,
  FileCheck2,
  FileSpreadsheet,
  Download
} from 'lucide-react';

export const FacultySubmissions: React.FC = () => {
  const [searchParams] = useSearchParams();
  const examIdParam = searchParams.get('examId');

  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(examIdParam || '');
  const [examData, setExamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Manual Evaluation Modal
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [evalMarks, setEvalMarks] = useState<Record<string, number>>({});
  const [evalFeedback, setEvalFeedback] = useState<Record<string, string>>({});
  const [savingEval, setSavingEval] = useState(false);
  const [evalSuccess, setEvalSuccess] = useState(false);

  // Publish Results Modal
  const [publishing, setPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetchExamSubmissions(selectedExamId);
    }
  }, [selectedExamId]);

  const fetchExams = async () => {
    try {
      const res = await api.get('/faculty/exams');
      if (res.data.success) {
        setExams(res.data.data);
        if (!selectedExamId && res.data.data.length > 0) {
          setSelectedExamId(res.data.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchExamSubmissions = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/faculty/exams/${id}`);
      if (res.data.success) {
        setExamData(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openEvaluationModal = (attempt: any) => {
    setSelectedAttempt(attempt);
    setEvalSuccess(false);

    // Pre-populate existing marks and feedback
    const initialMarks: Record<string, number> = {};
    const initialFeedback: Record<string, string> = {};

    attempt.answers?.forEach((a: any) => {
      initialMarks[a.questionId] = a.marksAwarded ?? 0;
      initialFeedback[a.questionId] = a.evaluationComment || '';
    });

    setEvalMarks(initialMarks);
    setEvalFeedback(initialFeedback);
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttempt) return;
    setSavingEval(true);

    try {
      const evaluations = Object.keys(evalMarks).map((qId) => ({
        questionId: qId,
        marksAwarded: evalMarks[qId],
        feedback: evalFeedback[qId] || 'Evaluated by faculty',
      }));

      const res = await api.post(`/faculty/attempts/${selectedAttempt.id}/evaluate`, {
        evaluations,
      });

      if (res.data.success) {
        setEvalSuccess(true);
        fetchExamSubmissions(selectedExamId);
        setTimeout(() => {
          setSelectedAttempt(null);
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingEval(false);
    }
  };

  const handlePublishResults = async () => {
    if (!selectedExamId) return;
    setPublishing(true);
    try {
      const res = await api.post(`/faculty/exams/${selectedExamId}/publish-results`, {
        releaseAnswersToStudents: true,
      });
      if (res.data.success) {
        setPublishedSuccess(true);
        fetchExamSubmissions(selectedExamId);
        setTimeout(() => setPublishedSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Submissions & Manual Evaluation</h1>
          <p className="text-sm text-slate-500 mt-1">Review candidate answers, grade descriptive questions using rubrics, and officially publish results</p>
        </div>

        {/* Exam Selector */}
        <div className="flex items-center space-x-3">
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

          <a
            href={`/api/reports/exam/${selectedExamId}/excel`}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel Sheet</span>
          </a>

          {!examData?.resultsPublished ? (
            <button
              onClick={handlePublishResults}
              disabled={publishing}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{publishing ? 'Publishing...' : 'Publish Results'}</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Results Published</span>
            </span>
          )}
        </div>
      </div>

      {publishedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Examination results and grade transcripts are now officially accessible to students!</span>
        </div>
      )}

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="text-xs text-slate-500">
            Showing candidate attempts for <span className="font-bold text-slate-800">{examData?.title}</span>
          </div>
          <div className="text-xs font-semibold text-slate-600">
            Total Candidates: {examData?.attempts?.length ?? 0}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Obtained Marks</th>
                <th className="py-3 px-4">Percentage</th>
                <th className="py-3 px-4">Pass / Fail</th>
                <th className="py-3 px-4">Tab Switches</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {examData?.attempts?.map((att: any) => {
                const res = att.gradingResult;
                return (
                  <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600">
                      {att.student?.rollNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {att.student?.user?.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          att.status === 'SUBMITTED'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {res ? `${res.totalObtained} / ${res.totalPossible}` : 'Pending'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-brand-600">
                      {res ? `${res.percentage}%` : '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      {res ? (
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            res.isPassed
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {res.isPassed ? 'PASSED' : 'FAILED'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Uncalculated</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {att.tabSwitchCount > 0 ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-xs font-bold">
                          {att.tabSwitchCount} Alerts
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-xs font-semibold">0 Clean</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => openEvaluationModal(att)}
                        className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        Evaluate & Rubric
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Evaluation Rubric Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Manual Answer Evaluation & Rubrics
                </h2>
                <p className="text-xs text-slate-500">
                  Candidate: <span className="font-bold text-slate-800">{selectedAttempt.student?.user?.name}</span> ({selectedAttempt.student?.rollNumber})
                </p>
              </div>
              <button onClick={() => setSelectedAttempt(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {evalSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                ✔ Grades evaluated and updated successfully!
              </div>
            )}

            <form onSubmit={handleSaveEvaluation} className="space-y-6">
              {examData?.questions?.map((eq: any, idx: number) => {
                const q = eq.questionBank;
                const studentAns = selectedAttempt.answers?.find((a: any) => a.questionId === q.id);
                const qMax = eq.marksOverride ?? q.marks;

                let parsedRubric = null;
                if (q.rubricJson) {
                  try {
                    parsedRubric = JSON.parse(q.rubricJson);
                  } catch (_) {}
                }

                return (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                          Question {idx + 1} ({q.type})
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{q.title}</h4>
                      </div>
                      <span className="text-xs font-bold text-brand-600">Max {qMax} Marks</span>
                    </div>

                    <p className="text-xs text-slate-600 whitespace-pre-line bg-white p-2.5 rounded-lg border border-slate-100">
                      {q.content}
                    </p>

                    {/* Student Response Display */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 uppercase">Student Submission:</span>
                      <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-line">
                        {studentAns?.textAnswer || studentAns?.codeAnswer || (
                          <span className="text-slate-400 italic font-sans">No response submitted</span>
                        )}
                      </div>
                    </div>

                    {/* Rubric Breakdown if Descriptive */}
                    {parsedRubric && (
                      <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 text-xs space-y-1.5">
                        <span className="font-bold text-brand-800 text-[11px] uppercase">Faculty Rubric Criteria:</span>
                        {parsedRubric.map((rub: any, rIdx: number) => (
                          <div key={rIdx} className="flex justify-between text-slate-700 text-[11px]">
                            <span>• {rub.criteria} ({rub.description})</span>
                            <span className="font-bold text-brand-700">Max {rub.maxMarks}m</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Faculty Marks Input & Comments */}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Marks Awarded (0 - {qMax})
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={qMax}
                          value={evalMarks[q.id] ?? 0}
                          onChange={(e) =>
                            setEvalMarks({ ...evalMarks, [q.id]: Number(e.target.value) })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Faculty Feedback / Remark
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Accurate time complexity analysis; missed edge case on space"
                          value={evalFeedback[q.id] ?? ''}
                          onChange={(e) =>
                            setEvalFeedback({ ...evalFeedback, [q.id]: e.target.value })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedAttempt(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={savingEval}
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-500 disabled:opacity-50"
                >
                  {savingEval ? 'Recalculating Grades...' : 'Save & Update Final Grades'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
