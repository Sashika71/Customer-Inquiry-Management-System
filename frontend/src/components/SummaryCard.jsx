const cardStyles = {
  blue: 'border-blue-300 bg-blue-100/70',
  sky: 'border-cyan-200 bg-sky-50/70',
  orange: 'border-orange-300 bg-orange-50/70',
  green: 'border-emerald-400 bg-emerald-200/70',
}

function SummaryCard({ title, value, variant = 'blue', loading = false }) {
  return (
    <article className={`rounded-xl border p-5 shadow-sm ${cardStyles[variant] || cardStyles.blue}`}>
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <div className="mt-4">
        <h2 className="text-3xl font-bold text-slate-900">
          {loading ? '—' : value}
        </h2>
      </div>
    </article>
  )
}

export default SummaryCard
