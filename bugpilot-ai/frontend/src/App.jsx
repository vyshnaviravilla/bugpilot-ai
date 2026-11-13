import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import RoleSelect from './pages/RoleSelect.jsx';
import Login from './pages/Login.jsx';
import QADashboard from './pages/QADashboard.jsx';
import DeveloperDashboard from './pages/DeveloperDashboard.jsx';
import ProjectUpload from './pages/ProjectUpload.jsx';
import VincyChat from './pages/VincyChat.jsx';
import BugReports from './pages/BugReports.jsx';
import BugReportAnalyzer from './pages/BugReportAnalyzer.jsx';
import WorkspacePage from './components/WorkspacePage.jsx';
import EmployerDashboard from './pages/EmployerDashboard.jsx';
import TeamChat from './pages/TeamChat.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/roles" element={<RoleSelect />} />
      <Route path="/login/qa" element={<Login role="qa" />} />
      <Route path="/login/developer" element={<Login role="developer" />} />
      <Route path="/login/employer" element={<Login role="employer" />} />
      <Route path="/qa" element={<ProtectedRoute role="qa"><QADashboard /></ProtectedRoute>} />
      <Route path="/qa/upload" element={<ProtectedRoute role="qa"><WorkspacePage role="qa"><ProjectUpload /></WorkspacePage></ProtectedRoute>} />
      <Route path="/qa/chat" element={<ProtectedRoute role="qa"><WorkspacePage role="qa"><VincyChat /></WorkspacePage></ProtectedRoute>} />
      <Route path="/qa/reports" element={<ProtectedRoute role="qa"><WorkspacePage role="qa"><BugReports /></WorkspacePage></ProtectedRoute>} />
      <Route path="/qa/analyzer" element={<ProtectedRoute role="qa"><WorkspacePage role="qa"><BugReportAnalyzer /></WorkspacePage></ProtectedRoute>} />
      <Route path="/developer" element={<ProtectedRoute role="developer"><DeveloperDashboard /></ProtectedRoute>} />
      <Route path="/employer" element={<ProtectedRoute role="employer"><EmployerDashboard /></ProtectedRoute>} />
      <Route path="/employer/chat" element={<ProtectedRoute role="employer"><WorkspacePage role="employer"><TeamChat /></WorkspacePage></ProtectedRoute>} />
      <Route path="/qa/team-chat" element={<ProtectedRoute role="qa"><WorkspacePage role="qa"><TeamChat /></WorkspacePage></ProtectedRoute>} />
      <Route path="/developer/team-chat" element={<ProtectedRoute role="developer"><WorkspacePage role="developer"><TeamChat /></WorkspacePage></ProtectedRoute>} />
      <Route path="/developer/reports" element={<ProtectedRoute role="developer"><WorkspacePage role="developer"><BugReports /></WorkspacePage></ProtectedRoute>} />
      <Route path="/developer/chat" element={<ProtectedRoute role="developer"><Navigate to="/developer/team-chat" replace /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
