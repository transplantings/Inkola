'use client'

import type { GameState } from '@/lib/types'

interface Props {
  state: GameState
  myId: string
  onPlayAgain: () => void
  isHost: boolean
}

export function GameOver({ state, myId, onPlayAgain, isHost }: Props) {
  const { players, scores } = state
  const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
  const winner = sorted[0]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-8">
      <div className="text-center space-y-1">
        <p className="text-gray-400 text-sm uppercase tracking-widest">Game Over</p>
        <h2 className="text-4xl font-extrabold text-yellow-400">
          {winner?.id === myId ? 'You win!' : `${winner?.name} wins!`}
        </h2>
      </div>

      <div className="w-full max-w-sm space-y-2">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
              i === 0 ? 'bg-yellow-900 border border-yellow-600' : 'bg-gray-800'
            }`}
          >
            <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
            <span className="flex-1 text-white font-semibold">
              {p.name} {p.id === myId && <span className="text-gray-400 text-xs">(you)</span>}
            </span>
            <span className="text-yellow-400 font-bold text-lg">{scores[p.id] || 0}</span>
          </div>
        ))}
      </div>

      {isHost ? (
        <button
          onClick={onPlayAgain}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
        >
          Play Again
        </button>
      ) : (
        <p className="text-gray-400">Waiting for host to start a new game…</p>
      )}
    </div>
  )
}
