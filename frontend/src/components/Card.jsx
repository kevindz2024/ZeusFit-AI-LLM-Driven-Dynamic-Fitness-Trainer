export default function Card({ title, children, right }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </div>
  )
}

