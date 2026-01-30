import React from 'react';
import { User, UserRole, Transmission, SystemStats, AuditEntry, Announcement } from '../types';
import EmployeeDashboard from '../dashboards/EmployeeDashboard';
import SupervisorDashboard from '../dashboards/SupervisorDashboard';
import DeptHeadDashboard from '../dashboards/DeptHeadDashboard';
import AdminDashboard from '../dashboards/AdminDashboard';
import ExecutiveDashboard from '../dashboards/ExecutiveDashboard';

interface DashboardProps {
  user: User;
  pendingTransmissions: Transmission[];
  transmissionHistory: Transmission[];
  validatedStats: Record<string, SystemStats>;
  auditLogs: AuditEntry[];
  announcements: Announcement[];
  onTransmit: (t: Transmission) => void;
  onValidate: (id: string, overrides?: SystemStats, status?: 'validated' | 'rejected') => void;
  onPostAnnouncement: (message: string) => void;
  onDeleteAnnouncement: (id: string) => void;
  onAddAuditEntry: (action: string, details: string, type?: 'INFO' | 'OK' | 'WARN', userName?: string) => void;
  onDeleteUser: (userId: string, userName: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  pendingTransmissions, 
  transmissionHistory,
  validatedStats, 
  auditLogs,
  announcements,
  onTransmit, 
  onValidate,
  onPostAnnouncement,
  onDeleteAnnouncement,
  onAddAuditEntry,
  onDeleteUser
}) => {
  switch (user.role) {
    case UserRole.EMPLOYEE:
      return (
        <EmployeeDashboard 
          user={user} 
          validatedStats={validatedStats[user.id]} 
          pendingTransmissions={pendingTransmissions}
          transmissionHistory={transmissionHistory}
          announcements={announcements}
          onTransmit={onTransmit} 
        />
      );
    case UserRole.SUPERVISOR:
      return (
        <SupervisorDashboard 
          user={user} 
          pendingTransmissions={pendingTransmissions} 
          transmissionHistory={transmissionHistory}
          announcements={announcements}
          onValidate={onValidate} 
          onAddAuditEntry={onAddAuditEntry}
          onPostAnnouncement={onPostAnnouncement}
          onDeleteAnnouncement={onDeleteAnnouncement}
        />
      );
    case UserRole.DEPT_HEAD:
      return <DeptHeadDashboard user={user} validatedStats={validatedStats} />;
    case UserRole.ADMIN:
      return <AdminDashboard user={user} auditLogs={auditLogs} onAddAuditEntry={onAddAuditEntry} />;
    case UserRole.EXECUTIVE:
      return <ExecutiveDashboard user={user} />;
    default:
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-black text-slate-900 uppercase">Unauthorized Access</h1>
            <p className="text-slate-400 font-medium">Role profile not recognized by the security grid.</p>
          </div>
        </div>
      );
  }
};

export default Dashboard;