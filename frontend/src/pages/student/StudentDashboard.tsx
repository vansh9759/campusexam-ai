import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  BookOpen,
  Radio,
  Clock,
  Calendar,
  Award,
  Play,
  CheckCircle2,
  Bell,
  ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/student/overview');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (examId: string) => {
    try {
      const res = await api.post(`/exam/${examId}/start`);
      if (res.data.success) {
        const { attemptId } = res.data.data;
        navigate(`/exam/${attemptId}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start exam');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { profile, activeExams, upcomingExams, completedAttempts, notifications, stats } = data || {};

  return (
    <div className="space-y-8">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-navy-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <span className="text-xs uppercase font-bold tracking-wider text-brand-300 px-2.5 py-0.5 rounded-full bg-brand-500/20 border border-brand-400/30">
            Student Examination Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {profile?.user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Roll Number: <span className="font-mono text-white font-bold">{profile?.rollNumber}</span> • {profile?.department?.name} • Semester {profile?.currentSemester?.number}
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Enrolled Subjects</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats?.enrolledSubjectsCount ?? 0}</div>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Active Right Now</span>
            <div className="text-2xl font-extrabold text-brand-600 mt-0.5">{stats?.activeExamsCount ?? 0}</div>
          </div>
          <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Upcoming Exams</span>
            <div className="text-2xl font-extrabold text-amber-600 mt-0.5">{stats?.upcomingExamsCount ?? 0}</div>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Completed Exams</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">{stats?.completedExamsCount ?? 0}</div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Examinations Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <h2 className="text-lg font-bold text-slate-900">Active Examinations Ready to Attempt</h2>
        </div>

        {activeExams?.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-xs text-slate-400">
            No active examinations at this moment. Please check upcoming schedules below.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeExams?.map((ex: any) => (
              <div key={ex.id} className="bg-white rounded-2xl border-2 border-brand-500/40 shadow-md p-6 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  Live Window Open
                </div>

                <div>
                  <span className="text-xs font-mono font-bold text-brand-600">{ex.subject?.code}</span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-1">{ex.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{ex.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2.5 bg-slate-50 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Duration</span>
                    <span className="font-bold text-slate-800">{ex.durationMinutes} Mins</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Marks</span>
                    <span className="font-bold text-slate-800">{ex.totalMarks}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Passing</span>
                    <span className="font-bold text-slate-800">{ex.passingMarks}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleStartExam(ex.id)}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/30 transition-all hover:scale-[1.02]"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Examination Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming & Completed Tabular Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Exams */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Scheduled Upcoming Examinations</h2>
          <div className="space-y-3">
            {upcomingExams?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 italic text-center">No upcoming scheduled exams.</p>
            ) : (
              upcomingExams?.map((ex: any) => (
                <div key={ex.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{ex.title}</div>
                    <div className="text-xs text-slate-500">{ex.subject?.code} • {ex.durationMinutes} Mins</div>
                  </div>
                  <div className="text-right text-xs font-mono text-slate-600">
                    {new Date(ex.startTime).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications & System Updates */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Academic Notifications</h2>
          </div>
          <div className="space-y-3">
            {notifications?.map((notif: any) => (
              <div key={notif.id} className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100/60 text-xs space-y-1">
                <div className="font-bold text-brand-900">{notif.title}</div>
                <div className="text-slate-600">{notif.message}</div>
                <div className="text-[10px] text-slate-400 font-mono pt-1">
                  {new Date(notif.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
