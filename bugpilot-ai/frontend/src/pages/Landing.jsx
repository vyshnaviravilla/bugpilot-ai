import { Link } from 'react-router-dom';
import { ArrowRight, Code2, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo.jsx';

const status = [
  { label: 'Accounts and role-based login', done: true },
  { label: 'Secure API with JWT', done: true },
  { label: 'Local Qwen model through Ollama', done: true },
  { label: 'Vincy bug assistant and report downloads', done: false },
  { label: 'ZIP project analysis', done: false },
  { label: 'BugReportAnalyzer', done: false },
  { label: 'Real-time QA and developer chat', done: false },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <Link to="/roles" className="btn-ghost !py-2">Sign in</Link>
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <section className="grid items-center gap-12 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Describe the bug in plain words. Hand developers a report they can act on.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
              BugPilot AI lets QA engineers turn conversations into structured bug reports with an assistant named Vincy,
              analyze many reports at once, and resolve issues together with developers.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/login/qa" className="btn bg-emerald-400 text-ink-950 hover:bg-emerald-300">
                <ShieldCheck size={17} aria-hidden="true" /> Continue as QA
              </Link>
              <Link to="/login/developer" className="btn border border-sky-400/40 bg-sky-400/10 text-sky-200 hover:bg-sky-400/20">
                <Code2 size={17} aria-hidden="true" /> Continue as Developer
              </Link>
            </div>
          </div>

          <figure className="card p-5 sm:p-6" aria-label="Example bug report (demo data)">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold leading-snug text-white">Checkout button stays disabled after removing a coupon</h2>
              <span className="chip shrink-0 border-amber-400/30 bg-amber-400/10 text-amber-300">High</span>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-medium text-slate-300">Steps to reproduce</dt>
                <dd><ol className="mt-1 list-decimal space-y-0.5 pl-5 text-slate-400">
                  <li>Add any item to the cart.</li>
                  <li>Apply coupon SAVE10, then remove it.</li>
                  <li>Open the checkout page.</li>
                </ol></dd>
              </div>
              <div><dt className="font-medium text-slate-300">Expected</dt><dd className="text-slate-400">Checkout is enabled at the original total.</dd></div>
              <div><dt className="font-medium text-slate-300">Actual</dt><dd className="text-slate-400">Button remains disabled until the page is reloaded.</dd></div>
            </dl>
            <figcaption className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4 text-xs text-slate-500">
              <span>Demo data, not a real report</span>
              <span className="chip border-violet-400/30 bg-violet-400/10 text-violet-300">Drafted by Vincy</span>
            </figcaption>
          </figure>
        </section>

        <section className="border-t border-white/[0.07] py-14" aria-labelledby="status-title">
          <h2 id="status-title" className="text-xl font-semibold text-white">What works today</h2>
          <p className="mt-2 max-w-xl text-slate-400">This release is the foundation. Anything marked as planned is not built yet.</p>
          <ul className="mt-6 grid gap-x-10 gap-y-2 sm:grid-cols-2">
            {status.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-3 border-b border-white/[0.06] py-3 text-sm">
                <span className={s.done ? 'text-slate-200' : 'text-slate-500'}>{s.label}</span>
                <span className={`chip ${s.done ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-white/10 text-slate-500'}`}>
                  {s.done ? 'Available' : 'Planned'}
                </span>
              </li>
            ))}
          </ul>
          <Link to="/roles" className="mt-8 inline-flex items-center gap-2 text-sm text-sky-300 hover:text-sky-200">
            Compare QA and developer access <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </main>
    </div>
  );
}
