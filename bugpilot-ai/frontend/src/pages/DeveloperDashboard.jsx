import { Bug, LayoutDashboard, MessageSquare } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import SystemStatus from '../components/SystemStatus.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const nav = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Bug reports', icon: Bug, page: 'reports' },
  { label: 'Team chat', icon: MessageSquare, page: 'team-chat' },
];

export default function DeveloperDashboard() {
  const { user } = useAuth();
  return (
    <DashboardLayout role="developer" nav={nav}>
      <h1 className="text-2xl font-semibold text-white">Welcome, {user.name}</h1>
      <p className="mt-1 max-w-xl text-slate-400">Your developer account is ready. View assigned bugs and chat with QA.</p>
      <div className="mt-8">
        <SystemStatus role="developer" />
      </div>
    </DashboardLayout>
  );
}
