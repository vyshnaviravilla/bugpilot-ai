import { Link } from 'react-router-dom';
import { ArrowLeft, BriefcaseBusiness, Code2, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo.jsx';

const roles = [
  {
    to: '/login/qa', title: 'QA engineer', icon: ShieldCheck,
    tone: 'border-emerald-400/30 hover:border-emerald-400/60', icon_tone: 'bg-emerald-400/10 text-emerald-300',
    points: ['Chat with Vincy to describe bugs', 'Generate and download structured reports', 'Analyze reports with BugReportAnalyzer', 'Discuss issues with developers'],
  },
  {
    to: '/login/developer', title: 'Developer', icon: Code2,
    tone: 'border-sky-400/30 hover:border-sky-400/60', icon_tone: 'bg-sky-400/10 text-sky-300',
    points: ['See bugs assigned to you', 'Read QA-generated reports', 'Share logs and screenshots', 'Update status through to Ready for QA'],
  },
  {
    to: '/login/employer', title: 'Employer', icon: BriefcaseBusiness,
    tone: 'border-violet-400/30 hover:border-violet-400/60', icon_tone: 'bg-violet-400/10 text-violet-300',
    points: ['Find QA engineers and developers', 'Start direct conversations with either role', 'Coordinate project work in one place'],
  },
];

export default function RoleSelect() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={15} aria-hidden="true" /> Back
        </Link>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <h1 className="text-3xl font-semibold text-white">How will you use BugPilot?</h1>
        <p className="mt-2 text-slate-400">Choose a workspace to sign in or create an account.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {roles.map(({ to, title, icon: Icon, tone, icon_tone, points }) => (
            <Link key={to} to={to} className={`card block p-6 transition-colors duration-150 ${tone}`}>
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${icon_tone}`}><Icon size={20} aria-hidden="true" /></span>
              <h2 className="mt-5 text-lg font-semibold text-white">{title}</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-400">
                {points.map((p) => <li key={p}>{p}</li>)}
              </ul>
              <p className="mt-6 text-sm font-medium text-slate-200">Continue as {title}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
