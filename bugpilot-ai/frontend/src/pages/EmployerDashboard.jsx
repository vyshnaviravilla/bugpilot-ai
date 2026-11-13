import { BriefcaseBusiness, LayoutDashboard, MessagesSquare } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import SystemStatus from '../components/SystemStatus.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const nav = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Team chat', icon: MessagesSquare, page: 'chat' },
];

export default function EmployerDashboard() {
  const { user } = useAuth();
  return (
    <DashboardLayout role="employer" nav={nav}>
      <div className="flex items-center gap-3">
        <BriefcaseBusiness className="text-violet-300" />
        <h1 className="text-2xl font-semibold text-white">Welcome, {user.name}</h1>
      </div>
      <p className="mt-2 max-w-xl text-slate-400">Choose a QA engineer or developer and coordinate directly in Team chat.</p>
      <div className="mt-8"><SystemStatus role="employer" /></div>
    </DashboardLayout>
  );
}
