import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, LogOut, Menu, X } from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_LABEL = { qa: 'QA workspace', developer: 'Developer workspace', employer: 'Employer workspace' };

// `nav` items: { label, icon: Icon, active?: bool, soon?: bool, page?: string }.
// Items marked `soon` render as non-interactive text, never as fake buttons.
export default function DashboardLayout({ role, nav, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const signOut = () => { logout(); navigate('/'); };

  const handleNavClick = (item) => {
    if (item.soon) return;
    if (item.page) {
      navigate(`/${role}/${item.page.toLowerCase().replace(' ', '-')}`);
    } else if (item.label === 'Overview') {
      navigate(`/${role}`);
    }
  };

  const getActiveLabel = () => {
    const path = location.pathname;
    if (path === `/${role}`) return 'Overview';
    if (path.includes('/upload')) return 'Project upload';
    if (path.includes('/team-chat')) return 'Team chat';
    if (path.includes('/chat')) return role === 'qa' ? 'Chat with Vincy' : 'Team chat';
    if (path.includes('/reports')) return 'Bug reports';
    if (path.includes('/analyzer')) return 'BugReportAnalyzer';
    return 'Overview';
  };

  const activeLabel = getActiveLabel();

  return (
    <div className="min-h-screen">
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.07] bg-ink-900 transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Sidebar"
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo to={`/${role}`} />
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map(({ label, icon: Icon, active, soon, page }) => (
            <button
              key={label}
              onClick={() => handleNavClick({ label, soon, page })}
              disabled={soon}
              aria-current={active || activeLabel === label ? 'page' : undefined}
              aria-disabled={soon ? 'true' : undefined}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                active || activeLabel === label ? 'bg-emerald-400/10 text-emerald-300' : 
                soon ? 'cursor-default text-slate-500' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <Icon size={17} aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {soon && <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] text-slate-500">Planned</span>}
            </button>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/[0.07] bg-ink-950/90 px-4 backdrop-blur sm:px-8">
          <button className="rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <p className="flex-1 text-sm font-medium text-slate-300">{ROLE_LABEL[role]}</p>
          <button className="btn-ghost !px-3 !py-2" onClick={() => navigate(`/${role}`)} aria-label="Return to dashboard">
            <ArrowLeft size={15} aria-hidden="true" /> <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-400/15 text-xs font-semibold text-violet-300 ring-1 ring-violet-400/30">{initials}</span>
          </div>
          <button className="btn-ghost !px-3 !py-2" onClick={signOut} aria-label="Sign out">
            <LogOut size={15} aria-hidden="true" /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
