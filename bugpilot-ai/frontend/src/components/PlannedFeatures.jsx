export default function PlannedFeatures({ items }) {
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="plan-title">
      <h2 id="plan-title" className="font-semibold text-white">Coming in later phases</h2>
      <p className="mt-1 text-sm text-slate-400">None of these exist yet. This dashboard is a foundation placeholder.</p>
      <ul className="mt-4 space-y-3">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-slate-400"><Icon size={16} aria-hidden="true" /></span>
            <div>
              <p className="text-sm font-medium text-slate-200">{title}</p>
              <p className="text-sm text-slate-400">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
