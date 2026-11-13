import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, BriefcaseBusiness, Code2, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const CONFIG = {
  qa: {
    title: 'QA sign in', label: 'QA', icon: ShieldCheck, other: { to: '/login/developer', text: 'Developer? Sign in here' },
    btn: 'bg-emerald-400 text-ink-950 hover:bg-emerald-300', iconBox: 'bg-emerald-400/10 text-emerald-300', namePh: 'Jordan Rivera',
  },
  developer: {
    title: 'Developer sign in', label: 'Developer', icon: Code2, other: { to: '/login/qa', text: 'QA engineer? Sign in here' },
    btn: 'bg-sky-400 text-ink-950 hover:bg-sky-300', iconBox: 'bg-sky-400/10 text-sky-300', namePh: 'Employee A',
  },
  employer: {
    title: 'Employer sign in', label: 'Employer', icon: BriefcaseBusiness, other: { to: '/login/qa', text: 'QA or Developer? Choose a staff login' },
    btn: 'bg-violet-400 text-ink-950 hover:bg-violet-300', iconBox: 'bg-violet-400/10 text-violet-300', namePh: 'Alex Morgan',
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login({ role }) {
  const c = CONFIG[role];
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={`/${user.role}`} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isRegister = mode === 'register';

  const validate = () => {
    if (isRegister && form.name.trim().length < 2) return 'Enter your name (at least 2 characters).';
    if (!EMAIL_RE.test(form.email.trim())) return 'Enter a valid email address.';
    if (isRegister && (form.password.length < 8 || form.password.length > 72)) return 'Password must be 8 to 72 characters.';
    if (!form.password) return 'Enter your password.';
    return '';
  };

  const submit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);
    setError('');
    setBusy(true);
    try {
      const email = form.email.trim();
      const u = isRegister
        ? await register({ name: form.name, email, password: form.password, role })
        : await login({ email, password: form.password, role });
      navigate(`/${u.role}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <Link to="/roles" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={15} aria-hidden="true" /> Switch role
        </Link>
      </header>

      <main className="grid flex-1 place-items-center px-5 py-10">
        <div className="card w-full max-w-md p-6 sm:p-8">
          <span className={`grid h-10 w-10 place-items-center rounded-xl ${c.iconBox}`}><c.icon size={20} aria-hidden="true" /></span>
          <h1 className="mt-5 text-xl font-semibold text-white">{isRegister ? `Create ${c.label} account` : c.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {isRegister ? 'Accounts are stored in the local SQLite database.' : `Use your ${c.label} account to continue.`}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {isRegister && (
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">Full name</label>
                <input id="name" className="input" autoComplete="name" placeholder={c.namePh} value={form.name} onChange={set('name')} />
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <input id="email" type="email" className="input" autoComplete="email" placeholder="you@company.com" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <input id="password" type={show ? 'text' : 'password'} className="input pr-11"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  placeholder={isRegister ? 'At least 8 characters' : 'Your password'} value={form.password} onChange={set('password')} />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500 hover:text-slate-200">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2.5 text-sm text-rose-200">
                <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {error}
              </p>
            )}

            <button type="submit" disabled={busy} className={`btn w-full ${c.btn}`}>
              {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-400">
            {isRegister ? 'Already have an account?' : 'New here?'}{' '}
            <button type="button" className="font-medium text-sky-300 hover:text-sky-200"
              onClick={() => { setMode(isRegister ? 'login' : 'register'); setError(''); }}>
              {isRegister ? 'Sign in' : 'Create an account'}
            </button>
          </p>
          <p className="mt-3 text-center text-sm"><Link to={c.other.to} className="text-slate-500 hover:text-slate-300">{c.other.text}</Link></p>
        </div>
      </main>
    </div>
  );
}
