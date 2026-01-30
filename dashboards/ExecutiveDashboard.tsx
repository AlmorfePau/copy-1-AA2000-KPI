import React from 'react';
import { User } from '../types';
import { 
  BarChart3, 
  Target, 
  Zap, 
  Shield, 
  Scale,
  CircleDollarSign,
  Info
} from 'lucide-react';

interface Props {
  user: User;
}

const ExecutiveDashboard: React.FC<Props> = ({ user }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#2563eb] text-white text-[10px] font-black uppercase tracking-widest rounded-md">3P CERTIFIED SYSTEM</span>
            <span className="px-3 py-1 bg-[#0f172a] text-white text-[10px] font-black uppercase tracking-widest rounded-md">LEVEL: EXECUTIVE</span>
          </div>
          <div>
            <h1 className="text-[40px] font-black text-[#1e293b] tracking-tight leading-none">Executive Strategic Console</h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">Personnel: <span className="text-blue-600 font-bold">{user.name}</span> • Status: <span className="text-[#1e293b] font-bold">Active Connection</span></p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 min-w-[220px]">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Scale className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">BASE SALARY</p>
              <p className="text-2xl font-black text-[#1e293b] tracking-tight">₱{user.baseSalary.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-[#f0f7ff] p-6 rounded-[2.5rem] border border-[#dbeafe] shadow-sm flex items-center gap-5 min-w-[220px]">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#dbeafe]">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">TARGET INCENTIVE</p>
              <p className="text-2xl font-black text-[#1e293b] tracking-tight">₱{user.incentiveTarget.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Validated Objectives Section */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1e293b] uppercase tracking-widest leading-none mb-1">VALIDATED OBJECTIVES</h3>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">VERIFIED PERFORMANCE LEVELS</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { label: "MARKET EXPANSION", value: "99.8", unit: "%" },
                { label: "NET MARGIN", value: "99.8", unit: "%" },
                { label: "STRATEGIC NPS", value: "99.8", unit: "PT" }
              ].map((metric, i) => (
                <div key={i} className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{metric.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[#1e293b] tracking-tighter">{metric.value}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase">{metric.unit}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${parseFloat(metric.value)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Global Report Section */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="space-y-6">
              <h3 className="text-[28px] font-black text-[#1e293b] tracking-tight flex items-center gap-1">
                STRATEGIC GLOBAL REPORT<span className="text-blue-600">.</span>
              </h3>
              <div className="space-y-4">
                <p className="text-slate-400 text-[13px] leading-relaxed font-medium max-w-2xl">
                  AA2000 is currently maintaining a <span className="text-[#1e293b] font-black">Bullish Sector Advantage.</span> All departmental nodes are reporting within acceptable standard deviations. Strategic projections suggest a notable increase in node efficiency following the V4.2 Core rollout.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar area */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* P3 Realization Card */}
          <div className="bg-[#0b1222] rounded-[3rem] p-10 shadow-2xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[100px] rounded-full -mr-24 -mt-24"></div>
            
            <div className="flex items-center gap-4 mb-16">
              <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                <CircleDollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.1em] leading-none mb-1">P3 REALIZATION</h3>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">VALIDATED PAYOUT</p>
              </div>
            </div>

            <div className="space-y-16">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">VALIDATED MULTIPLIER</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black tracking-tighter">1.00</span>
                  <span className="text-blue-500 text-2xl font-black italic">x</span>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">PROJECTED YIELD</p>
                  <p className="text-3xl font-black text-[#10b981] tracking-tight">₱125,000</p>
                </div>
                <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.5)]" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* System Security section */}
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8">SYSTEM SECURITY</p>
            <div className="flex items-center gap-5 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                <Shield className="w-6 h-6 text-blue-600/40" />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-[#1e293b] uppercase tracking-widest mb-1.5">SUPERVISOR AUDIT</h4>
                <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">Updates only commit after hierarchical verification.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;