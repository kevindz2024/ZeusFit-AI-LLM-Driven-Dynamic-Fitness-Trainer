export default function Button({ children, loading, className = '', ...props }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={
        'inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60 ' +
        className
      }
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}

