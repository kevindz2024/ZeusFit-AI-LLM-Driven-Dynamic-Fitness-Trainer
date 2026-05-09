export default function Input({ label, error, ...props }) {
  return (
    <label className="block">
      {label && <div className="mb-1 text-sm text-zinc-200">{label}</div>}
      <input
        {...props}
        className={
          'w-full rounded-xl border bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 ' +
          (error ? 'border-red-500/60 focus:border-red-400' : 'border-zinc-800 focus:border-violet-500/70')
        }
      />
      {error && <div className="mt-1 text-xs text-red-400">{error}</div>}
    </label>
  )
}

