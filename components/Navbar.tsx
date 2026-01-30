
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, UserRole, SystemNotification } from '../types';
import { LogOut, Bell, Search, Settings, X, Clock, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import Logo from './Logo';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  notifications: SystemNotification[];
  onDeleteNotification: (id: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, notifications, onDeleteNotification }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Filter notifications to only show those intended for the current user
  const userNotifications = useMemo(() => {
    return notifications.filter(n => n.targetUserId === user.id);
  }, [notifications, user.id]);

  const hideControls = 
    user.role === UserRole.EMPLOYEE || 
    user.role === UserRole.SUPERVISOR || 
    user.role === UserRole.ADMIN ||
    user.role === UserRole.DEPT_HEAD;

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'ALERT': return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
      default: return <Info className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-12">
            <div className="flex items-center">
              <Logo size="sm" className="!flex-row !gap-3" />
            </div>
            
            {!hideControls && (
              <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
                <a href="#" className="text-blue-600 relative after:content-[''] after:absolute after:bottom-[-29px] after:left-0 after:w-full after:h-1 after:bg-blue-600 after:rounded-t-full">Console</a>
                <a href="#" className="hover:text-slate-900 transition-colors">Resources</a>
                <a href="#" className="hover:text-slate-900 transition-colors">Nodes</a>
                <a href="#" className="hover:text-slate-900 transition-colors">Audit</a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {!hideControls && (
              <div className="hidden lg:flex items-center relative group">
                <Search className="absolute left-4 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Query system..."
                  className="pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-blue-500/10 w-48 transition-all focus:bg-white focus:w-64"
                />
              </div>
            )}
            
            <div className="flex items-center gap-1 relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2.5 rounded-xl transition-all relative ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50 hover:text-blue-600'}`}
              >
                <Bell className="w-5 h-5" />
                {userNotifications.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>

              {/* Recorded Notifications Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 py-4 animate-in fade-in slide-in-from-top-2 duration-200 z-50 overflow-hidden">
                  <div className="px-5 pb-3 border-b border-slate-50 flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Recorded Activity</h4>
                    <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">{userNotifications.length} Active</span>
                  </div>
                  
                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                    {userNotifications.length === 0 ? (
                      <div className="py-12 text-center space-y-2">
                         <Bell className="w-8 h-8 text-slate-100 mx-auto" />
                         <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">No active notifications</p>
                      </div>
                    ) : (
                      userNotifications.map((notif) => (
                        <div key={notif.id} className="group px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors relative">
                          <div className="flex gap-3">
                            <div className="mt-0.5">
                              {getNotifIcon(notif.type)}
                            </div>
                            <div className="flex-grow space-y-1">
                              <p className="text-[11px] font-bold text-slate-700 leading-tight pr-4">
                                {notif.message}
                              </p>
                              <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-300 uppercase tracking-tighter">
                                <Clock className="w-3 h-3" />
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNotification(notif.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded-md transition-all text-slate-400 hover:text-red-500 absolute top-3 right-3"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <button className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-all">
                <Settings className="w-5 h-5" />
              </button>
            </div>

            <div className="h-8 w-px bg-slate-100 mx-2 hidden sm:block"></div>

            <div className="flex items-center gap-3 pl-2 group relative">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 leading-tight">{user.name}</p>
                <p className="text-[9px] text-blue-600 font-black uppercase tracking-[0.2em]">{user.role}</p>
              </div>
              
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center rounded-xl font-bold shadow-lg shadow-blue-500/20 cursor-pointer border-2 border-transparent group-hover:border-blue-100 transition-all">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2 translate-y-2 group-hover:translate-y-0 z-50">
                <div className="px-5 py-3 border-b border-slate-50 mb-1 sm:hidden">
                  <p className="text-xs font-black text-slate-900">{user.name}</p>
                  <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest">{user.role}</p>
                </div>
                <button className="w-full text-left px-5 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 hover:text-blue-600 transition-colors">Profile Settings</button>
                <button className="w-full text-left px-5 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 hover:text-blue-600 transition-colors">Security Keys</button>
                <div className="h-px bg-slate-50 my-1.5 mx-3"></div>
                <button 
                  onClick={onLogout}
                  className="w-full text-left px-5 py-2.5 text-xs font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-colors flex items-center gap-3"
                >
                  <LogOut className="w-4 h-4" />
                  Terminate Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
