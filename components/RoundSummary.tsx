'use client'

import type { GameState } from '@/lib/types'

interface Props {
  state: GameState
  myId: string
  isHost: boolean
  onNextRound: () => void
}

export function RoundSummary({ state, myId, isHost, onNextRound }: Props) {
  const { currentWord, players, scores, correctGuessers, drawerIds, aiImage, roundSketch, round, totalRounds, drawerOrderIndex } = state as GameState & { drawerOrderIndex?: number }

  const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
  const isLastRound = round >= totalRounds

  // The next drawer (in solo mode) can also advance
  const isDrawer = drawerIds.includes(myId)
  const canAdvance = isHost || isDrawer

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-8">
      <div className="text-center space-y-1">
        <p className="text-gray-400 text-sm uppercase tracking-widest">The word was</p>
        <h2 className="text-5xl font-extrabold text-white capitalize">{currentWord}</h2>
      </div>

      {/* Side-by-side sketch vs AI */}
      {(roundSketch || aiImage) && (
        <div className="flex gap-4 w-full max-w-2xl">
          {roundSketch && (
            <div className="flex-1 space-y-1">
              <p className="text-gray-400 text-xs text-center uppercase tracking-widest">Raw sketch</p>
              <img src={roundSketch} alt="raw sketch" className="w-full rounded-xl border border-gray-600" />
            </div>
          )}
          {aiImage && (
            <div className="flex-1 space-y-1">
              <p className="text-gray-400 text-xs text-center uppercase tracking-widest">AI version</p>
              <img src={aiImage} alt="AI render" className="w-full rounded-xl border border-gray-600" />
            </div>
          )}
        </div>
      )}

      {/* Who got it */}
      <div className="w-full max-w-sm space-y-2">
        {players
          .filter((p) => !drawerIds.includes(p.id))
          .map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between px-4 py-2 rounded-xl ${
                correctGuessers.includes(p.id) ? 'bg-emerald-800' : 'bg-gray-700'
              }`}
            >
              <span className="text-white font-medium">
                {p.name} {p.id === myId && <span className="text-gray-400 text-xs">(you)</span>}
              </span>
              <span className="text-sm text-gray-300">
                {correctGuessers.includes(p.id) ? '✓ Guessed!' : '✗ Missed'}
              </span>
            </div>
          ))}
      </div>

      {/* Scores */}
      <div className="w-full max-w-sm space-y-1">
        <p className="text-gray-400 text-xs uppercase tracking-widest text-center">Scores</p>
        {sorted.map((p, i) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-xl">
            <span className="text-gray-400 w-6 text-sm">#{i + 1}</span>
            <span className="flex-1 text-white font-medium">
              {p.name} {p.id === myId && <span className="text-gray-500 text-xs">(you)</span>}
            </span>
            <span className="text-yellow-400 font-bold">{scores[p.id] || 0}</span>
          </div>
        ))}
      </div>

      {/* Advance button */}
      {canAdvance ? (
        <button
          onClick={onNextRound}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors text-lg"
        >
          {isLastRound ? 'See Final Scores' : 'Next Round →'}
        </button>
      ) : (
        <p className="text-gray-500 text-sm">Waiting for the host or next drawer to continue…</p>
      )}
    </div>
  )
}
