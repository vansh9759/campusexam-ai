import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { GraduationCap, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);

        // Redirect based on role
        if (user.role === 'ADMIN') navigate('/admin/dashboard');
        else if (user.role === 'FACULTY') navigate('/faculty/dashboard');
        else navigate('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-navy-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      
      {/* Decorative gradient blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-brand-600 rounded-2xl shadow-xl shadow-brand-600/30 mb-4">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">CampusExam AI</h2>
        <p className="mt-2 text-sm text-slate-300">
          College Online Examination & Automatic Grading System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/80 sm:px-10">
          
          {error && (
            <div className="mb-6 p-3.5 bg-red-500/15 border border-red-500/30 rounded-xl flex items-start space-x-2.5 text-sm text-red-300">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Institutional Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@campusexam.edu"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Section */}
          <div className="mt-8 pt-6 border-t border-slate-700/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3 text-center">
              Quick Demo Accounts
            </span>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => fillCredentials('admin@campusexam.edu', 'Admin@123')}
                className="flex items-center justify-between px-3 py-2 bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700/60 rounded-xl text-xs text-left transition-colors"
              >
                <div>
                  <div className="font-semibold text-purple-300">Admin / Dean Portal</div>
                  <div className="text-slate-400 text-[11px]">admin@campusexam.edu</div>
                </div>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">
                  Admin@123
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('prof.sharma@campusexam.edu', 'Faculty@123')}
                className="flex items-center justify-between px-3 py-2 bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700/60 rounded-xl text-xs text-left transition-colors"
              >
                <div>
                  <div className="font-semibold text-emerald-300">Faculty (Prof. Sharma)</div>
                  <div className="text-slate-400 text-[11px]">prof.sharma@campusexam.edu</div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  Faculty@123
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('student1@campusexam.edu', 'Student@123')}
                className="flex items-center justify-between px-3 py-2 bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700/60 rounded-xl text-xs text-left transition-colors"
              >
                <div>
                  <div className="font-semibold text-blue-300">Student (Vansh Sharma)</div>
                  <div className="text-slate-400 text-[11px]">student1@campusexam.edu</div>
                </div>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                  Student@123
                </span>
              </button>
            </div>
          </div>

        </div>

        <div className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Role-Based Access Control • Server-Authoritative Timing • Secure Autograding</span>
        </div>
      </div>

    </div>
  );
};
