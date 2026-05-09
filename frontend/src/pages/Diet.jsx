import { useEffect, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import client from '../api/client'

function DietView({ plan }) {
  if (!plan) return <div className="text-sm text-zinc-400">No diet plan yet.</div>
  if (plan.raw) return <pre className="whitespace-pre-wrap text-sm text-zinc-200">{plan.raw}</pre>

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-white">{plan.title}</div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="font-semibold text-white">Breakfast</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
            {(plan.breakfast || []).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="font-semibold text-white">Lunch</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
            {(plan.lunch || []).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="font-semibold text-white">Dinner</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
            {(plan.dinner || []).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="font-semibold text-white">Water intake</div>
          <div className="mt-2 text-sm text-zinc-300">{plan.water_intake_liters} L / day</div>
          {plan.notes?.length ? (
            <>
              <div className="mt-4 font-semibold text-white">Notes</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
                {plan.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function Diet() {
  const [latest, setLatest] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadLatest() {
    const res = await client.get('/api/diet/latest')
    setLatest(res.data.plan)
  }

  async function generate() {
    setError('')
    setLoading(true)
    try {
      const res = await client.post('/api/diet/generate', {})
      setLatest(res.data.plan)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to generate diet plan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLatest().catch(() => {})
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Card
        title="AI Diet Recommendation"
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
        <DietView plan={latest} />
      </Card>
    </div>
  )
}

