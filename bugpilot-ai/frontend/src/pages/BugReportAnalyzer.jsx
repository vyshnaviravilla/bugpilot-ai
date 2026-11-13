import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { api } from '../api/client';
import { useSearchParams } from 'react-router-dom';

const severityStyles = {
  low: 'bg-green-600', medium: 'bg-yellow-600', high: 'bg-orange-600', critical: 'bg-red-600',
};

export default function BugReportAnalyzer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await api.get('/bug-reports/');
      setReports(response);
      generateAnalysis(response);
    } catch (err) {
      console.error('Failed to load bug reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = (data) => {
    if (data.length === 0) {
      setAnalysis(null);
      return;
    }

    const severityCount = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    const statusCount = {
      open: 0,
      in_progress: 0,
      fixed: 0,
      ready_for_qa: 0
    };

    data.forEach((report) => {
      severityCount[report.severity]++;
      statusCount[report.status]++;
    });

    const total = data.length;
    const criticalRate = ((severityCount.critical / total) * 100).toFixed(1);
    const fixRate = ((statusCount.fixed / total) * 100).toFixed(1);

    setAnalysis({
      total,
      severityCount,
      statusCount,
      criticalRate,
      fixRate,
      riskScore: calculateRiskScore(severityCount, statusCount)
    });
  };

  const calculateRiskScore = (severity, status) => {
    const weights = { low: 1, medium: 2, high: 3, critical: 4 };
    const statusWeights = { open: 1, in_progress: 0.5, fixed: 0, ready_for_qa: 0.2 };
    
    let score = 0;
    Object.entries(severity).forEach(([sev, count]) => {
      score += count * weights[sev];
    });
    
    Object.entries(status).forEach(([stat, count]) => {
      score *= (1 - (count * statusWeights[stat]) / (status.open + status.in_progress + 1));
    });
    
    return Math.min(100, Math.round(score));
  };

  if (loading) {
    return <div className="text-slate-400">Loading analysis...</div>;
  }

  if (!analysis) {
    return (
      <div className="text-center text-slate-400 py-12">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-500" />
        <p>No bug reports to analyze</p>
      </div>
    );
  }

  const selectedReport = reports.find((report) => String(report.id) === searchParams.get('report'));

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-6">Bug Report Analyzer</h2>

      {selectedReport && (
        <section className="mb-8 rounded-lg border border-white/10 bg-slate-800 p-5" aria-label="Selected bug report analysis">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-white">{selectedReport.title}</h3>
            <span className={`rounded px-2 py-1 text-xs font-semibold uppercase text-white ${severityStyles[selectedReport.severity]}`}>
              Severity: {selectedReport.severity}
            </span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{selectedReport.description}</p>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <FileText className="w-5 h-5" />
            <span className="text-sm">Total Reports</span>
          </div>
          <p className="text-3xl font-bold text-white">{analysis.total}</p>
        </div>

        <div className="p-4 bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">Critical Rate</span>
          </div>
          <p className="text-3xl font-bold text-red-400">{analysis.criticalRate}%</p>
        </div>

        <div className="p-4 bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">Fix Rate</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{analysis.fixRate}%</p>
        </div>

        <div className="p-4 bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm">Risk Score</span>
          </div>
          <p className={`text-3xl font-bold ${
            analysis.riskScore < 30 ? 'text-green-400' :
            analysis.riskScore < 60 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {analysis.riskScore}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 bg-slate-800 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-4">Severity Distribution</h3>
          <div className="space-y-3">
            {Object.entries(analysis.severityCount).map(([severity, count]) => (
              <div key={severity}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400 capitalize">{severity}</span>
                  <span className="text-white">{count}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      severity === 'critical' ? 'bg-red-600' :
                      severity === 'high' ? 'bg-orange-600' :
                      severity === 'medium' ? 'bg-yellow-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${(count / analysis.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-800 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-4">Status Distribution</h3>
          <div className="space-y-3">
            {Object.entries(analysis.statusCount).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400 capitalize">{status.replace('_', ' ')}</span>
                  <span className="text-white">{count}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      status === 'open' ? 'bg-blue-600' :
                      status === 'in_progress' ? 'bg-yellow-600' :
                      status === 'fixed' ? 'bg-green-600' :
                      'bg-purple-600'
                    }`}
                    style={{ width: `${(count / analysis.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-lg bg-slate-800 p-5" aria-labelledby="analyzed-reports-title">
        <h3 id="analyzed-reports-title" className="mb-4 text-lg font-medium text-white">Reports and severity</h3>
        <div className="space-y-2">
          {reports.map((report) => (
            <button key={report.id} onClick={() => setSearchParams({ report: String(report.id) })}
              className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-700/60 px-4 py-3 text-left hover:bg-slate-700">
              <span className="text-sm text-slate-100">{report.title}</span>
              <span className={`rounded px-2 py-1 text-xs font-semibold uppercase text-white ${severityStyles[report.severity]}`}>
                {report.severity}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
