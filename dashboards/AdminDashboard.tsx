import React, { useRef, useEffect, useState, useMemo } from 'react';
import { User, AuditEntry, UserRole } from '../types';
import { jsPDF } from 'jspdf';
import { 
  Settings, 
  Terminal, 
  CircleDollarSign, 
  Download,
  CheckCircle2,
  Users,
  Plus,
  Share2,
  X,
  UserPlus,
  ChevronDown,
  Save,
  Scale,
  Percent,
  Calculator,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface Props {
  user: User;
  auditLogs: AuditEntry[];
  onAddAuditEntry: (action: string, details: string, type?: 'INFO' | 'OK' | 'WARN', userName?: string) => void;
}

const INITIAL_DEPARTMENTS = ['Technical', 'Sales', 'Marketing', 'Admin', 'Accounting'];
const ADMIN_VERIFICATION_KEY = "SECURE-AA2000";
const DEFAULT_NODE_PASSKEY = "12345";

const AdminDashboard: React.FC<Props> = ({ user, auditLogs, onAddAuditEntry }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const deptTabsRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', detail: '' });
  
  const [availableDepts, setAvailableDepts] = useState<string[]>(() => {
    const saved = localStorage.getItem('aa2001_admin_depts');
    const depts = saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
    return depts.map((d: string) => d === 'Purchasing' ? 'Accounting' : d);
  });

  const [usersByDept, setUsersByDept] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('aa2001_admin_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_DEPARTMENTS.reduce((acc, dept) => ({ ...acc, [dept]: [] }), {});
      }
    }
    return INITIAL_DEPARTMENTS.reduce((acc, dept) => ({ ...acc, [dept]: [] }), {});
  });

  const [gradingConfig, setGradingConfig] = useState(() => {
    const saved = localStorage.getItem('aa2001_grading_config');
    return saved ? JSON.parse(saved) : {
      perfWeight: 45,
      profWeight: 35,
      behWeight: 20
    };
  });

  const [activeDept, setActiveDept] = useState<string>('Technical');
  const [transferringNode, setTransferringNode] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [editingNode, setEditingNode] = useState<{ originalName: string, name: string, role: UserRole } | null>(null);

  const [registryVersion, setRegistryVersion] = useState(0);

  const roleMap = useMemo(() => {
    const regRaw = localStorage.getItem('aa2001_credential_registry');
    if (!regRaw) return {};
    try {
      const registry = JSON.parse(regRaw);
      return registry.reduce((acc: Record<string, string>, u: any) => ({ 
        ...acc, 
        [u.name]: u.role 
      }), {});
    } catch (e) {
      return {};
    }
  }, [usersByDept, isProvisioning, editingNode, registryVersion]);

  useEffect(() => {
    localStorage.setItem('aa2001_admin_depts', JSON.stringify(availableDepts));
  }, [availableDepts]);

  useEffect(() => {
    localStorage.setItem('aa2001_admin_users', JSON.stringify(usersByDept));
  }, [usersByDept]);

  useEffect(() => {
    localStorage.setItem('aa2001_grading_config', JSON.stringify(gradingConfig));
  }, [gradingConfig]);

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  useEffect(() => {
    if (isAtBottom) scrollToBottom();
  }, [auditLogs, isAtBottom]);

  const triggerToast = (title: string, detail: string) => {
    setToastMessage({ title, detail });
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  const handleOpenEdit = (userName: string) => {
    const currentRole = roleMap[userName] as UserRole || UserRole.EMPLOYEE;
    setEditingNode({ originalName: userName, name: userName, role: currentRole });
  };

  const handleSaveEdit = () => {
    if (!editingNode || !editingNode.name.trim()) return;
    const { originalName, name, role } = editingNode;
    const trimmedName = name.trim();

    setUsersByDept(prev => ({
      ...prev,
      [activeDept]: (prev[activeDept] || []).map(u => u === originalName ? trimmedName : u)
    }));

    const regRaw = localStorage.getItem('aa2001_credential_registry');
    if (regRaw) {
      const reg = JSON.parse(regRaw);
      const updatedReg = reg.map((u: any) => 
        u.name === originalName ? { ...u, name: trimmedName, role: role } : u
      );
      localStorage.setItem('aa2001_credential_registry', JSON.stringify(updatedReg));
      setRegistryVersion(v => v + 1);
    }

    onAddAuditEntry('ADMIN_OVERRIDE', `Modified node: ${originalName} -> ${trimmedName} (${role})`, 'OK');
    triggerToast('Node Updated', `Changes committed for ${trimmedName}`);
    setEditingNode(null);
  };

  const handleExecuteTransfer = (userName: string, targetDept: string) => {
    if (!userName) return;
    
    let sourceDept = activeDept;
    Object.keys(usersByDept).forEach(dept => {
      if (usersByDept[dept].includes(userName)) {
        sourceDept = dept;
      }
    });

    if (sourceDept === targetDept) return;
    
    setUsersByDept(prev => {
      const sourceUsers = (prev[sourceDept] || []).filter(u => u !== userName);
      const targetUsers = [...(prev[targetDept] || []), userName];
      return { ...prev, [sourceDept]: sourceUsers, [targetDept]: targetUsers };
    });
    
    const regRaw = localStorage.getItem('aa2001_credential_registry');
    if (regRaw) {
      const reg = JSON.parse(regRaw);
      const updatedReg = reg.map((u: any) => u.name === userName ? { ...u, department: targetDept } : u);
      localStorage.setItem('aa2001_credential_registry', JSON.stringify(updatedReg));
      setRegistryVersion(v => v + 1);
    }

    onAddAuditEntry('ADMIN_TRANSFER', `Transferred ${userName} from ${sourceDept} to ${targetDept}`, 'INFO');
    setTransferringNode(null);
    triggerToast('Node Transfered', `${userName} re-routed to ${targetDept} registry.`);
  };

  const handleCommitProvision = () => {
    if (newEmployeeName && newEmployeeName.trim()) {
      const trimmed = newEmployeeName.trim();
      setUsersByDept(prev => ({
        ...prev,
        [activeDept]: [...(prev[activeDept] || []), trimmed]
      }));
      const regRaw = localStorage.getItem('aa2001_credential_registry');
      const registry = regRaw ? JSON.parse(regRaw) : [];
      registry.push({
        name: trimmed,
        password: DEFAULT_NODE_PASSKEY,
        department: activeDept,
        role: newEmployeeRole
      });
      localStorage.setItem('aa2001_credential_registry', JSON.stringify(registry));
      setRegistryVersion(v => v + 1);
      
      onAddAuditEntry('ADMIN_PROVISION', `New node provisioned: ${trimmed} (${newEmployeeRole}) in ${activeDept}`, 'OK');
      triggerToast('Node Provisioned', `${trimmed} established in core.`);
      setNewEmployeeName('');
      setIsProvisioning(false);
    }
  };

  const handleAddDepartment = () => {
    const newDeptName = window.prompt("ENTER NEW DEPARTMENT DESIGNATION:");
    if (!newDeptName || !newDeptName.trim()) return;
    const adminKey = window.prompt("ENTER ENCRYPTED ADMIN AUTHORIZATION KEY:");
    if (adminKey === ADMIN_VERIFICATION_KEY) {
      setAvailableDepts(prev => [...prev, newDeptName.trim()]);
      setUsersByDept(prev => ({ ...prev, [newDeptName.trim()]: [] }));
      onAddAuditEntry('ADMIN_CONFIG', `Structural update: New department "${newDeptName.trim()}" created`, 'OK');
      triggerToast('Core Updated', `New unit provisioned.`);
    } else {
      onAddAuditEntry('ADMIN_CONFIG', `Denied attempt to create department "${newDeptName.trim()}": Invalid Auth Key`, 'WARN');
    }
  };

  const handleExportLogs = () => {
    try {
      const doc = new jsPDF();
      const margin = 20;
      let y = 25;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("AA2000 SECURITY AND TECHNOLOGY SOLUTIONS INC.", margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.text("ISO-9001 AUDIT TRAIL REPORT", margin, y);
      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Date Generated: ${new Date().toLocaleString()}`, margin, y);
      y += 5;
      doc.text(`Authorizing Admin: ${user.name}`, margin, y);
      y += 5;
      doc.text(`Report Hash: ${Math.random().toString(36).substring(2, 15).toUpperCase()}`, margin, y);
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.text("TIMESTAMP", margin, y);
      doc.text("ACTION", margin + 35, y);
      doc.text("OPERATOR", margin + 70, y);
      doc.text("DETAILS", margin + 110, y);
      y += 4;
      doc.line(margin, y, 190, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      auditLogs.forEach((log) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        doc.text(timestamp, margin, y);
        doc.text(log.action, margin + 35, y);
        doc.text(log.user, margin + 70, y);
        const splitDetails = doc.splitTextToSize(log.details, 70);
        doc.text(splitDetails, margin + 110, y);
        y += (splitDetails.length * 4) + 4;
      });
      if (y > 260) { doc.addPage(); y = 20; }
      y += 10;
      doc.setFont("helvetica", "bolditalic");
      doc.text("END OF REPORT - CONFIDENTIAL DATA - ISO COMPLIANT", margin, y);
      doc.save(`AA2000_AuditLog_${new Date().toISOString().split('T')[0]}.pdf`);
      onAddAuditEntry('ADMIN_EXPORT', 'ISO-9001 Audit Trail exported as binary PDF', 'INFO');
      triggerToast('Audit Export', 'ISO-9001 Logs compiled as valid PDF and downloaded.');
    } catch (error) {
      console.error("PDF Generation failed:", error);
      onAddAuditEntry('ADMIN_EXPORT_FAIL', 'Failed to generate binary PDF audit trail', 'WARN');
    }
  };

  const handleResetWeights = () => {
    setGradingConfig({
      perfWeight: 45,
      profWeight: 35,
      behWeight: 20
    });
    onAddAuditEntry('ADMIN_CONFIG', 'Grading coefficients reset to system standard defaults (45/35/20)', 'INFO');
    triggerToast('Protocol Reset', 'Grading weights restored to ISO-standard.');
  };

  const totalWeight = gradingConfig.perfWeight + gradingConfig.profWeight + gradingConfig.behWeight;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
      
      {editingNode && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl border border-slate-100 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="flex justify-between items-center relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Manage Node</h3>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Administrative Override</p>
                </div>
              </div>
              <button onClick={() => setEditingNode(null)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6 relative">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rename Identity</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all"
                  value={editingNode.name}
                  onChange={(e) => setEditingNode({...editingNode, name: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Designation</label>
                <div className="relative">
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 appearance-none cursor-pointer"
                    value={editingNode.role}
                    onChange={(e) => setEditingNode({...editingNode, role: e.target.value as UserRole})}
                  >
                    {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 relative">
              <button 
                onClick={handleSaveEdit}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
              >
                <Save className="w-4 h-4" />
                Commit Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportSuccess && (
        <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right-full fade-in duration-500">
          <div className="bg-[#0b1222] text-white px-6 py-4 rounded-[1.5rem] shadow-2xl border border-emerald-500/30 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">{toastMessage.title}</p>
              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">{toastMessage.detail}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#2563eb] text-white text-[10px] font-black uppercase tracking-widest rounded-md">3P CERTIFIED SYSTEM</span>
            <span className="px-3 py-1 bg-[#0f172a] text-white text-[10px] font-black uppercase tracking-widest rounded-md">LEVEL: ADMIN</span>
          </div>
          <h1 className="text-[40px] font-black text-[#1e293b] tracking-tight leading-none">Administrative Core Console</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Personnel: <span className="text-blue-600 font-bold">{user.name}</span> • Status: <span className="text-[#1e293b] font-bold">Privileged Connection</span></p>
        </div>

        <button 
          onClick={handleExportLogs}
          className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 min-w-[220px] hover:bg-slate-50 transition-colors"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ISO AUDIT</p>
            <p className="text-sm font-black text-[#1e293b] tracking-tight">EXPORT LOGS (PDF)</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1e293b] uppercase tracking-widest leading-none mb-1">Node Registry</h3>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Personnel Allocation</p>
                </div>
              </div>
              <button onClick={handleAddDepartment} className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-all flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Add Dept</span>
              </button>
            </div>

            <div ref={deptTabsRef} className="flex gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-slate-50 mb-8">
              {availableDepts.map(dept => (
                <button
                  key={dept}
                  onClick={() => setActiveDept(dept)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    activeDept === dept ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {dept} <span className="ml-2 opacity-50">{(usersByDept[dept] || []).length}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Personnel</p>
                <button onClick={() => setIsProvisioning(true)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                  <UserPlus className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Provision New</span>
                </button>
              </div>

              {isProvisioning && (
                <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem] flex flex-col gap-4 animate-in slide-in-from-top-2">
                  <div className="flex flex-col md:flex-row gap-4">
                    <input 
                      type="text"
                      placeholder="Enter Full Name"
                      className="flex-grow bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none"
                      value={newEmployeeName}
                      onChange={(e) => setNewEmployeeName(e.target.value)}
                    />
                    <select 
                      className="bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none"
                      value={newEmployeeRole}
                      onChange={(e) => setNewEmployeeRole(e.target.value as UserRole)}
                    >
                      <option value={UserRole.EMPLOYEE}>Employee</option>
                      <option value={UserRole.SUPERVISOR}>Supervisor</option>
                      <option value={UserRole.DEPT_HEAD}>Dept Head</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setIsProvisioning(false)} className="px-4 py-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">Cancel</button>
                    <button onClick={handleCommitProvision} className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">Commit Node</button>
                  </div>
                </div>
              )}

              {(usersByDept[activeDept] || []).map((userName) => (
                <div 
                  key={userName} 
                  className="group flex items-center justify-between p-5 bg-slate-50/40 rounded-[2rem] hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-xs font-black text-blue-600 shadow-sm">
                      {userName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#1e293b]">
                        {userName} - {roleMap[userName] || "Employee"}
                      </p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NODE_ID: {btoa(userName).substring(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenEdit(userName)}
                      className="p-2.5 rounded-xl text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-all"
                      title="Manage Node"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setTransferringNode(transferringNode === userName ? null : userName)}
                        className={`p-2.5 rounded-xl transition-all ${transferringNode === userName ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-blue-500 hover:bg-blue-50'}`}
                        title="Route Node"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      {transferringNode === userName && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                          <p className="px-4 py-2 text-[8px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 mb-1">Transfer to Dept</p>
                          {availableDepts.filter(d => d !== activeDept).map(dept => (
                            <button
                              key={dept}
                              onClick={() => handleExecuteTransfer(userName, dept)}
                              className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors uppercase tracking-widest"
                            >
                              {dept}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 flex flex-col h-[600px]">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1e293b] uppercase tracking-widest leading-none mb-1">ISO-9001 Audit Trail</h3>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Real-time System Logs</p>
              </div>
            </div>
            <div ref={scrollRef} className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex gap-4 font-mono text-[10px]">
                  <span className="text-slate-400 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${log.type === 'OK' ? 'bg-emerald-100 text-emerald-700' : log.type === 'WARN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{log.action}</span>
                      <span className="text-slate-900 font-bold">{log.user}</span>
                    </div>
                    <p className="text-slate-500 leading-relaxed">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#0b1222] rounded-[3rem] p-10 shadow-2xl text-white relative overflow-hidden flex flex-col min-h-[800px]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[100px] rounded-full -mr-24 -mt-24"></div>
            
            <div className="flex items-center gap-4 mb-12 relative z-10">
              <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.1em] mb-1">GRADING PROTOCOL</h3>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">WEIGHTED COEFFICIENTS</p>
              </div>
            </div>

            <div className="space-y-10 relative z-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Performance (Result, Quality, Time)</p>
                    <span className="text-blue-400 text-xs font-black">{gradingConfig.perfWeight}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    className="w-full accent-blue-600 bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
                    value={gradingConfig.perfWeight}
                    onChange={(e) => setGradingConfig({...gradingConfig, perfWeight: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Proficiency (Skills, Competency)</p>
                    <span className="text-blue-400 text-xs font-black">{gradingConfig.profWeight}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    className="w-full accent-blue-600 bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
                    value={gradingConfig.profWeight}
                    onChange={(e) => setGradingConfig({...gradingConfig, profWeight: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Professionalism (Behavior, Safety)</p>
                    <span className="text-blue-400 text-xs font-black">{gradingConfig.behWeight}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    className="w-full accent-blue-600 bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
                    value={gradingConfig.behWeight}
                    onChange={(e) => setGradingConfig({...gradingConfig, behWeight: parseInt(e.target.value)})}
                  />
                </div>
                <div className={`flex justify-between items-center p-4 rounded-2xl border ${totalWeight === 100 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest">Total Weight Distribution</p>
                  <p className={`text-xl font-black ${totalWeight === 100 ? 'text-emerald-400' : 'text-red-400'}`}>{totalWeight}%</p>
                </div>
              </div>

              <button 
                onClick={handleResetWeights}
                className="w-full p-8 bg-blue-600/5 border border-blue-500/20 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 group hover:bg-blue-600/10 transition-all"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-[-180deg] transition-transform duration-500">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Standard Restore</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Reset weights to 45% | 35% | 20%</p>
                </div>
              </button>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Incentive Eligibility Tiers</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { range: '90-100%', pct: '100%' },
                    { range: '85-89%', pct: '75%' },
                    { range: '80-84%', pct: '50%' },
                    { range: '75-79%', pct: '25%' },
                    { range: 'Below 75%', pct: '0%' }
                  ].map((tier, i) => (
                    <div key={i} className="flex justify-between items-center px-4 py-2.5 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-400">{tier.range}</span>
                      <span className="text-blue-400">{tier.pct} Yield</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
                <div className="flex items-center gap-3 text-slate-500">
                  <ShieldCheck className="w-4 h-4" />
                  <p className="text-[8px] font-black uppercase tracking-widest">Configures Global Hierarchy Grading</p>
                </div>
                {totalWeight !== 100 && (
                  <p className="text-[9px] text-red-400 font-bold uppercase tracking-tight italic">Warning: Weight coefficients must sum to exactly 100%.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;