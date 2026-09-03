export default function SectionTitle({ eyebrow, title, description, action }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-500">{eyebrow}</div><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>{description && <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}</div>{action}</div>
}
