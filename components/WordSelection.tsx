'use client'

import type { AiStyle } from '@/lib/types'
import { STYLE_DEFINITIONS } from '@/lib/gameStyles'

interface Props {
  words: string[]
  aiStyle: AiStyle
  onSelect: (word: string) => void
}

export function WordSelection({ words, aiStyle, onSelect }: Props) {
  const style = STYLE_DEFINITIONS[aiStyle]
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-sm w-full space-y-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white text-center">Pick a word to draw</h2>
        <div className="flex items-center justify-center gap-2">
          <span className="text-gray-400 text-sm">Style this round:</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full text-white ${style.color}`}>
            {style.label}
          </span>
        </div>
        <div className="space-y-3">
          {words.map((word) => (
            <button
              key={word}
              onClick={() => onSelect(word)}
              className="w-full py-4 bg-gray-700 hover:bg-indigo-600 text-white text-xl font-semibold rounded-xl transition-colors capitalize"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
