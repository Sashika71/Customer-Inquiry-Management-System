const cardStyles = {
  blue: 'border-blue-300 bg-blue-100/70',
  sky: 'border-cyan-200 bg-sky-50/70',
  orange: 'border-orange-300 bg-orange-50/70',
  green: 'border-emerald-400 bg-emerald-200/70',
}

function SummaryCard({ title, value, variant = 'blue', loading = false }) {
  return (
    <article className={`rounded-xl border p-3 shadow-sm sm:p-4 ${cardStyles[variant] || cardStyles.blue}`}>
      <p className="text-xs font-medium text-slate-500 sm:text-sm">{title}</p>

      <div className="mt-2 sm:mt-3">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {loading ? '—' : value}
        </h2>
      </div>
    </article>
  )
}

export default SummaryCard
