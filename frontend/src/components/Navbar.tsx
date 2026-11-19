import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  GraduationCap, 
  LogOut, 
  Bell, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  User as UserIcon,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-700 font-semibold text-xs px-2.5 py-0.5 rounded-full border border-purple-200">DEAN / ADMIN</span>;
      case 'FACULTY':
        return <span className="bg-emerald-100 text-emerald-700 font-semibold text-xs px-2.5 py-0.5 rounded-full border border-emerald-200">FACULTY</span>;
      case 'STUDENT':
        return <span className="bg-blue-100 text-blue-700 font-semibold text-xs px-2.5 py-0.5 rounded-full border border-blue-200">STUDENT</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="bg-brand-600 text-white p-2 rounded-xl shadow-sm flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">CampusExam <span className="text-brand-600">AI</span></span>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Institutional Examination System</span>
            </div>
          </Link>
        </div>

        {/* Right Action Icons & User Profile */}
        <div className="flex items-center space-x-4">
          
          {/* Socket.IO Real-time Status */}
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200" title={isConnected ? "Real-time Telemetry Connected" : "Connecting..."}>
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-emerald-700 font-medium">Socket Live</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-amber-700 font-medium">Connecting</span>
              </>
            )}
          </div>

          {/* User Role Badge */}
          {user && getRoleBadge(user.role)}

          {/* User Info & Logout */}
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</div>
              <div className="text-xs text-slate-500">{user?.email}</div>
            </div>

            <button
              onClick={logout}
              className="flex items-center space-x-1 text-slate-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-medium hidden md:inline">Logout</span>
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
