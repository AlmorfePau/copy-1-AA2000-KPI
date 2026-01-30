import React, { useState } from 'react';
import { User, Transmission, Announcement } from '../../types';
import { CheckCircle2, Briefcase, MapPin, PieChart, Layout, Share2 } from 'lucide-react';

interface Props {
  user: User;
  announcements: Announcement[];
  onTransmit: (t: Transmission) => void;
}

const MarketingDashboard: React.FC<Props> = ({ user, onTransmit }) => {
  const [formData, setFormData] = useState({ jobId: '', clientSite: '', jobType: 'Content Creation', startTime: '', endTime: '', systemStatus: 'Active' });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTransmit = () => {
    onTransmit({
      id: `TX-MKT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      userId: user.id, userName: user.name, timestamp: new Date().toISOString(),
      responseTime: '150ms', accuracy: '100%', uptime: '100%',
      jobId: formData.jobId, clientSite: formData.clientSite, jobType: formData.jobType, systemStatus: formData.systemStatus
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
      {showSuccess && (
        <div className="fixed top-24 right-8 z-[100] bg-[#0b1222] text-white px-6 py-4 rounded-[1.5rem] shadow-2xl border border-indigo-500/30 flex items-center gap-4">
          <CheckCircle2 className="w-6 h-6 text-indigo-500" />
          <p className="text-[11px] font-black uppercase tracking-widest">Campaign Log Transmitted</p>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2"><span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md">MARKETING DEPT</span></div>
          <h1 className="text-[40px] font-black text-slate-900 tracking-tight leading-none uppercase">Brand Strategy Terminal</h1>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Campaign ID / Project</label>
              <div className="relative"><Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /><input type="text" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-black" value={formData.jobId} onChange={e => setFormData({...formData, jobId: e.target.value})} /></div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Channel / Platform</label>
              <div className="relative"><Share2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /><input type="text" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-black" value={formData.clientSite} onChange={e => setFormData({...formData, clientSite: e.target.value})} /></div>
            </div>
          </div>
          <button onClick={handleTransmit} className="w-full bg-indigo-600 text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest">Commit Campaign Log</button>
        </div>
        <div className="lg:col-span-5 bg-[#0b1222] rounded-[3rem] p-10 h-full shadow-2xl text-white flex flex-col items-center justify-center"><PieChart className="w-12 h-12 text-indigo-500 mb-6" /><h3 className="text-xl font-black uppercase tracking-widest">Market Reach</h3></div>
      </div>
    </div>
  );
};

export default MarketingDashboard;