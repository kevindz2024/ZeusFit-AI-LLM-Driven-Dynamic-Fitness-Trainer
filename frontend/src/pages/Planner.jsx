import { useEffect, useMemo, useState } from 'react'
import client from '../api/client'

const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const weekendModes = ['strength', 'cardio', 'mobility', 'rest']

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function Pill({ active, children, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={
        'rounded-xl border px-3 py-2 text-sm capitalize transition ' +
        (active
          ? 'border-violet-400/30 bg-violet-600 text-white'
          : 'border-zinc-800 bg-zinc-900/40 text-zinc-200 hover:bg-zinc-900')
      }
    >
      {children}
    </button>
  )
}

export default function Planner() {
  const [activeDay, setActiveDay] = useState('monday')

  // Day plan data from backend
  const [plan, setPlan] = useState(null)

  // Exercise completion tracking (IDs)
  const [completedIds, setCompletedIds] = useState([])

  // Weekend modes / weekly split stored on backend as a small profile setting
  const [weeklySplit, setWeeklySplit] = useState({
    monday: 'push',
    tuesday: 'pull',
    wednesday: 'legs',
    thursday: 'core',
    friday: 'full-body',
    saturday: 'strength',
    sunday: 'rest',
  })

  // UI state
  const [selectedMuscleTags, setSelectedMuscleTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Workout timer
  const [timerRunning, setTimerRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Timer tick
  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(() => setElapsedSeconds((v) => v + 1), 1000)
    return () => clearInterval(id)
  }, [timerRunning])

  // Load: day plan + progress for that day
  useEffect(() => {
    let cancelled = false

    async function loadDay() {
      setLoading(true)
      setError('')
      try {
        const [planRes, progressRes] = await Promise.all([
          client.get('/api/planner/day', { params: { day: activeDay } }),
          client.get('/api/planner/progress', { params: { day: activeDay } }),
        ])

        if (cancelled) return

        setPlan(planRes.data.plan)
        setCompletedIds(progressRes.data.completed || [])

        if (planRes.data.profile?.weeklySplit) {
          setWeeklySplit((prev) => ({ ...prev, ...planRes.data.profile.weeklySplit }))
        }
      } catch (err) {
        if (cancelled) return
        setError(err?.response?.data?.message || 'Unable to load workout plan.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDay()
    return () => {
      cancelled = true
    }
  }, [activeDay])

  // Clear muscle filters when switching days (simple UX)
  useEffect(() => {
    setSelectedMuscleTags([])
  }, [activeDay])

  const progressPercent = useMemo(() => {
    const total = plan?.exercises?.length || 0
    if (!total) return 0
    return Math.round((completedIds.length / total) * 100)
  }, [completedIds.length, plan])

  const availableMuscleTags = useMemo(() => {
    if (!plan || plan.isRestDay) return []
    const tags = new Set()
    for (const ex of plan.exercises || []) {
      for (const g of ex.muscleGroups || []) tags.add(g)
    }
    return Array.from(tags).sort()
  }, [plan])

  const filteredExercises = useMemo(() => {
    if (!plan || plan.isRestDay) return []
    if (!selectedMuscleTags.length) return plan.exercises || []
    return (plan.exercises || []).filter((ex) =>
      selectedMuscleTags.some((tag) => (ex.muscleGroups || []).includes(tag)),
    )
  }, [plan, selectedMuscleTags])

  function toggleMuscleTag(tag) {
    setSelectedMuscleTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  // Optimistic toggle: update UI immediately, then save to backend.
  async function toggleExerciseDone(exerciseId) {
    const done = completedIds.includes(exerciseId)
    const nextDone = !done

    setCompletedIds((prev) => (nextDone ? [...prev, exerciseId] : prev.filter((id) => id !== exerciseId)))

    try {
      await client.post('/api/planner/progress', { day: activeDay, exerciseId, completed: nextDone })
    } catch (err) {
      // If save fails, revert the UI and show a small error message.
      setCompletedIds((prev) =>
        nextDone ? prev.filter((id) => id !== exerciseId) : [...prev, exerciseId],
      )
      setError(err?.response?.data?.message || 'Failed to save progress.')
    }
  }

  async function updateWeekendMode(mode) {
    // Weekend mode affects the plan type for Saturday/Sunday.
    setWeeklySplit((prev) => ({ ...prev, [activeDay]: mode }))
    try {
      await client.post('/api/planner/profile', { weeklySplit: { [activeDay]: mode } })
      // Re-load day plan (backend will generate a different plan for the new mode).
      setActiveDay((d) => d)
      // easiest: just trigger by setting day again
      setActiveDay(activeDay)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update weekend mode.')
    }
  }

  const isWeekend = activeDay === 'saturday' || activeDay === 'sunday'

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm text-violet-300">Workout Planner</p>
          <h1 className="text-2xl font-bold text-white md:text-3xl">Day-wise Interactive Routine</h1>
          <p className="text-sm text-zinc-400">
            Pick a day, follow your plan, and track completion live.
          </p>
        </header>

        {/* Day selector + weekend mode */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex flex-wrap gap-2">
            {dayKeys.map((day) => (
              <Pill key={day} active={day === activeDay} onClick={() => setActiveDay(day)}>
                {day}
              </Pill>
            ))}
          </div>

          {isWeekend && (
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <p className="mb-2 text-xs text-zinc-400">Weekend mode</p>
              <div className="flex flex-wrap gap-2">
                {weekendModes.map((mode) => (
                  <Pill
                    key={mode}
                    active={mode === weeklySplit[activeDay]}
                    onClick={() => updateWeekendMode(mode)}
                  >
                    {mode}
                  </Pill>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Plan card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800 p-5">
            <div>
              <div className="text-lg font-semibold text-white">{plan?.title || 'Loading plan...'}</div>
              <div className="mt-1 text-sm text-zinc-400">
                <span className="capitalize">{plan?.day || activeDay}</span>
                {plan?.focus ? ` • ${plan.focus}` : ''}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTimerRunning((v) => !v)}
                className={
                  'inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ' +
                  (timerRunning
                    ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                    : 'bg-violet-600 text-white hover:bg-violet-500')
                }
              >
                {timerRunning ? 'Stop Workout' : 'Start Workout'}
              </button>
              <button
                type="button"
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                onClick={() => setElapsedSeconds(0)}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-4 p-5">
            {/* Progress + timer */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-200">
                Progress {progressPercent}%
              </div>
              <div className="text-zinc-200">Timer {formatTime(elapsedSeconds)}</div>
              <div className="text-zinc-400">Estimated {plan?.estimatedMinutes ?? '--'} min</div>
            </div>

            {plan?.tip ? <div className="text-sm text-violet-300">Tip: {plan.tip}</div> : null}

            {/* Muscle filter */}
            {!!availableMuscleTags.length && (
              <div className="space-y-2">
                <div className="text-xs text-zinc-400">Filter by muscle group (multi-select)</div>
                <div className="flex flex-wrap gap-2">
                  {availableMuscleTags.map((tag) => (
                    <Pill key={tag} active={selectedMuscleTags.includes(tag)} onClick={() => toggleMuscleTag(tag)}>
                      {tag}
                    </Pill>
                  ))}
                </div>
              </div>
            )}

            {loading ? <div className="text-zinc-400">Loading day plan...</div> : null}
            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {!loading && !error && plan?.isRestDay ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-200">
                Rest day selected. Prioritize hydration, light walking, and mobility.
              </div>
            ) : null}

            {!loading && !error && plan && !plan.isRestDay ? (
              <div className="space-y-3">
                {filteredExercises.map((exercise) => {
                  const done = completedIds.includes(exercise.id)
                  return (
                    <div key={exercise.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-[220px] flex-1">
                          <div className="font-semibold text-white">{exercise.name}</div>
                          <div className="mt-1 text-xs text-zinc-400">
                            {exercise.sets} sets • {exercise.reps} reps • {exercise.weight}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {(exercise.muscleGroups || []).map((group) => (
                              <span
                                key={group}
                                className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
                              >
                                {group}
                              </span>
                            ))}
                            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200">
                              Rest {exercise.restSeconds}s
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleExerciseDone(exercise.id)}
                          className={
                            'inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ' +
                            (done
                              ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                              : 'bg-violet-600 text-white hover:bg-violet-500')
                          }
                        >
                          {done ? 'Completed' : 'Mark Done'}
                        </button>
                      </div>
                    </div>
                  )
                })}

                {!filteredExercises.length ? (
                  <div className="text-sm text-zinc-400">
                    No exercises match selected tags. Clear one or more filters.
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

