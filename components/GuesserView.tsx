'use client'

import { useEffect, useRef, useState } from 'react'
import type { GameState } from '@/lib/types'
import { STYLE_DEFINITIONS } from '@/lib/gameStyles'

interface Props {
  state: GameState
  myId: string
  onGuess: (text: string) => void
}

export function GuesserView({ state, myId, onGuess }: Props) {
  const { aiImage, aiStyle, chat, timeLeft, round, totalRounds, players, scores, correctGuessers } = state
  const [input, setInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const hasGuessed = correctGuessers.includes(myId)
  const style = STYLE_DEFINITIONS[aiStyle]

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  const submit = () => {
    const text = input.trim()
    if (!text || hasGuessed) return
    onGuess(text)
    setInput('')
  }

  const timerColor = timeLeft <= 10 ? 'text-red-400' : timeLeft <= 20 ? 'text-yellow-400' : 'text-white'

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <span className="text-gray-400 text-sm">
          Round {round}/{totalRounds}
        </span>
        <span className={`text-2xl font-bold tabular-nums ${timerColor}`}>{timeLeft}s</span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full text-white ${style.color}`}>
          {style.label}
        </span>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* AI image */}
        <div className="flex-1 flex items-center justify-center bg-gray-950 p-4 min-h-0">
          {aiImage ? (
            <img
              src={aiImage}
              alt="AI generated"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
          ) : (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 border-4 border-gray-600 border-t-indigo-500 rounded-full animate-spin mx-auto" />
              <p className="text-gray-500">Waiting for the drawer to start…</p>
            </div>
          )}
        </div>

        {/* Chat sidebar — full width on mobile, fixed sidebar on desktop */}
        <div className="flex flex-col bg-gray-800 border-t border-gray-700 md:border-t-0 md:border-l md:w-72">
          {/* Score strip */}
          <div className="px-3 py-2 border-b border-gray-700 text-xs text-gray-400 space-y-0.5">
            {[...players]
              .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
              .map((p) => (
                <div key={p.id} className="flex justify-between">
                  <span className={p.id === myId ? 'text-white' : ''}>
                    {p.name} {p.id === myId && '(you)'}
                  </span>
                  <span className="text-yellow-400">{scores[p.id] || 0}</span>
                </div>
              ))}
          </div>

          {/* Chat messages — hidden on mobile to save space */}
          <div className="hidden md:block flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {chat.map((msg, i) => (
              <div key={i} className={`text-sm ${msg.correct ? 'text-emerald-400 font-semibold' : 'text-gray-300'}`}>
                <span className="font-medium text-gray-400">{msg.playerName}: </span>
                {msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-700">
            {hasGuessed ? (
              <p className="text-emerald-400 text-sm text-center font-semibold">You got it!</p>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder="Type your guess…"
                  className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                  maxLength={60}
                  autoComplete="off"
                  autoCapitalize="off"
                />
                <button
                  onClick={submit}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
