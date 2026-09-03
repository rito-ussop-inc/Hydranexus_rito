export default function Panel({ eyebrow, title, action, children, className = '' }) {
  return <section className={`rounded-[24px] border border-white/85 bg-white/55 p-5 shadow-[0_16px_48px_rgba(56,189,248,.08)] backdrop-blur-xl ${className}`}>
    {(eyebrow || title || action) && <div className="mb-4 flex items-start justify-between gap-4"><div>{eyebrow && <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-500">{eyebrow}</div>}{title && <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">{title}</h2>}</div>{action}</div>}
    {children}
  </section>
}
