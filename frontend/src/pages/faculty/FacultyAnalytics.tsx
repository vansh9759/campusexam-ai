import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import {
  Award,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Users,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const FacultyAnalytics: React.FC = () => {
  const [searchParams] = useSearchParams();
  const examIdParam = searchParams.get('examId');

  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(examIdParam || '');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetchAnalytics(selectedExamId);
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

  const fetchAnalytics = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/faculty/exams/${id}/analytics`);
      if (res.data.success) {
        setAnalytics(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Class Examination Analytics & Benchmarking</h1>
          <p className="text-sm text-slate-500 mt-1">Detailed candidate score distribution, pass percentages, and Excel export reports</p>
        </div>

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
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Full Excel</span>
          </a>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Class Average</span>
          <div className="text-2xl font-extrabold text-brand-600 mt-0.5">
            {analytics?.average ?? 0} <span className="text-sm text-slate-400 font-normal">/ {analytics?.totalMarks}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Pass Percentage</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">
            {analytics?.passRate ?? 0}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Highest Score</span>
          <div className="text-2xl font-extrabold text-purple-600 mt-0.5">
            {analytics?.highest ?? 0}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Lowest Score</span>
          <div className="text-2xl font-extrabold text-slate-700 mt-0.5">
            {analytics?.lowest ?? 0}
          </div>
        </div>
      </div>

      {/* Score Distribution Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Score Range Distribution</h2>
          <p className="text-xs text-slate-500">Number of candidate attempts by grade percentile bracket</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics?.distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
              />
              <Bar dataKey="count" fill="#0c87eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Candidates Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
          Candidate Merit Standings
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Marks Obtained</th>
                <th className="py-3 px-4">Percentage</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Integrity (Tab Switches)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics?.attempts?.map((att: any) => (
                <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-600">{att.rollNumber}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{att.studentName}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {att.totalObtained !== undefined ? att.totalObtained : '-'}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-brand-600">
                    {att.percentage !== undefined ? `${att.percentage}%` : '-'}
                  </td>
                  <td className="py-3.5 px-4">
                    {att.isPassed !== undefined ? (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          att.isPassed
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {att.isPassed ? 'PASSED' : 'FAILED'}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Pending</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {att.tabSwitchCount > 0 ? (
                      <span className="text-xs font-bold text-red-600">{att.tabSwitchCount} alerts</span>
                    ) : (
                      <span className="text-xs text-emerald-600 font-semibold">0 Clean</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
