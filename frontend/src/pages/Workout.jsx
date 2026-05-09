import { useEffect, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import client from '../api/client'

function PlanView({ plan }) {
  if (!plan) return <div className="text-sm text-zinc-400">No plan yet.</div>
  if (plan.raw) return <pre className="whitespace-pre-wrap text-sm text-zinc-200">{plan.raw}</pre>

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold text-white">{plan.title}</div>
        {plan.notes?.length ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
            {plan.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="space-y-4">
        {(plan.days || []).map((d, idx) => (
          <div key={idx} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="font-semibold text-white">{d.day}</div>
              <div className="text-sm text-violet-300">{d.focus}</div>
            </div>
            <div className="mt-3 space-y-3">
              {(d.exercises || []).map((ex, i) => (
                <div key={i} className="rounded-lg border border-zinc-900 bg-zinc-900/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-zinc-100">{ex.name}</div>
                    <div className="text-xs text-zinc-300">
                      {ex.sets ? `${ex.sets} sets` : ''} {ex.reps ? `• ${ex.reps} reps` : ''}{' '}
                      {ex.duration ? `• ${ex.duration}` : ''}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-zinc-300">{ex.instructions}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Workout() {
  const [latest, setLatest] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadLatest() {
    const res = await client.get('/api/workout/latest')
    setLatest(res.data.plan)
  }

  async function generate() {
    setError('')
    setLoading(true)
    try {
      const res = await client.post('/api/workout/generate', {})
      setLatest(res.data.plan)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to generate workout.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLatest().catch(() => {})
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-6">
        <Card
          title="AI Workout Recommendation"
          right={
            <Button onClick={generate} loading={loading}>
              Generate
            </Button>
          }
        >
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <PlanView plan={latest} />
        </Card>
      </div>
    </div>
  )
}

