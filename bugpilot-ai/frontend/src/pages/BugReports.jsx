import { useState, useEffect } from 'react';
import { Plus, FileText, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const severityColors = {
  low: 'bg-green-600',
  medium: 'bg-yellow-600',
  high: 'bg-orange-600',
  critical: 'bg-red-600'
};

const statusIcons = {
  open: Clock,
  in_progress: AlertTriangle,
  fixed: CheckCircle,
  ready_for_qa: FileText
};

export default function BugReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    severity: 'medium'
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
    loadProjects();
  }, []);

  const loadReports = async () => {
    try {
      const response = await api.get('/bug-reports/');
      setReports(response);
    } catch (err) {
      console.error('Failed to load bug reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await api.get('/projects/');
      setProjects(response);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bug-reports/', formData);
      setShowForm(false);
      setFormData({ project_id: '', title: '', description: '', severity: 'medium' });
      loadReports();
    } catch (err) {
      console.error('Failed to create bug report:', err);
    }
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      await api.patch(`/bug-reports/${reportId}`, { status: newStatus });
      loadReports();
    } catch (err) {
      console.error('Failed to update bug report:', err);
    }
  };

  const handleClaim = async (reportId) => {
    try {
      await api.patch(`/bug-reports/${reportId}`, { assigned_to: user.id });
      loadReports();
    } catch (err) {
      console.error('Failed to claim bug report:', err);
    }
  };

  if (loading) {
    return <div className="text-slate-400">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-white">Bug Reports</h2>
        {user.role === 'qa' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Report
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-800 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Project</label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Bug title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Severity</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              placeholder="Describe the bug..."
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Report
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {reports.length === 0 ? (
        <div className="text-center text-slate-400 py-12">
          <FileText className="w-12 h-12 mx-auto mb-4 text-slate-500" />
          <p>No bug reports yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const StatusIcon = statusIcons[report.status] || Clock;
            return (
              <div
                key={report.id}
                className="p-4 bg-slate-800 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-white">{report.title}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium text-white rounded ${severityColors[report.severity]}`}
                      >
                        {report.severity}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-slate-400 text-sm mb-3">{report.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <StatusIcon className="w-4 h-4" />
                        {report.status.replace('_', ' ')}
                      </span>
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {user.role === 'developer' && (
                    report.assigned_to === user.id ? (
                      <select
                        value={report.status}
                        onChange={(e) => handleStatusUpdate(report.id, e.target.value)}
                        className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="fixed">Fixed</option>
                        <option value="ready_for_qa">Ready for QA</option>
                      </select>
                    ) : <button onClick={() => handleClaim(report.id)} className="btn-ghost !px-3 !py-2">Claim report</button>
                  )}
                  {user.role === 'qa' && <Link to={`/qa/analyzer?report=${report.id}`} className="btn-ghost !px-3 !py-2">Analyze</Link>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
