import React, { useState, useMemo, useEffect } from 'react';
import { User, Transmission, SystemStats, Announcement } from '../types';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Shield, 
  CheckCircle2, 
  Edit2, 
  X, 
  LayoutDashboard, 
  ListTodo, 
  ClipboardCheck, 
  History,
  AlertTriangle,
  ArrowRight,
  Eye,
  RotateCcw,
  Megaphone,
  Send,
  Clock,
  Trash2,
  Briefcase,
  MapPin,
  Settings,
  Circle,
  Activity,
  UserCheck,
  ShieldCheck,
  Star,
  Paperclip,
  FileImage,
  File as FileIcon,
  Download,
  Target,
  Trophy,
  User as UserIcon,
  Cpu
} from 'lucide-react';

interface Props {
  user: User;
  pendingTransmissions: Transmission[];
  transmissionHistory: Transmission[];
  announcements: Announcement[];
  onValidate: (id: string, overrides?: any, status?: 'validated' | 'rejected') => void;
  onAddAuditEntry: (action: string, details: string, type?: 'INFO' | 'OK' | 'WARN', userName?: string) => void;
  onPostAnnouncement: (message: string) => void;
  onDeleteAnnouncement: (id: string) => void;
}

type Page = 'dashboard' | 'queue' | 'validation' | 'team' | 'reports';

