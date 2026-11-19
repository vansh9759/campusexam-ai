import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  FileCheck2,
  Radio,
  FileCode,
  FileSpreadsheet,
  History,
  CheckCircle2,
  Sparkles,
  Award,
  Layers,
  GraduationCap
} from 'lucide-react';

interface NavLinkItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const adminLinks: NavLinkItem[] = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Analytics Dashboard' },
    { to: '/admin/departments', icon: Building2, label: 'Departments & Courses' },
    { to: '/admin/subjects', icon: BookOpen, label: 'Subjects & Credits' },
    { to: '/admin/users', icon: Users, label: 'Faculty & Students' },
    { to: '/admin/proctoring', icon: Radio, label: 'Live Exam Proctoring', badge: 'Live' },
    { to: '/admin/audit', icon: History, label: 'Security Audit Logs' },
  ];

  const facultyLinks: NavLinkItem[] = [
    { to: '/faculty/dashboard', icon: LayoutDashboard, label: 'Faculty Overview' },
    { to: '/faculty/exams', icon: FileCheck2, label: 'Examinations' },
    { to: '/faculty/questions', icon: Layers, label: 'Question Bank' },
    { to: '/faculty/submissions', icon: CheckCircle2, label: 'Submissions & Grading', badge: 'Review' },
    { to: '/faculty/analytics', icon: Award, label: 'Class Performance' },
  ];

  const studentLinks: NavLinkItem[] = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'My Exams Portal' },
    { to: '/student/results', icon: Award, label: 'Grade Transcripts' },
  ];

  let links: NavLinkItem[] = studentLinks;
  if (user?.role === 'ADMIN') links = adminLinks;
  else if (user?.role === 'FACULTY') links = facultyLinks;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shrink-0 shadow-lg">
      <div className="space-y-6">
        
        {/* Role Portal Label */}
        <div className="px-3 py-2 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-brand-400"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {user?.role === 'ADMIN' ? 'Dean & Administration' : user?.role === 'FACULTY' ? 'Academic Faculty Portal' : 'Student Portal'}
          </span>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Institutional Status Card at bottom */}
      <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-xs text-slate-400 space-y-1">
        <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>CampusExam v2.6 Pro</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Autograding & server-authoritative timer verified.
        </p>
      </div>
    </aside>
  );
};
