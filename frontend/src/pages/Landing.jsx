import { Link } from 'react-router-dom'
import Card from '../components/Card'

export default function Landing() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            LLM-driven fitness trainer (Gemini)
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            ZeusFit AI
          </h1>
          <p className="mt-3 text-zinc-300">
            A simple college mini project: generate workouts, diet plans, and chat with a fitness
            bot. Track your weight + BMI with clean charts.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-800"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <Card title="Main features">
            <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-300">
              <li>JWT login/register + profile</li>
              <li>AI workout recommendation (Gemini)</li>
              <li>AI diet plan (Gemini)</li>
              <li>AI chatbot (fitness Q&amp;A)</li>
              <li>Progress tracking + BMI chart</li>
            </ul>
          </Card>

          <Card title="Runs on normal laptop">
            <div className="text-sm text-zinc-300">
              Flask + SQLite backend, React + Vite frontend. No GPU required.
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

