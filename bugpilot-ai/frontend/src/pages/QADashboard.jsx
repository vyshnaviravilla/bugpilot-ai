import { BarChart3, FileText, LayoutDashboard, MessageSquare, MessagesSquare, Upload } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import SystemStatus from '../components/SystemStatus.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const nav = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Project upload', icon: Upload, page: 'upload' },
  { label: 'Chat with Vincy', icon: MessageSquare, page: 'chat' },
  { label: 'Team chat', icon: MessagesSquare, page: 'team-chat' },
  { label: 'Bug reports', icon: FileText, page: 'reports' },
  { label: 'BugReportAnalyzer', icon: BarChart3, page: 'analyzer' },
];

export default function QADashboard() {
  const { user } = useAuth();
  return (
    <DashboardLayout role="qa" nav={nav}>
      <h1 className="text-2xl font-semibold text-white">Welcome, {user.name.split(' ')[0]}</h1>
      <p className="mt-1 max-w-xl text-slate-400">Your QA account is ready. Upload projects, chat with Vincy, and manage bug reports.</p>
      <div className="mt-8">
        <SystemStatus role="qa" />
      </div>
    </DashboardLayout>
  );
}
