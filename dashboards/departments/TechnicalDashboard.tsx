import React, { useState, useMemo, useRef } from 'react';
import { User, Transmission, SystemStats, Announcement } from '../../types';
import { 
  Activity, CheckCircle2, Clock, Briefcase, MapPin, 
  FileCheck, ChevronRight, Info, ChevronLeft, ShieldCheck, Zap, 
  CheckCircle, Wrench, Upload, FileImage, 
  File as FileIcon, X, Eye, Trophy, TrendingUp, AlertCircle, Megaphone, Sparkles
} from 'lucide-react';

interface Props {
  user: User;
  validatedStats?: SystemStats;
  pendingTransmissions: Transmission[];
  transmissionHistory: Transmission[];
  announcements: Announcement[];
  onTransmit: (t: Transmission) => void;
}

const CLASSIFICATIONS = [
  { name: 'Installation', description: 'Complete hardware deployment and commissioning of new system nodes.' },
  { name: 'Preventive Maintenance', description: 'Scheduled calibration, inspection, and health-checks.' },
  { name: 'Reactive Repair', description: 'Urgent restoration of node functionality following failures.' },
  { name: 'Emergency Response', description: 'High-priority tactical intervention for critical outages.' },
  { name: 'Site Survey', description: 'Environmental and structural analysis for prospective expansion.' }
];

const CHECKLIST_CONTENT: Record<string, string[]> = {
  'Installation': [
    'Hardware Mounting Secure', 'Cable Routing Compliance', 'Initial Power-On Test', 
    'Signal Strength Validation', 'PPE Compliance Verified', 'Work Area Hazard Sweep'
  ],
  'Preventive Maintenance': [
    'Voltage Levels Verified', 'Connectivity Stability Check', 'Firmware Integrity Audit', 
    'Physical Wear Inspection', 'PPE Compliance Verified', 'Work Area Hazard Sweep'
  ],
  'Reactive Repair': [
    'Fault Root Cause Identified', 'Component Replacement Done', 'Functional Restoration Test', 
    'Worksite Hazard Clearance', 'PPE Compliance Verified', 'Work Area Hazard Sweep'
  ],
  'Emergency Response': [
    'Critical System Bypass', 'Emergency Power Restoration', 'Secure Data Recovery Init', 
    'Incident Severity Logged', 'PPE Compliance Verified', 'Work Area Hazard Sweep'
  ],
  'Site Survey': [
    'Structural Dimension Audit', 'Signal Obstruction Check', 'Power Source Availability', 
    'Environmental Risk Analysis', 'PPE Compliance Verified', 'Work Area Hazard Sweep'
  ]
};

