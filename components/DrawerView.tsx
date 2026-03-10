'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Tldraw, exportToBlob, Editor } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import type { GameState, ChatMessage } from '@/lib/types'
import { STYLE_DEFINITIONS } from '@/lib/gameStyles'
import { GLOBAL_PROMPT_PREFIX } from '@/lib/wordPrompts'

interface Toast extends ChatMessage {
  toastId: number
}

interface Props {
  state: GameState
  myId: string
  isActive: boolean
  strength: number
  guidanceScale: number
  onStrengthChange: (v: number) => void
  onGuidanceScaleChange: (v: number) => void
  onAiImage: (imageUrl: string, sketch: string) => void
}

export function DrawerView({
  state,
  myId,
  isActive,
  strength,
  guidanceScale,
  onStrengthChange,
  onGuidanceScaleChange,
  onAiImage,
}: Props) {
  const { currentWord, aiStyle, aiImage, timeLeft, round, totalRounds, mode, activeDrawerId, players, coopTurnTimeLeft } = state
  const style = STYLE_DEFINITIONS[aiStyle]
  const [isGenerating, setIsGenerating] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastCounterRef = useRef(0)
  const lastChatLengthRef = useRef(0)

  // Show incoming guesses as toasts
  useEffect(() => {
    const newMsgs = state.chat.slice(lastChatLengthRef.current)
    lastChatLengthRef.current = state.chat.length
    newMsgs.forEach((msg) => {
      const toastId = toastCounterRef.current++
      setToasts((prev) => [...prev, { ...msg, toastId }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.toastId !== toastId)), 3500)
    })
  }, [state.chat])

  // Use refs so the store listener always has fresh values without needing re-registration
  const editorRef = useRef<Editor | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const isActiveRef = useRef(isActive)
  const strengthRef = useRef(strength)
  const guidanceRef = useRef(guidanceScale)
  const stylePromptRef = useRef(GLOBAL_PROMPT_PREFIX + state.currentPrompt)
  const isGeneratingRef = useRef(false)
  const onAiImageRef = useRef(onAiImage)

  // Keep refs in sync with props
  useEffect(() => { isActiveRef.current = isActive }, [isActive])
  useEffect(() => { strengthRef.current = strength }, [strength])
  useEffect(() => { guidanceRef.current = guidanceScale }, [guidanceScale])
  useEffect(() => { stylePromptRef.current = GLOBAL_PROMPT_PREFIX + state.currentPrompt }, [state.currentPrompt])
  useEffect(() => { onAiImageRef.current = onAiImage }, [onAiImage])

  // Update tldraw readonly state when isActive changes
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.updateInstanceState({ isReadonly: !isActive })
  }, [isActive])

  const runCapture = useCallback(async () => {
    const editor = editorRef.current
    if (!editor || !isActiveRef.current || isGeneratingRef.current) return
    const ids = editor.getCurrentPageShapeIds()
    if (ids.size === 0) return

    isGeneratingRef.current = true
    setIsGenerating(true)

    try {
      const blob = await exportToBlob({
        editor,
        ids: [...ids],
        format: 'jpeg',
        opts: { background: true, scale: 0.4 },
      })

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          stylePrompt: stylePromptRef.current,
          strength: strengthRef.current,
          guidanceScale: guidanceRef.current,
          leonardoStyle: 'NONE',
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('Generate API error:', res.status, errText)
        return
      }

      const { imageUrl } = await res.json()
      if (imageUrl) onAiImageRef.current(imageUrl, base64)
    } catch (e) {
      console.error('Generate failed:', e)
    } finally {
      isGeneratingRef.current = false
      setIsGenerating(false)
    }
  }, [])

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor
    editor.updateInstanceState({ isReadonly: !isActiveRef.current })
    editor.setCurrentTool('draw')

    editor.store.listen(
      () => {
        if (!isActiveRef.current) return
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(runCapture, 400)
      },
      { source: 'user', scope: 'document' }
    )
  }, [runCapture])

  const timerColor = timeLeft <= 10 ? 'text-red-400' : timeLeft <= 20 ? 'text-yellow-400' : 'text-white'
  const activePlayer = players.find((p) => p.id === activeDrawerId)

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0 gap-4">
        <span className="text-gray-400 text-sm whitespace-nowrap">Round {round}/{totalRounds}</span>
        <span className="text-xl font-extrabold text-white capitalize truncate">{currentWord}</span>
        <span className={`text-2xl font-bold tabular-nums flex-shrink-0 ${timerColor}`}>{timeLeft}s</span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full text-white flex-shrink-0 ${style.color}`}>
          {style.label}
        </span>
      </div>

      {/* Co-op turn indicator */}
      {mode === 'coop' && (
        <div className={`flex items-center justify-center gap-3 px-4 py-2 text-sm font-semibold ${isActive ? 'bg-indigo-900 text-indigo-200' : 'bg-gray-800 text-gray-400'}`}>
          {isActive ? (
            <><span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />Your turn — {coopTurnTimeLeft}s</>
          ) : (
            <><span className="w-2 h-2 rounded-full bg-gray-500" />{activePlayer?.name}&apos;s turn — {coopTurnTimeLeft}s</>
          )}
        </div>
      )}

      {/* Split screen */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left: canvas */}
        <div className="flex-1 relative border-b border-gray-700 md:border-b-0 md:border-r md:border-gray-700 min-h-0">
          <div className="absolute inset-0">
            <Tldraw onMount={handleMount} />
          </div>
          {!isActive && mode === 'coop' && (
            <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center pointer-events-none z-10">
              <p className="text-white text-lg font-semibold bg-gray-800/80 px-4 py-2 rounded-xl">
                Canvas locked — partner&apos;s turn
              </p>
            </div>
          )}
          <div className="absolute bottom-2 left-2 text-xs text-gray-500 pointer-events-none z-10">Raw sketch</div>

          {/* Guess toasts */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 items-end z-20 pointer-events-none max-w-[220px]">
            {toasts.map((t) => (
              <div
                key={t.toastId}
                className={`px-3 py-2 rounded-2xl text-sm font-bold shadow-lg border-2 animate-fade-in
                  ${t.correct
                    ? 'bg-emerald-500 border-emerald-300 text-white'
                    : 'bg-gray-900/90 border-white/20 text-white'}`}
                style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '0.01em' }}
              >
                <span className="text-xs font-normal opacity-70">{t.playerName}: </span>
                {t.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right: AI preview + sliders */}
        <div className="flex flex-col bg-gray-950 md:flex-1 h-48 md:h-auto">
          <div className="flex-1 flex items-center justify-center p-4">
            {aiImage ? (
              <img src={aiImage} alt="AI output" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
            ) : (
              <div className="text-center space-y-3 text-gray-600">
                {isGenerating ? (
                  <>
                    <div className="w-12 h-12 border-4 border-gray-600 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                    <p className="text-sm">Generating…</p>
                  </>
                ) : (
                  <p className="text-sm">Start drawing to see the AI version</p>
                )}
              </div>
            )}
          </div>

          {/* Sliders */}
          <div className="px-4 py-4 border-t border-gray-800 space-y-3">
            <p className="text-gray-500 text-xs uppercase tracking-widest">AI Controls</p>
            <label className="block space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Sketch faithfulness</span>
                <span className="text-gray-500">{strength >= 0.7 ? 'loose' : strength <= 0.4 ? 'tight' : 'balanced'}</span>
              </div>
              <input type="range" min="0.1" max="1" step="0.05" value={strength} onChange={(e) => onStrengthChange(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
            </label>
            <label className="block space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Style intensity</span>
                <span>{guidanceScale.toFixed(1)}</span>
              </div>
              <input type="range" min="0.5" max="20" step="0.5" value={guidanceScale} onChange={(e) => onGuidanceScaleChange(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
