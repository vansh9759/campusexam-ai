import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  FileCheck2,
  BookOpen,
  CheckCircle2,
  Users,
  Plus,
  ArrowRight,
  Clock,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FacultyDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await api.get('/faculty/overview');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { metrics, assignedSubjects, recentExams } = data || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Faculty Academic Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage assigned courses, author examinations, review submissions and evaluate descriptive answers</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/faculty/exams"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Examination</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Subjects</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{metrics?.assignedSubjectsCount ?? 0}</div>
            <span className="text-xs text-brand-600 font-medium">Active semester courses</span>
          </div>
          <div className="p-3 bg-blue-50 text-brand-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Examinations</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{metrics?.totalExams ?? 0}</div>
            <span className="text-xs text-emerald-600 font-medium">{metrics?.activeExams ?? 0} currently active</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Question Bank Repository</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{metrics?.questionsCount ?? 0}</div>
            <span className="text-xs text-slate-500 font-medium">MCQ, Coding & Descriptive</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Candidate Submissions</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{metrics?.totalAttempts ?? 0}</div>
            <span className="text-xs text-amber-600 font-medium">Ready for grading review</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Assigned Subjects Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">My Assigned Teaching Subjects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assignedSubjects?.map((as: any) => (
            <div key={as.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-50 text-brand-700 rounded-md">
                  {as.subject.code}
                </span>
                <span className="text-xs text-slate-500 font-medium">{as.session.name}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{as.subject.name}</h3>
              <div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span>{as.subject.credits} Academic Credits</span>
                <Link to="/faculty/questions" className="text-brand-600 hover:text-brand-700 font-semibold flex items-center space-x-1">
                  <span>Questions</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Examinations List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Examinations Authored</h2>
            <p className="text-xs text-slate-500">Scheduled exams, completion progress, and candidate attempts</p>
          </div>
          <Link to="/faculty/exams" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            View All Examinations &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Exam Title</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Total Marks</th>
                <th className="py-3 px-4">Candidates</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentExams?.map((ex: any) => (
                <tr key={ex.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{ex.title}</td>
                  <td className="py-3.5 px-4 text-slate-600">{ex.subject?.code}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
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
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{ex.durationMinutes} Mins</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{ex.totalMarks}</td>
                  <td className="py-3.5 px-4 font-bold text-brand-600">{ex.attempts?.length ?? 0}</td>
                  <td className="py-3.5 px-4">
                    <Link
                      to={`/faculty/submissions?examId=${ex.id}`}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Review Submissions &rarr;
                    </Link>
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
