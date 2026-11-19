import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import {
  Users,
  Building2,
  BookOpen,
  Award,
  FileCheck2,
  TrendingUp,
  Activity,
  Radio,
  FileSpreadsheet,
  Download,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard-stats');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0c87eb', '#10b981', '#f59e0b', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { metrics, departmentPerformance, recentActivity } = data || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Examination & Grading Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time college academic overview, department benchmarks and active examination monitoring</p>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href="/api/reports/exam/completed/excel"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Analytics</span>
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Enrolled Students</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{metrics?.totalStudents ?? 0}</div>
            <span className="text-xs text-emerald-600 font-medium">Across all departments</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Examinations</span>
            <div className="text-2xl font-extrabold text-brand-600 mt-1">{metrics?.activeExams ?? 0}</div>
            <span className="text-xs text-amber-600 font-medium">Currently in-progress</span>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Examination Score</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{metrics?.avgScore ?? 0}%</div>
            <span className="text-xs text-emerald-600 font-medium">College-wide grading mean</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Pass Percentage</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{metrics?.passPercentage ?? 0}%</div>
            <span className="text-xs text-slate-500 font-medium">{metrics?.completedExams ?? 0} exams completed</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Average Scores Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Department Performance Benchmarks</h2>
              <p className="text-xs text-slate-500">Average student examination score (%) by academic department</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              Even Semester 2026
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="code" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Average Score']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                />
                <Bar dataKey="avgScore" fill="#0c87eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Examination Status Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Examination Pipeline</h2>
          <p className="text-xs text-slate-500 mb-6">Status of scheduled academic evaluations</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50/60 rounded-xl border border-blue-100">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-semibold text-slate-700">Active Ongoing</span>
              </div>
              <span className="font-mono font-bold text-blue-700">{metrics?.activeExams ?? 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50/60 rounded-xl border border-amber-100">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm font-semibold text-slate-700">Upcoming Published</span>
              </div>
              <span className="font-mono font-bold text-amber-700">{metrics?.upcomingExams ?? 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-semibold text-slate-700">Completed & Graded</span>
              </div>
              <span className="font-mono font-bold text-emerald-700">{metrics?.completedExams ?? 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <span className="text-sm font-semibold text-slate-700">Total Exams</span>
              </div>
              <span className="font-mono font-bold text-slate-700">{metrics?.totalExams ?? 0}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recent System Activity / Audit Feed */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Institutional Audit Events</h2>
            <p className="text-xs text-slate-500">Security and examination activity trail recorded with immutable timestamps</p>
          </div>
          <a href="/admin/audit" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            View All Logs &rarr;
          </a>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActivity?.map((act: any) => (
            <div key={act.id} className="py-3 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                <div>
                  <span className="font-semibold text-slate-800">{act.action}</span>
                  <span className="text-xs text-slate-400 ml-2">({act.resource})</span>
                </div>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {new Date(act.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
