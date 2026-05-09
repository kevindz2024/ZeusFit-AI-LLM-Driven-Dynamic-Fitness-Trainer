import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    weight: '',
    height: '',
    goal: 'fat loss',
    preference: 'home',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({
        ...form,
        age: form.age ? Number(form.age) : null,
        weight: form.weight ? Number(form.weight) : null,
        height: form.height ? Number(form.height) : null,
      })
      nav('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mx-auto max-w-md">
        <Card title="Create account">
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Your name"
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Age"
                type="number"
                value={form.age}
                onChange={(e) => setField('age', e.target.value)}
                placeholder="20"
              />
              <Input
                label="Weight (kg)"
                type="number"
                value={form.weight}
                onChange={(e) => setField('weight', e.target.value)}
                placeholder="70"
              />
              <Input
                label="Height (cm)"
                type="number"
                value={form.height}
                onChange={(e) => setField('height', e.target.value)}
                placeholder="170"
              />
            </div>

            <label className="block">
              <div className="mb-1 text-sm text-zinc-200">Fitness goal</div>
              <select
                value={form.goal}
                onChange={(e) => setField('goal', e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/70"
              >
                <option value="fat loss">Fat loss</option>
                <option value="muscle gain">Muscle gain</option>
                <option value="strength">Strength</option>
                <option value="general fitness">General fitness</option>
              </select>
            </label>

            <label className="block">
              <div className="mb-1 text-sm text-zinc-200">Workout preference</div>
              <select
                value={form.preference}
                onChange={(e) => setField('preference', e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/70"
              >
                <option value="home">Home</option>
                <option value="gym">Gym</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Register
            </Button>
          </form>

          <div className="mt-4 text-sm text-zinc-300">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-violet-400 hover:text-violet-300">
              Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

