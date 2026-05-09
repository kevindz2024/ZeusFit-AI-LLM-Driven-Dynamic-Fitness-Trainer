import { useEffect, useRef, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import client from '../api/client'

function Bubble({ role, message }) {
  const mine = role === 'user'
  return (
    <div className={'flex ' + (mine ? 'justify-end' : 'justify-start')}>
      <div
        className={
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ' +
          (mine
            ? 'bg-violet-600 text-white'
            : 'border border-zinc-800 bg-zinc-950 text-zinc-100')
        }
      >
        {message}
      </div>
    </div>
  )
}

export default function Chatbot() {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  function scrollToBottom() {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadHistory() {
    const res = await client.get('/api/chatbot/history')
    setMessages(res.data.messages || [])
  }

  async function send(e) {
    e.preventDefault()
    const msg = text.trim()
    if (!msg) return
    setError('')
    setText('')

    setMessages((m) => [...m, { role: 'user', message: msg, id: `local-${Date.now()}` }])
    setLoading(true)
    try {
      const res = await client.post('/api/chatbot/message', { message: msg })
      setMessages((m) => [...m, { role: 'assistant', message: res.data.reply, id: `ai-${Date.now()}` }])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send message.')
    } finally {
      setLoading(false)
      setTimeout(scrollToBottom, 50)
    }
  }

  useEffect(() => {
    loadHistory()
      .catch(() => {})
      .finally(() => setTimeout(scrollToBottom, 50))
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Card title="AI Fitness Chatbot">
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="h-[55vh] space-y-3 overflow-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          {messages.length === 0 ? (
            <div className="text-sm text-zinc-400">
              Ask something like: “Suggest a 20 min home workout” or “Give diet tips for fat loss”.
            </div>
          ) : (
            messages.map((m) => <Bubble key={m.id} role={m.role} message={m.message} />)
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={send} className="mt-4 flex gap-2">
          <div className="flex-1">
            <Input
              label=""
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your question..."
            />
          </div>
          <Button type="submit" loading={loading} className="h-[42px] self-end">
            Send
          </Button>
        </form>
      </Card>
    </div>
  )
}

