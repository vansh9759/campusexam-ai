import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Award,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileText,
  X
} from 'lucide-react';

export const StudentResults: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await api.get('/student/results');
      if (res.data.success) {
        setResults(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (attemptId: string) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/student/results/${attemptId}`);
      if (res.data.success) {
        setSelectedResult(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Official Examination Grade Transcripts</h1>
        <p className="text-sm text-slate-500 mt-1">Review verified examination evaluations, grade transcripts, and subject-wise scorecards</p>
      </div>

      {results.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-3">
          <Award className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Published Transcripts Available</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Once faculty publish official results for completed examinations, your verified scorecards and downloadable PDF certificates will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((r) => {
            const gr = r.gradingResult;
            const ex = r.examination;
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 hover:border-brand-300 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-brand-600">
                      {ex.subject?.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{ex.title}</h3>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      gr?.isPassed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {gr?.isPassed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 bg-slate-50 rounded-xl text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Marks Awarded</span>
                    <span className="text-lg font-extrabold text-slate-800">
                      {gr?.totalObtained} / {gr?.totalPossible}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Score Percentile</span>
                    <span className="text-lg font-extrabold text-brand-600">
                      {gr?.percentage}%
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => handleViewDetail(r.id)}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Scorecard</span>
                  </button>

                  <a
                    href={`/api/reports/attempt/${r.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Transcript</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scorecard Breakdown Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedResult.examination?.title}
                </h2>
                <p className="text-xs text-slate-500">
                  Final Score: <span className="font-bold text-brand-600">{selectedResult.gradingResult?.percentage}%</span> ({selectedResult.gradingResult?.totalObtained} / {selectedResult.gradingResult?.totalPossible} Marks)
                </p>
              </div>
              <button onClick={() => setSelectedResult(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {selectedResult.answers?.map((ans: any, idx: number) => (
                <div key={ans.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-800">
                      Q{idx + 1}. {ans.questionTitle} ({ans.questionType})
                    </span>
                    <span className="font-bold text-brand-600">
                      {ans.marksAwarded ?? 0} / {ans.marksPossible} Marks
                    </span>
                  </div>

                  <p className="text-slate-600 whitespace-pre-line">{ans.questionContent}</p>

                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Your Submission:</span>
                    <span className="font-mono text-slate-800">
                      {ans.textAnswer || ans.codeAnswer || 'No answer submitted'}
                    </span>
                  </div>

                  {ans.evaluationComment && (
                    <div className="text-[11px] text-slate-500 font-medium italic">
                      Remarks: {ans.evaluationComment}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
