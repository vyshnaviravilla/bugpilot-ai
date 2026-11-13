import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, XCircle } from 'lucide-react';
import { systemApi } from '../api/index.js';

function Row({ label, state, detail }) {
  const icon = state === 'loading'
    ? <Loader2 size={16} className="animate-spin text-slate-500" aria-hidden="true" />
    : state === 'ok'
      ? <CheckCircle2 size={16} className="text-emerald-400" aria-hidden="true" />
      : state === 'warn'
        ? <AlertTriangle size={16} className="text-amber-400" aria-hidden="true" />
        : <XCircle size={16} className="text-rose-400" aria-hidden="true" />;
  return (
    <li className="flex items-start gap-3 py-3">
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-sm text-slate-400">{detail}</p>
      </div>
    </li>
  );
}

// Real checks against the backend: health, role-protected route, local Ollama config.
export default function SystemStatus({ role }) {
  const [health, setHealth] = useState({ state: 'loading' });
  const [access, setAccess] = useState({ state: 'loading' });
  const [ai, setAi] = useState({ state: 'loading' });
  const [test, setTest] = useState({ state: 'idle' });

  const load = useCallback(() => {
    systemApi.health()
      .then((d) => setHealth({ state: d.status === 'ok' ? 'ok' : 'warn', data: d }))
      .catch((e) => setHealth({ state: 'error', error: e.message }));
    systemApi.overview(role)
      .then((d) => setAccess({ state: 'ok', data: d }))
      .catch((e) => setAccess({ state: 'error', error: e.message }));
    systemApi.aiStatus()
      .then((d) => setAi({ state: d.configured ? 'ok' : 'warn', data: d }))
      .catch((e) => setAi({ state: 'error', error: e.message }));
  }, [role]);

  useEffect(() => { load(); }, [load]);

  const runTest = async () => {
    setTest({ state: 'loading' });
    try {
      const r = await systemApi.aiTest();
      setTest({ state: 'ok', text: `${r.provider} (${r.model}) replied: "${r.text.slice(0, 80)}"` });
    } catch (e) {
      setTest({ state: 'error', text: e.message });
    }
  };

  const counts = access.data?.registered_users;
  const configuredNames = ai.data?.providers.filter((p) => p.configured).map((p) => p.name).join(', ');

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="sys-title">
      <div className="flex items-center justify-between">
        <h2 id="sys-title" className="font-semibold text-white">System check</h2>
        <button className="text-xs text-slate-400 hover:text-white" onClick={load}>Re-check</button>
      </div>
      <ul className="mt-2 divide-y divide-white/[0.06]">
        <Row label="API server" state={health.state}
          detail={health.state === 'loading' ? 'Checking…' : health.error || `v${health.data.version}, database ${health.data.database}`} />
        <Row label="Role-based access" state={access.state}
          detail={access.state === 'loading' ? 'Checking…' : access.error || `Backend confirmed ${role}. Registered: ${counts.qa} QA, ${counts.developer} developers, ${counts.employer ?? 0} employers.`} />
        <Row label="Local AI model" state={ai.state}
          detail={ai.state === 'loading' ? 'Checking…' : ai.error || (ai.data.configured ? `Configured: ${configuredNames}` : ai.data.message)} />
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-4">
        <button className="btn-ghost" onClick={runTest} disabled={ai.state !== 'ok' || test.state === 'loading'}>
          {test.state === 'loading' ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          Send test prompt
        </button>
        {ai.state === 'warn' && <span className="text-xs text-slate-500">Start Ollama and install the configured model.</span>}
        {test.text && (
          <p role="status" className={`text-sm ${test.state === 'ok' ? 'text-emerald-300' : 'text-rose-300'}`}>{test.text}</p>
        )}
      </div>
    </section>
  );
}
