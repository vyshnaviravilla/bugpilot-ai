import { Bug } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 font-semibold text-white">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/30">
        <Bug size={17} aria-hidden="true" />
      </span>
      <span>BugPilot <span className="font-normal text-slate-400">AI</span></span>
    </Link>
  );
}