const TechnicalDashboard: React.FC<Props> = ({ user, validatedStats, pendingTransmissions, transmissionHistory, announcements, onTransmit }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeInputRef = useRef<HTMLInputElement>(null);
  const endTimeInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    jobId: '',
    clientSite: '',
    jobType: 'Installation',
    startTime: '',
    endTime: '',
    systemStatus: 'Operational',
    projectReport: '', 
    attachments: [] as { name: string, type: string, size: string }[], 
    pmChecklist: { task1: false, task2: false, task3: false, task4: false, task5: false, task6: false } as Record<string, boolean>,
  });

  const isStep1Complete = formData.jobId && formData.clientSite && formData.startTime && formData.endTime;
  const isStep3Complete = formData.projectReport.length > 20 && formData.attachments.length > 0;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).map((f: File) => ({
        name: f.name,
        type: f.type,
        size: (f.size / 1024).toFixed(1) + ' KB'
      }));
      setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (ref.current) {
      ref.current.focus();
      try {
        if (typeof (ref.current as any).showPicker === 'function') {
          (ref.current as any).showPicker();
        } else {
          ref.current.click();
        }
      } catch (e) {
        ref.current.click();
      }
    }
  };

  const calculateAutomaticGrades = () => {
    const complexityScores: Record<string, number> = {
      'Emergency Response': 5.0, 'Reactive Repair': 4.5, 'Installation': 4.5, 
      'Preventive Maintenance': 4.0, 'Site Survey': 4.0
    };
    let perf = complexityScores[formData.jobType] || 4.0;
    if (formData.systemStatus !== 'Operational') perf -= 0.5;

    const checkedCount = Object.values(formData.pmChecklist).filter(v => v).length;
    const prof = Math.min(5, (checkedCount / 6) * 5);

    const reportScore = Math.min(2.5, (formData.projectReport.length / 300) * 2.5);
    const attachmentScore = Math.min(2.5, (formData.attachments.length / 3) * 2.5);
    const professionalism = Math.max(3.0, Math.min(5, reportScore + attachmentScore + 2.0));

    return {
      performance: parseFloat(perf.toFixed(1)),
      proficiency: parseFloat(prof.toFixed(1)),
      professionalism: parseFloat(professionalism.toFixed(1))
    };
  };

  const handleTransmit = () => {
    if (!isStep1Complete || !isStep3Complete) {
      alert("SYSTEM REJECTION: ISO Compliance Failure. Ensure Project Report (>20 chars) and Proof of Work (Attachments) are present.");
      return;
    }
    
    setIsTransmitting(true);
    const suggestedGrades = calculateAutomaticGrades();
    
    const transmission: Transmission = {
      id: `TX-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      userId: user.id, userName: user.name, timestamp: new Date().toISOString(),
      responseTime: '312ms', accuracy: '100%', uptime: '100%',
      jobId: formData.jobId, clientSite: formData.clientSite, jobType: formData.jobType, 
      systemStatus: formData.systemStatus, projectReport: formData.projectReport, 
      attachments: formData.attachments,
      ratings: {
        ...suggestedGrades, finalScore: 0, incentivePct: 0
      }
    };

    setTimeout(() => {
      onTransmit(transmission);
      setIsTransmitting(false);
      setShowSuccess(true);
      setActiveStep(1);
      setFormData({
        jobId: '', clientSite: '', jobType: 'Installation', startTime: '', endTime: '',
        systemStatus: 'Operational', projectReport: '', attachments: [],
        pmChecklist: { task1: false, task2: false, task3: false, task4: false, task5: false, task6: false } as Record<string, boolean>,
      });
      setTimeout(() => setShowSuccess(false), 4000);
    }, 2000);
  };

  const hasUserPending = useMemo(() => pendingTransmissions.some(t => t.userId === user.id), [pendingTransmissions, user.id]);

  const mySubmissions = useMemo(() => {
    const pending = pendingTransmissions.filter(t => t.userId === user.id);
    const history = transmissionHistory.filter(t => t.userId === user.id);
    return [...pending, ...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [pendingTransmissions, transmissionHistory, user.id]);
  
  const isValidated = !!validatedStats?.ratings;
  const score = validatedStats?.ratings?.finalScore || 0;
  const incentivePct = validatedStats?.ratings?.incentivePct || 0;
  const incentivePay = user.incentiveTarget * incentivePct;
  const dash = 251.2; 
  const offset = dash - (dash * (score / 100));

  const systemSuggestion = useMemo(() => {
    if (!isValidated || !validatedStats?.ratings) return null;
    const { performance, proficiency, professionalism } = validatedStats.ratings;
    const scores = [
      { name: 'Performance', val: performance, suggest: "Focus on reducing field response times and optimizing task execution speed." },
      { name: 'Proficiency', val: proficiency, suggest: "Request advanced node calibration training to improve technical accuracy." },
      { name: 'Professionalism', val: professionalism, suggest: "Ensure all logs include high-fidelity proof-of-work per ISO standards." }
    ];
    const lowest = scores.sort((a, b) => a.val - b.val)[0];
    return lowest.val >= 4.5 ? "Exceptional metrics detected. Maintain technical excellence." : lowest.suggest;
  }, [isValidated, validatedStats]);

  const deptAnnouncements = useMemo(() => {
    return announcements
      .filter(a => a.department === user.department)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [announcements, user.department]);

  const currentChecklistLabels = useMemo(() => CHECKLIST_CONTENT[formData.jobType] || CHECKLIST_CONTENT['Installation'], [formData.jobType]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
      {showSuccess && (
        <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right-full fade-in duration-500">
          <div className="bg-[#0b1222] text-white px-6 py-4 rounded-[1.5rem] shadow-2xl border border-emerald-500/30 flex items-center gap-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <div><p className="text-[11px] font-black uppercase tracking-widest mb-1">Logs Transmitted</p><p className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">Archived for Review</p></div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md">TECHNICAL DEPT</span>
            <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-md italic">COMPLIANCE MODE</span>
          </div>
          <h1 className="text-[44px] font-black text-slate-900 tracking-tight leading-none uppercase">Field Log Terminal</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">Authorized ISO-9001 Data Entry Node</p>
        </div>
        <div className="hidden lg:flex items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm min-w-[300px]">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center"><Activity className="w-6 h-6 text-blue-600" /></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Network Status</p><p className="text-sm font-black text-slate-900 uppercase">Secure Node Connected</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in zoom-in-95 duration-700">
        <div className="lg:col-span-12 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          
          <div className="relative shrink-0 flex flex-col items-center">
             <svg className="w-48 h-48" viewBox="0 0 100 100">
               <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
               {isValidated ? (
                 <>
                   <circle cx="50" cy="50" r="40" fill="none" stroke="url(#blue-grad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" transform="rotate(-90 50 50)" />
                   <defs>
                     <linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                       <stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#3b82f6" />
                     </linearGradient>
                   </defs>
                   <text x="50" y="52" className="text-2xl font-black" textAnchor="middle" fill="#0f172a" dominantBaseline="middle">{score}%</text>
                 </>
               ) : hasUserPending ? (
                 <>
                   <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${dash/4} ${dash/2}`} className="animate-spin duration-[3s]" transform-origin="center" />
                   <foreignObject x="30" y="30" width="40" height="40">
                     <div className="w-full h-full flex items-center justify-center"><Clock className="w-8 h-8 text-blue-600 animate-pulse" /></div>
                   </foreignObject>
                 </>
               ) : (
                 <>
                   <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeDasharray="4 4" />
                   <foreignObject x="30" y="30" width="40" height="40">
                     <div className="w-full h-full flex items-center justify-center"><AlertCircle className="w-8 h-8 text-slate-300" /></div>
                   </foreignObject>
                 </>
               )}
             </svg>
             <p className="mt-4 text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">{isValidated ? 'Final Score' : hasUserPending ? 'Pending Audit' : 'Standby Mode'}</p>
          </div>

          <div className="flex-grow space-y-8">
            <div className="flex items-center gap-4">
              <Trophy className={`w-8 h-8 ${isValidated ? 'text-amber-500' : 'text-slate-200'}`} />
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Performance Scorecard</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  {isValidated ? (
                    <span className="flex flex-wrap items-center gap-x-2">
                      <span className="text-emerald-500">Validated by Supervisor Registry</span>
                      <span className="w-1.5 h-1.5 bg-slate-200 rounded-full hidden md:block"></span>
                      <span className="text-blue-600 flex items-center gap-1 normal-case font-semibold italic tracking-normal">
                        <Sparkles className="w-3 h-3" /> AI 2000: {systemSuggestion}
                      </span>
                    </span>
                  ) : hasUserPending ? 'Currently Under Hierarchy Review' : 'Waiting for Initial Transmission'}
                </p>
              </div>
            </div>

            {isValidated && validatedStats?.ratings ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Performance', score: validatedStats.ratings.performance, weight: '45%', final: ((validatedStats.ratings.performance / 5) * 45).toFixed(1) + '%' },
                  { label: 'Proficiency', score: validatedStats.ratings.proficiency, weight: '35%', final: ((validatedStats.ratings.proficiency / 5) * 35).toFixed(1) + '%' },
                  { label: 'Professionalism', score: validatedStats.ratings.professionalism, weight: '20%', final: ((validatedStats.ratings.professionalism / 5) * 20).toFixed(1) + '%' }
                ].map((row, i) => (
                  <div key={i} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{row.label}</p>
                       <span className="text-blue-600 font-black text-xs">{row.score}/5</span>
                    </div>
                    <div className="flex items-end gap-1"><p className="text-xl font-black text-slate-900">{row.final}</p><p className="text-[8px] font-bold text-slate-400 uppercase mb-1">of {row.weight}</p></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50/80 rounded-[2.5rem] p-10 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                 <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{hasUserPending ? 'Your field logs are being audited for ISO-9001 compliance' : 'No operational data found for the current cycle'}</p>
                 <p className="text-[10px] font-medium text-slate-400 max-w-md leading-relaxed italic">{hasUserPending ? 'Please wait for the Supervisor node to commit your grading matrix.' : 'Initiate a log transmission using the Terminal below to activate your performance grading.'}</p>
              </div>
            )}
          </div>

          <div className="shrink-0 bg-[#0b1222] rounded-[2.5rem] p-10 text-white min-w-[280px] shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full"></div>
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3"><TrendingUp className={`w-5 h-5 ${isValidated ? 'text-emerald-400' : 'text-slate-600'}`} /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Incentive Pay</p></div>
                <p className={`text-4xl font-black tracking-tighter ${isValidated ? 'text-emerald-400' : 'text-slate-700'}`}>₱{isValidated ? incentivePay.toLocaleString() : '0.00'}</p>
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500"><span>Eligibility Range</span><span>{isValidated ? (incentivePct * 100) + '%' : 'TBD'} Yield</span></div>
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-300"><span>Target Cap</span><span>₱{user.incentiveTarget.toLocaleString()}</span></div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-visible flex flex-col min-h-[650px]">
            <div className="bg-slate-50 p-6 flex items-center justify-between border-b border-slate-100 rounded-t-[2.5rem]">
               <div className="flex items-center gap-4">
                {[{ id: 1, label: 'Core' }, { id: 2, label: 'Service' }, { id: 3, label: 'Evidence' }, { id: 4, label: 'Broadcast' }].map(s => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] transition-all ${activeStep === s.id ? 'bg-blue-600 text-white shadow-lg scale-110' : (activeStep > s.id ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 border border-slate-200')}`}>
                      {activeStep > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest hidden md:inline ${activeStep === s.id ? 'text-slate-900' : 'text-slate-300'}`}>{s.label}</span>
                    {s.id < 4 && <div className="w-4 h-px bg-slate-200 ml-2 hidden md:block"></div>}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg"><ShieldCheck className="w-3 h-3" /><p className="text-[9px] font-black uppercase tracking-widest">ISO Secure</p></div>
            </div>

            <div className="flex-grow p-10 space-y-8">
              {activeStep === 1 && (
                <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-500">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Order ID *</label><div className="relative"><Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /><input type="text" placeholder="WO-XXXXX" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-black" value={formData.jobId} onChange={e => setFormData({...formData, jobId: e.target.value})} /></div></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Site Address *</label><div className="relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" /><input type="text" placeholder="Location" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-black" value={formData.clientSite} onChange={e => setFormData({...formData, clientSite: e.target.value})} /></div></div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classification</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {CLASSIFICATIONS.map(c => (
                        <div key={c.name} className="relative group">
                          <button onClick={() => setFormData({...formData, jobType: c.name, pmChecklist: { task1: false, task2: false, task3: false, task4: false, task5: false, task6: false }})} className={`w-full text-left px-5 py-4 border rounded-[1.5rem] font-bold text-xs transition-all flex justify-between items-center ${formData.jobType === c.name ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-white hover:border-blue-500 hover:shadow-md'}`}>
                            <span className="uppercase tracking-tight truncate pr-2">{c.name}</span><Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 cursor-pointer hover:scale-110 transition-transform z-10" onClick={() => openPicker(startTimeInputRef)} />
                        <input ref={startTimeInputRef} type="datetime-local" onClick={() => openPicker(startTimeInputRef)} onFocus={() => openPicker(startTimeInputRef)} onKeyDown={(e) => { if (e.key !== 'Tab') e.preventDefault(); }} className={`w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-20 ${formData.startTime ? 'text-black' : 'text-slate-400'}`} value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Time</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 cursor-pointer hover:scale-110 transition-transform z-10" onClick={() => openPicker(endTimeInputRef)} />
                        <input ref={endTimeInputRef} type="datetime-local" onClick={() => openPicker(endTimeInputRef)} onFocus={() => openPicker(endTimeInputRef)} onKeyDown={(e) => { if (e.key !== 'Tab') e.preventDefault(); }} className={`w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-20 ${formData.endTime ? 'text-black' : 'text-slate-400'}`} value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeStep === 2 && (
                <div className="space-y-8 animate-in slide-in-from-left-4 fade-in duration-500">
                  <div className="p-10 bg-blue-50/50 border border-blue-100 rounded-[2.5rem] space-y-6">
                    <div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg"><Wrench className="w-6 h-6 text-white" /></div><div><h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Service & Safety Verification</h3><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Compliance Checklist for {formData.jobType}</p></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentChecklistLabels.map((label, idx) => {
                        const key = `task${idx + 1}`;
                        const value = (formData.pmChecklist as any)[key];
                        return (
                          <label key={key} className={`flex items-center gap-4 cursor-pointer p-4 rounded-2xl border transition-all ${value ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${value ? 'bg-blue-600 text-white' : 'bg-white border-2 border-slate-200'}`}>{value && <CheckCircle className="w-4 h-4" />}</div>
                            <input type="checkbox" className="hidden" checked={value} onChange={e => setFormData({...formData, pmChecklist: {...formData.pmChecklist, [key]: e.target.checked}})} />
                            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Final Node Health</label>
                    <div className="flex gap-4">
                      {['Operational', 'Degraded', 'Critical'].map(status => (
                        <button key={status} onClick={() => setFormData({...formData, systemStatus: status})} className={`flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.systemStatus === status ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-white hover:border-blue-500 hover:shadow-md'}`}>{status}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeStep === 3 && (
                <div className="space-y-8 animate-in slide-in-from-left-4 fade-in duration-500">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Report *</label><span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${formData.projectReport.length > 20 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{formData.projectReport.length > 20 ? 'Req. Met' : 'Min 20 chars'}</span></div>
                    <textarea placeholder="Detailed summary of operations..." className="w-full h-48 bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-sm font-medium text-slate-700 outline-none focus:border-blue-500" value={formData.projectReport} onChange={e => setFormData({...formData, projectReport: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proof (PDF/PNG/JPG) *</label>
                    <div onClick={() => fileInputRef.current?.click()} className="group cursor-pointer p-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 hover:bg-blue-50 hover:border-blue-300">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><Upload className="w-8 h-8 text-blue-600" /></div>
                      <div className="text-center"><p className="text-sm font-black text-slate-900 uppercase">Upload evidence</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ISO-9001 Compliance</p></div>
                      <input ref={fileInputRef} type="file" className="hidden" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileSelect} />
                    </div>
                    {formData.attachments.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {formData.attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm"><div className="flex items-center gap-3">{file.type.includes('image') ? <FileImage className="w-4 h-4 text-blue-500" /> : <FileIcon className="w-4 h-4 text-slate-400" />}<p className="text-[9px] font-black text-slate-900 truncate uppercase">{file.name}</p></div><button onClick={() => removeFile(idx)} className="text-slate-300 hover:text-red-500"><X className="w-3 h-3" /></button></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeStep === 4 && (
                <div className="flex flex-col items-center justify-center py-10 space-y-10 animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-pulse"><FileCheck className="w-12 h-12 text-white" /></div>
                  <div className="text-center space-y-3"><h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">ISO-9001 Verification Ready</h3><p className="text-slate-400 text-sm font-medium">Logs compiled for hierarchical audit.</p></div>
                  <div className="w-full max-sm bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem] space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest"><span className="text-slate-400">Integrity</span><span className="text-emerald-500">Certified</span></div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest"><span className="text-slate-400">Node</span><span className="text-blue-600">{user.name}</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-6 flex items-center justify-between border-t border-slate-100 rounded-b-[2.5rem]">
              <button onClick={() => setActiveStep(prev => Math.max(1, prev - 1))} disabled={activeStep === 1} className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeStep === 1 ? 'opacity-0' : 'text-slate-400 hover:text-slate-900'}`}><ChevronLeft className="w-4 h-4" /> Previous</button>
              {activeStep < 4 ? (
                <button onClick={() => setActiveStep(prev => prev + 1)} disabled={(activeStep === 1 && !isStep1Complete) || (activeStep === 3 && !isStep3Complete)} className={`flex items-center gap-2 px-10 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all ${((activeStep === 1 && isStep1Complete) || (activeStep === 2) || (activeStep === 3 && isStep3Complete)) ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Continue <ChevronRight className="w-4 h-4" /></button>
              ) : (
                <button onClick={handleTransmit} disabled={isTransmitting} className="bg-blue-600 text-white px-12 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 flex items-center gap-3">{isTransmitting ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} {isTransmitting ? 'Broadcasting...' : 'Broadcast Logs'}</button>
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0b1222] rounded-[3rem] p-10 h-full shadow-2xl text-white relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
            <Megaphone className="w-16 h-16 text-blue-500 mb-8 animate-pulse" />
            <h3 className="text-2xl font-black uppercase tracking-widest mb-2">Unit Broadcast</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-12 italic">Supervisor Directives</p>
            <div className="w-full flex-grow overflow-y-auto custom-scrollbar pr-1 max-h-[300px]">
              {deptAnnouncements.length === 0 ? (
                <div className="text-center py-10 opacity-30 border-2 border-dashed border-white/10 rounded-3xl"><p className="text-[10px] font-black uppercase tracking-widest">No active directives found.</p></div>
              ) : (
                <div className="space-y-4">
                  {deptAnnouncements.map(ann => (
                    <div key={ann.id} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-3 hover:bg-white/10 transition-colors">
                      <p className="text-sm font-medium text-slate-300 leading-relaxed italic">"{ann.message}"</p>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5"><span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{ann.senderName}</span><span className="text-[8px] font-bold text-slate-500 uppercase">{new Date(ann.timestamp).toLocaleDateString()}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 w-full space-y-3 pt-6 border-t border-white/5">
               <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">My Log History</p><span className="text-[8px] font-black bg-blue-600 px-1.5 py-0.5 rounded uppercase">{mySubmissions.length} Entries</span></div>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                     {mySubmissions.length === 0 ? (
                       <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest text-center py-4">No submissions recorded.</p>
                     ) : (
                       mySubmissions.map(sub => (
                         <div key={sub.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <div className="overflow-hidden pr-2">
                               <p className="text-[9px] font-black text-blue-400 truncate uppercase tracking-tight">{sub.id}</p>
                               <p className="text-[7px] font-bold text-slate-500 uppercase">{new Date(sub.timestamp).toLocaleDateString()}</p>
                               {sub.supervisorComment && <p className="text-[7px] text-slate-400 italic mt-1 line-clamp-2 leading-tight">"{sub.supervisorComment}"</p>}
                            </div>
                            <span className={`shrink-0 text-[7px] font-black px-1.5 py-0.5 rounded uppercase shadow-sm h-fit ${sub.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : sub.status === 'validated' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'}`}>{sub.status || 'Pending'}</span>
                         </div>
                       ))
                     )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalDashboard;