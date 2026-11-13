import { BarChart3, Bug, FileText, MessageSquare, MessagesSquare, Upload } from 'lucide-react';
import DashboardLayout from './DashboardLayout.jsx';

const navByRole = {
  qa: [
    { label: 'Overview', icon: BarChart3 },
    { label: 'Project upload', icon: Upload, page: 'upload' },
    { label: 'Chat with Vincy', icon: MessageSquare, page: 'chat' },
    { label: 'Team chat', icon: MessagesSquare, page: 'team-chat' },
    { label: 'Bug reports', icon: FileText, page: 'reports' },
    { label: 'BugReportAnalyzer', icon: BarChart3, page: 'analyzer' },
  ],
  developer: [
    { label: 'Overview', icon: BarChart3 },
    { label: 'Bug reports', icon: Bug, page: 'reports' },
    { label: 'Team chat', icon: MessageSquare, page: 'team-chat' },
  ],
  employer: [
    { label: 'Overview', icon: BarChart3 },
    { label: 'Team chat', icon: MessagesSquare, page: 'chat' },
  ],
};

export default function WorkspacePage({ role, children }) {
  return <DashboardLayout role={role} nav={navByRole[role]}>{children}</DashboardLayout>;
}
