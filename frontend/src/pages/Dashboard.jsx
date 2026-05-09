import { useEffect, useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return ''
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const [workout, setWorkout] = useState(null)
  const [diet, setDiet] = useState(null)
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [weight, setWeight] = useState(user?.weight || '')
  const [height, setHeight] = useState(user?.height || '')

  const chartData = useMemo(() => {
    return (progress || []).map((p) => ({
      date: fmtDate(p.created_at),
      weight: p.weight,
      bmi: p.bmi,
    }))
  }, [progress])

  async function loadAll() {
    const [w, d, p] = await Promise.all([
      client.get('/api/workout/latest'),
      client.get('/api/diet/latest'),
      client.get('/api/progress'),
    ])
    setWorkout(w.data.plan)
    setDiet(d.data.plan)
    setProgress(p.data.items || [])
  }

  async function addProgress(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await client.post('/api/progress', { weight: Number(weight), height: height ? Number(height) : undefined })
      await loadAll()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add progress.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll().catch(() => {})
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Dashboard</h1>
        <div className="mt-1 text-sm text-zinc-400">
          Your details, latest AI plans, and progress chart.
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card title="Profile">
          <div className="space-y-2 text-sm text-zinc-300">
            <div>
              <span className="text-zinc-400">Name:</span> {user?.name}
            </div>
            <div>
              <span className="text-zinc-400">Email:</span> {user?.email}
            </div>
            <div>
              <span className="text-zinc-400">Goal:</span> {user?.goal || '—'}
            </div>
            <div>
              <span className="text-zinc-400">Preference:</span> {user?.preference || '—'}
            </div>
          </div>
        </Card>

        <Card title="Latest workout">
          {!workout ? (
            <div className="text-sm text-zinc-400">No workout yet. Go to Workout page and generate.</div>
          ) : workout.raw ? (
            <div className="text-sm text-zinc-200">Workout generated (raw). Check Workout page.</div>
          ) : (
            <div className="text-sm text-zinc-200">
              <div className="font-semibold text-white">{workout.title}</div>
              <div className="mt-1 text-zinc-400">{workout.days?.length || 0} days</div>
            </div>
          )}
        </Card>

        <Card title="Latest diet">
          {!diet ? (
            <div className="text-sm text-zinc-400">No diet plan yet. Go to Diet page and generate.</div>
          ) : diet.raw ? (
            <div className="text-sm text-zinc-200">Diet generated (raw). Check Diet page.</div>
          ) : (
            <div className="text-sm text-zinc-200">
              <div className="font-semibold text-white">{diet.title}</div>
              <div className="mt-1 text-zinc-400">Water: {diet.water_intake_liters} L</div>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card title="Add progress (weight + BMI)">
          <form onSubmit={addProgress} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Weight (kg)"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
              <Input
                label="Height (cm)"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="optional (updates BMI)"
              />
            </div>
            <Button type="submit" loading={loading}>
              Save progress
            </Button>
            <div className="text-xs text-zinc-400">
              BMI is calculated from weight + height. If you don’t enter height here, the app uses your saved height.
            </div>
          </form>
        </Card>

        <Card title="Progress chart">
          {chartData.length === 0 ? (
            <div className="text-sm text-zinc-400">No progress logs yet. Add your first weight entry.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#a1a1aa" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#a1a1aa" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: 12 }}
                    labelStyle={{ color: '#e4e4e7' }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="bmi" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 text-xs text-zinc-400">Purple = weight, Green = BMI</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

