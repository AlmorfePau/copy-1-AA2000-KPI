import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { LogIn, Shield, User as UserIcon, Lock, ChevronDown, Activity, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import Logo from './Logo';

interface LoginCardProps {
  onLogin: (user: User) => void;
  onAddAuditEntry: (action: string, details: string, type?: 'INFO' | 'OK' | 'WARN', userName?: string) => void;
}

const ROLE_FINANCIALS: Record<UserRole, { base: number; target: number }> = {
  [UserRole.EMPLOYEE]: { base: 62000, target: 12000 },
  [UserRole.SUPERVISOR]: { base: 88000, target: 18000 },
  [UserRole.DEPT_HEAD]: { base: 135000, target: 45000 },
  [UserRole.ADMIN]: { base: 105000, target: 25000 },
  [UserRole.EXECUTIVE]: { base: 275000, target: 125000 },
};

const SORTED_ROLES = [
  UserRole.ADMIN,
  UserRole.EXECUTIVE,
  UserRole.DEPT_HEAD,
  UserRole.SUPERVISOR,
  UserRole.EMPLOYEE,
];

// Root Admin Credentials
const ADMIN_IDENTITY = "Paulo Almorfe";
const ADMIN_PASSKEY = "123";

const LoginCard: React.FC<LoginCardProps> = ({ onLogin, onAddAuditEntry }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
  const [name, setName] = useState('');
  const [passkey, setPasskey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'SUCCESS' | 'ERROR'; message: string } | null>(null);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);
    
    setTimeout(() => {
      const regRaw = localStorage.getItem('aa2001_credential_registry');
      const registry = regRaw ? JSON.parse(regRaw) : [];
      let foundDept = 'Admin';

      // Security Protocol: If the registry is empty and not root admin, purge stale data
      if (registry.length === 0 && name.trim() !== ADMIN_IDENTITY) {
        localStorage.removeItem('aa2001_pending_transmissions');
        localStorage.removeItem('aa2001_validated_stats');
        localStorage.removeItem('aa2001_audit_logs');
        localStorage.removeItem('aa2001_notifications');
        localStorage.removeItem('aa2001_admin_users');
        const errorMsg = 'CORE DATABASE EMPTY. ACCESS REJECTED.';
        onAddAuditEntry('AUTH_FAILURE', `System core empty. Failed access attempt by: ${name.trim() || 'Anonymous'}`, 'WARN');
        setFeedback({ type: 'ERROR', message: errorMsg });
        setIsLoading(false);
        return;
      }

      // 1. Check Hardcoded Root Admin (Case-Sensitive)
      if (selectedRole === UserRole.ADMIN && name.trim() === ADMIN_IDENTITY) {
        if (passkey !== ADMIN_PASSKEY) {
          onAddAuditEntry('AUTH_FAILURE', `Invalid admin passkey attempt for identity: ${ADMIN_IDENTITY}`, 'WARN');
          setFeedback({ type: 'ERROR', message: 'ACCESS DENIED: INVALID ADMIN PASSKEY' });
          setIsLoading(false);
          return;
        }
        setFeedback({ type: 'SUCCESS', message: 'ADMINISTRATIVE ACCESS GRANTED' });
      } 
      // 2. Check Credential Registry (Strictly matching Name and Role - Now Case-Sensitive)
      else {
        // Changed to exact match to enforce case-sensitivity for registry identities
        const matchedIdentity = registry.filter((u: any) => u.name === name.trim());
        
        if (matchedIdentity.length > 0) {
          const foundUser = matchedIdentity.find((u: any) => u.role === selectedRole);

          if (!foundUser) {
            onAddAuditEntry('AUTH_FAILURE', `Role mismatch for ${name.trim()}. Requested: ${selectedRole}`, 'WARN');
            setFeedback({ 
              type: 'ERROR', 
              message: `ACCESS DENIED: LEVEL ${selectedRole.toUpperCase()} NOT AUTHORIZED FOR THIS NODE` 
            });
            setIsLoading(false);
            return;
          }

          if (passkey !== foundUser.password) {
            onAddAuditEntry('AUTH_FAILURE', `Invalid passkey for user node: ${name.trim()}`, 'WARN');
            setFeedback({ type: 'ERROR', message: 'ACCESS DENIED: INVALID PASSKEY' });
            setIsLoading(false);
            return;
          }
          foundDept = foundUser.department;
          setFeedback({ type: 'SUCCESS', message: `CONNECTING: DEPT ${foundUser.department.toUpperCase()}` });
        } 
        else {
          onAddAuditEntry('AUTH_FAILURE', `Unrecognized identity login attempt: ${name.trim()}`, 'WARN');
          setFeedback({ type: 'ERROR', message: 'ACCESS DENIED: UNRECOGNIZED IDENTITY' });
          setIsLoading(false);
          return;
        }
      }

      const financial = ROLE_FINANCIALS[selectedRole];
      const stableId = btoa(name || selectedRole).substring(0, 12);
      
      setTimeout(() => {
        onLogin({
          id: stableId,
          name: name || `User_${selectedRole}`,
          email: `${(name || selectedRole).replace(/\s/g, '')}@aa2001.com`,
          role: selectedRole,
          baseSalary: financial.base,
          incentiveTarget: financial.target,
          department: foundDept
        });
      }, 800);
    }, 1200);
  };

  return (
    <div className="w-full max-w-md animate-in fade-in zoom-in duration-700 relative">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl -ml-12 -mb-12"></div>

        <div className="relative z-10 flex flex-col items-center">
          <Logo size="md" className="mb-6" />
          
          <div className="text-center mb-10 w-full">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
                KPI<span className="text-blue-600">.</span>CONSOLE
              </h2>
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">CORE V4.2</span>
              </span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="h-px bg-slate-100 flex-grow"></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">
                Strategic Performance Intelligence
              </p>
              <div className="h-px bg-slate-100 flex-grow"></div>
            </div>
            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.1em] mt-2 italic">
              Key Performance Indicator Framework
            </p>
          </div>

          <div className="w-full relative">
            {feedback && (
              <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-2 fade-in duration-300 w-max">
                <div className={`px-5 py-2.5 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
                  feedback.type === 'SUCCESS' 
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-700' 
                    : 'bg-red-50/90 border-red-200 text-red-700'
                }`}>
                  {feedback.type === 'SUCCESS' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] whitespace-nowrap">
                    {feedback.message}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personnel Identity</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="text" 
                    required
                    placeholder="Employee Name"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-bold text-sm text-slate-900 placeholder:text-slate-300"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Level</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <select 
                    className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none appearance-none transition-all font-bold text-sm text-slate-900 cursor-pointer"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  >
                    {SORTED_ROLES.map((role) => (
                      <option key={role} value={role} className="text-slate-900">{role}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Passkey</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-bold text-sm text-slate-900 placeholder:text-slate-300"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full mt-2 font-black py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase text-[11px] tracking-[0.2em] group ${
                  isLoading ? 'bg-slate-700 shadow-none' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/10'
                } text-white`}
              >
                {isLoading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Establish Connection
                    <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
           <Cpu className="w-3.5 h-3.5 text-slate-300" />
           <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.3em]">
             AA2000 Distributed Intelligence Network
           </p>
        </div>
        <div className="px-4 py-1 bg-slate-100/50 rounded-full border border-slate-200/50">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Authorized Access Only</p>
        </div>
      </div>
    </div>
  );
};

export default LoginCard;