const SupervisorDashboard: React.FC<Props> = ({ 
  user, 
  pendingTransmissions, 
  transmissionHistory,
  announcements,
  onValidate, 
  onAddAuditEntry,
  onPostAnnouncement,
  onDeleteAnnouncement
}) => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedItem, setSelectedItem] = useState<Transmission | null>(null);
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [queueTab, setQueueTab] = useState<'pending' | 'history' | 'rejected'>('pending');
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Validation/Override State
  const [overrides, setOverrides] = useState<any>(null);
  const [overrideReason, setOverrideReason] = useState('');

  // Grading State (Specific to Technical Dept)
  const [grading, setGrading] = useState({
    performance: 5,
    proficiency: 5,
    professionalism: 5
  });

  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [deptMembers, setDeptMembers] = useState<any[]>([]);

  useEffect(() => {
    const regRaw = localStorage.getItem('aa2001_credential_registry');
    if (regRaw) {
      try {
        const registry = JSON.parse(regRaw);
        const members = registry.filter((u: any) => u.department === user.department);
        const membersWithStatus = members.map((u: any) => ({
          ...u,
          isOnline: Math.random() > 0.3
        }));
        setDeptMembers(membersWithStatus);
      } catch (e) {
        console.error("Failed to parse registry", e);
      }
    }
  }, [user.department, currentPage]);

  const activeAnnouncements = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return announcements
      .filter(a => a.department === user.department)
      .filter(a => new Date(a.timestamp) > oneMonthAgo)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [announcements, user.department]);

  const isFlagged = (t: Transmission) => {
    const rt = parseInt(t.responseTime);
    const acc = parseFloat(t.accuracy);
    return rt > 250 || acc < 97;
  };

  const filteredQueue = useMemo(() => {
    if (queueTab === 'history') {
      return transmissionHistory.filter(t => {
        const regRaw = localStorage.getItem('aa2001_credential_registry');
        if (!regRaw) return false;
        const reg = JSON.parse(regRaw);
        const matched = reg.find((u: any) => u.name === t.userName);
        return matched?.department === user.department && (!t.status || t.status === 'validated');
      });
    }
    if (queueTab === 'rejected') {
      return transmissionHistory.filter(t => {
        const regRaw = localStorage.getItem('aa2001_credential_registry');
        if (!regRaw) return false;
        const reg = JSON.parse(regRaw);
        const matched = reg.find((u: any) => u.name === t.userName);
        return matched?.department === user.department && t.status === 'rejected';
      });
    }
    return pendingTransmissions;
  }, [pendingTransmissions, transmissionHistory, queueTab, user.department]);

  // Combine and sort team members: Supervisor (current user) always on top
  const sortedTeam = useMemo(() => {
    const others = deptMembers.filter(m => m.name !== user.name);
    return [
      { 
        name: user.name, 
        role: user.role, 
        isOnline: true, 
        isSupervisor: true,
        id: user.id,
        department: user.department
      }, 
      ...others
    ];
  }, [deptMembers, user]);

  const handleOpenValidation = (item: Transmission, readOnly: boolean = false) => {
    setSelectedItem(item);
    setIsReadOnly(readOnly);
    setOverrides({
      responseTime: item.responseTime,
      accuracy: item.accuracy,
      uptime: item.uptime,
      jobId: item.jobId,
      clientSite: item.clientSite,
      jobType: item.jobType,
      systemStatus: item.systemStatus
    });
    
    if (item.ratings) {
      setGrading({
        performance: item.ratings.performance,
        proficiency: item.ratings.proficiency,
        professionalism: item.ratings.professionalism
      });
    } else {
      setGrading({ performance: 5, proficiency: 5, professionalism: 5 });
    }
    
    setOverrideReason(item.supervisorComment || '');
    setCurrentPage('validation');
  };

  const calculatedScore = useMemo(() => {
    const perf = (grading.performance / 5) * 45;
    const prof = (grading.proficiency / 5) * 35;
    const behavior = (grading.professionalism / 5) * 20;
    const final = Math.round(perf + prof + behavior);
    
    let incentivePct = 0;
    if (final >= 90) incentivePct = 1.0;
    else if (final >= 85) incentivePct = 0.75;
    else if (final >= 80) incentivePct = 0.50;
    else if (final >= 75) incentivePct = 0.25;

    return { final, incentivePct };
  }, [grading]);

  const handleAction = (type: 'APPROVE' | 'REJECT' | 'OVERRIDE') => {
    if (!selectedItem || isReadOnly) return;
    if ((type === 'OVERRIDE' || type === 'REJECT') && !overrideReason.trim()) {
      alert(`MANDATORY: Provide a justification for ${type === 'REJECT' ? 'rejection' : 'manual data override'}.`);
      return;
    }

    const ratings = {
      ...grading,
      finalScore: calculatedScore.final,
      incentivePct: calculatedScore.incentivePct
    };

    if (type === 'REJECT') {
      onAddAuditEntry('KPI_REJECTED', `Supervisor rejected submission ${selectedItem.id}.`, 'WARN');
      // Pass the current stats along with the comment during rejection to maintain log integrity
      const rejectionOverrides = {
        responseTime: selectedItem.responseTime,
        accuracy: selectedItem.accuracy,
        uptime: selectedItem.uptime,
        supervisorComment: overrideReason.trim()
      };
      onValidate(selectedItem.id, rejectionOverrides, 'rejected'); 
      setFeedbackMsg(`Submission rejected.`);
    } else {
      const statsOverrides = {
        ...(overrides || {}),
        ratings,
        supervisorComment: overrideReason.trim()
      };
      onAddAuditEntry('KPI_APPROVED', `Supervisor validated and graded submission ${selectedItem.id}. Score: ${calculatedScore.final}%`, 'OK');
      onValidate(selectedItem.id, statsOverrides, 'validated');
      setFeedbackMsg(`Submission validated and graded.`);
    }

    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 3000);
    setCurrentPage('queue');
    setSelectedItem(null);
  };

  const handleDispatchAnnouncement = () => {
    if (announcementMsg.trim()) {
      onPostAnnouncement(announcementMsg.trim());
      setAnnouncementMsg('');
    }
  };

  const handleDeleteBroadcast = (id: string) => {
    onDeleteAnnouncement(id);
  };

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Pending</p>
          <div className="flex items-end justify-between">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter">{pendingTransmissions.length}</h2>
            <ListTodo className="w-8 h-8 text-blue-100" />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Flagged Items</p>
          <div className="flex items-end justify-between">
            <h2 className="text-5xl font-black text-amber-500 tracking-tighter">{pendingTransmissions.filter(isFlagged).length}</h2>
            <AlertTriangle className="w-8 h-8 text-amber-100" />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Avg. Validation</p>
          <div className="flex items-end justify-between">
            <h2 className="text-5xl font-black text-emerald-500 tracking-tighter">12m</h2>
            <RotateCcw className="w-8 h-8 text-emerald-100" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="bg-[#0b1222] rounded-[2.5rem] p-10 text-white relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-2xl font-black tracking-tight uppercase">Integrity Directive</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                ISO-9001 protocols are active. Each validation requires a performance grading to calculate quarterly incentive eligibility.
              </p>
            </div>
            <button onClick={() => setCurrentPage('queue')} className="mt-8 relative z-10 w-fit px-8 py-4 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-blue-50 transition-all shadow-xl shadow-blue-500/10">
              Process Queue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><Megaphone className="w-5 h-5 text-white" /></div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Unit Broadcast</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direct Directive</p>
              </div>
            </div>
            <textarea 
              value={announcementMsg}
              onChange={(e) => setAnnouncementMsg(e.target.value)}
              placeholder={`Write to ${user.department}...`}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[120px]"
            />
            <button 
              onClick={handleDispatchAnnouncement}
              disabled={!announcementMsg.trim()}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Dispatch Broadcast
            </button>
          </div>
        </div>
        <div className="lg:col-span-7 h-full">
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm h-full overflow-hidden">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><History className="w-5 h-5 text-slate-600" /></div>
                <div><h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Broadcast History</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sent Directives</p></div>
             </div>
             <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {activeAnnouncements.map(a => (
                  <div key={a.id} className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 relative group">
                    <button onClick={() => handleDeleteBroadcast(a.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{a.message}"</p>
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                      <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3 h-3" />{new Date(a.timestamp).toLocaleDateString()}</div>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded">ACTIVE</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQueue = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><ListTodo className="w-5 h-5 text-white" /></div>
          <div><h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Submissions Registry</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{queueTab === 'pending' ? 'Pending Review' : queueTab === 'history' ? 'Validated Records' : 'Rejected Records'}</p></div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setQueueTab('pending')}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${queueTab === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Pending
            </button>
            <button 
              onClick={() => setQueueTab('history')}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${queueTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Validated
            </button>
            <button 
              onClick={() => setQueueTab('rejected')}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${queueTab === 'rejected' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {filteredQueue.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2rem] border border-slate-50 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4"><ClipboardCheck className="w-8 h-8 text-slate-200" /></div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Registry empty for current selection</p>
          </div>
        ) : (
          filteredQueue.map(item => (
            <div key={item.id} className="group flex items-center justify-between p-6 bg-white rounded-[2rem] border border-slate-50 hover:shadow-md transition-all">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-600">{item.userName.charAt(0)}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-slate-900">{item.userName}</p>
                    {queueTab === 'pending' && isFlagged(item) && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black rounded border border-amber-100">FLAGGED</span>}
                    {queueTab === 'history' && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded border border-emerald-100 uppercase">ARCHIVED</span>}
                    {queueTab === 'rejected' && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[8px] font-black rounded border border-red-100 uppercase">REJECTED</span>}
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TX ID: {item.id} • {item.jobId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {queueTab === 'history' && item.ratings && (
                  <div className="px-4 py-2 bg-slate-50 rounded-xl flex items-center gap-3 border border-slate-100">
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Final Score</p>
                      <p className="text-xs font-black text-slate-900 leading-none">{item.ratings.finalScore}%</p>
                    </div>
                  </div>
                )}
                <button onClick={() => handleOpenValidation(item, queueTab === 'history' || queueTab === 'rejected')} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                  {queueTab !== 'pending' ? 'View Record' : 'Validate'} <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div>
          <div><h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Unit Matrix</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operational Personnel Status</p></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <span className="text-[9px] font-black uppercase tracking-widest">{sortedTeam.length} Nodes Registered</span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {sortedTeam.map((member, idx) => (
          <div key={idx} className={`group flex items-center justify-between p-6 bg-white rounded-[2rem] border transition-all ${member.isSupervisor ? 'border-blue-200 shadow-sm shadow-blue-50' : 'border-slate-50 hover:shadow-md'}`}>
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black transition-colors ${member.isSupervisor ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {member.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-black text-slate-900">{member.name}</p>
                  {member.isSupervisor && <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded uppercase">SUPERVISOR</span>}
                  {member.name === user.name && !member.isSupervisor && <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[8px] font-black rounded uppercase">YOU</span>}
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{member.role} • {member.department}</p>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${member.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{member.isOnline ? 'Active' : 'Standby'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all">
                 <Shield className="w-4 h-4" />
               </button>
               <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all">
                 <Cpu className="w-4 h-4" />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderValidation = () => {
    if (!selectedItem || !overrides) return null;
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden pb-12">
          <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-6">
              <button onClick={() => setCurrentPage('queue')} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-sm"><X className="w-5 h-5" /></button>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{isReadOnly ? (selectedItem.status === 'rejected' ? 'Rejected Record Terminal' : 'Archived Record Terminal') : 'Technical Review Terminal'}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Node ID: {selectedItem.id}</p>
              </div>
            </div>
            {isReadOnly && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${selectedItem.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                {selectedItem.status === 'rejected' ? <X className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                <span className="text-[9px] font-black uppercase tracking-widest">{selectedItem.status === 'rejected' ? 'Rejected Record' : 'Validated Record'}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 p-10">
            <div className="lg:col-span-7 space-y-12">
              <div className="space-y-6">
                <div className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center"><Settings className="w-4 h-4 text-white" /></div><p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Core Metadata Review</p></div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Job ID</label><input type="text" readOnly={isReadOnly} className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-sm ${isReadOnly ? 'opacity-70' : ''}`} value={overrides.jobId} onChange={e => setOverrides({...overrides, jobId: e.target.value})} /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Site</label><input type="text" readOnly={isReadOnly} className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-sm ${isReadOnly ? 'opacity-70' : ''}`} value={overrides.clientSite} onChange={e => setOverrides({...overrides, clientSite: e.target.value})} /></div>
                </div>
              </div>

              {selectedItem.projectReport && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Employee Narrative</p>
                  <div className="bg-blue-50/30 rounded-3xl p-8 text-sm font-medium text-slate-600 italic border border-blue-50 leading-relaxed">"{selectedItem.projectReport}"</div>
                </div>
              )}

              {selectedItem.attachments && selectedItem.attachments.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Evidence Registry</p>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedItem.attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group/file">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">{file.type.includes('image') ? <FileImage className="w-5 h-5 text-blue-500" /> : <FileIcon className="w-5 h-5 text-slate-400" />}</div>
                          <div className="overflow-hidden"><p className="text-[9px] font-black text-slate-900 truncate uppercase">{file.name}</p><p className="text-[8px] font-bold text-slate-400">{file.size}</p></div>
                        </div>
                        <button onClick={() => alert('Secure Download Init...')} className="p-2 opacity-0 group-hover/file:opacity-100 text-slate-400 hover:text-blue-600 transition-all"><Download className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 space-y-10">
              <div className="bg-[#0b1222] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px] rounded-full"></div>
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <ShieldCheck className="w-6 h-6 text-blue-400" />
                  <h4 className="text-sm font-black uppercase tracking-widest">ISO-9001 Grading Matrix</h4>
                </div>
                
                <div className="space-y-8 relative z-10">
                  {[
                    { key: 'performance', label: 'Performance', weight: '45%', desc: 'Result, Quality, Timeliness', basis: "Complexity based on Work Classification (e.g. Emergency=5.0) and System Status (-0.5 if not Operational)." },
                    { key: 'proficiency', label: 'Proficiency', weight: '35%', desc: 'Skills, Competency', basis: "Direct calculation based on Service & Safety Checklist completion: (Tasks Completed / 6) * 5." },
                    { key: 'professionalism', label: 'Professionalism', weight: '20%', desc: 'Behavior, Safety', basis: "Evaluated through Report Depth (Length/300) and Evidence Density (Attachments/3) + Base 2.0." }
                  ].map((cat) => (
                    <div key={cat.key} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p 
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-help" 
                            title={cat.basis}
                          >
                            {cat.label} ({cat.weight})
                          </p>
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{cat.desc}</p>
                        </div>
                        <span className="text-xl font-black text-blue-400">{(grading as any)[cat.key]}</span>
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button 
                            key={val} 
                            disabled={isReadOnly}
                            onClick={() => setGrading({...grading, [cat.key]: val})}
                            className={`flex-1 h-2 rounded-full transition-all ${val <= (grading as any)[cat.key] ? 'bg-blue-600' : 'bg-white/10'} ${isReadOnly ? 'cursor-default' : ''}`}
                          ></button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 pt-10 border-t border-white/5 space-y-6">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recorded Score</p>
                    <p className="text-5xl font-black text-emerald-400 tracking-tighter">{calculatedScore.final}%</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-6 flex justify-between items-center border border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Incentive Yield</p>
                    <p className="text-sm font-black text-blue-400 uppercase tracking-tight">{calculatedScore.incentivePct * 100}% Applied</p>
                  </div>
                </div>
              </div>

              {!isReadOnly && (
                <>
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supervisor Justification</p>
                     <textarea className="w-full bg-slate-50 rounded-2xl p-6 text-sm font-medium outline-none min-h-[100px] border border-slate-200" placeholder="Required for overriding or rejecting..." value={overrideReason} onChange={e => setOverrideReason(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <button onClick={() => handleAction('APPROVE')} className="w-full py-5 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"><CheckCircle2 className="w-4 h-4" /> Finalize Validation</button>
                    <button onClick={() => handleAction('REJECT')} className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all">Reject Submission</button>
                  </div>
                </>
              )}
              {isReadOnly && (
                <button onClick={() => setCurrentPage('queue')} className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all">Return to Registry</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const currentView = () => {
    switch (currentPage) {
      case 'dashboard': return renderDashboard();
      case 'queue': return renderQueue();
      case 'team': return renderTeam();
      case 'validation': return renderValidation();
      case 'reports': return <div className="p-20 text-center text-slate-400 text-xs font-black uppercase tracking-widest">Reports Module Operational</div>;
      default: return renderDashboard();
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 pb-12">
      {showFeedback && (
        <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right-full fade-in duration-500">
          <div className="bg-[#0b1222] text-white px-6 py-4 rounded-[1.5rem] shadow-2xl border border-emerald-500/30 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg"><CheckCircle2 className="w-6 h-6 text-white" /></div>
            <div><p className="text-[11px] font-black uppercase tracking-widest mb-1">Status Update</p><p className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">{feedbackMsg}</p></div>
          </div>
        </div>
      )}
      <div className="w-full md:w-64 shrink-0 space-y-4">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
          <div className="pb-6 border-b border-slate-50 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">{user.name.charAt(0)}</div>
            <div><p className="text-xs font-black text-slate-900">{user.name}</p><p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Supervisor</p></div>
          </div>
          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Main Command', icon: LayoutDashboard },
              { id: 'queue', label: 'Registry', icon: ListTodo, badge: pendingTransmissions.length },
              { id: 'team', label: 'Unit Matrix', icon: Users }
            ].map(item => (
              <button 
                key={item.id} 
                onClick={() => {
                  setCurrentPage(item.id as Page);
                  if (item.id === 'queue') setQueueTab('pending');
                }} 
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === item.id ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <div className="flex items-center gap-3"><item.icon className="w-4 h-4" /> {item.label}</div>
                {item.badge ? <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded-md text-[8px]">{item.badge}</span> : null}
              </button>
            ))}
          </nav>
        </div>
      </div>
      <div className="flex-grow">
        <header className="mb-8 space-y-1"><h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{currentPage === 'dashboard' ? 'Unit Overview' : currentPage === 'queue' ? 'Registry Management' : currentPage === 'team' ? 'Unit Matrix' : 'Secure Terminal'}</h1><p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">{user.department} Controller Node</p></header>
        {currentView()}
      </div>
    </div>
  );
};

export default SupervisorDashboard;