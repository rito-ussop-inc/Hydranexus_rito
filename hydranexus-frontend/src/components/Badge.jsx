export default function Badge({ children, tone = 'info' }) {
  const classes = {
    info: 'bg-sky-100 text-sky-700 border-sky-200',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    danger: 'bg-rose-100 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  }
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${classes[tone]}`}>{children}</span>
}
