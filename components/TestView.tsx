'use client'

import { useCallback, useRef, useState } from 'react'
import { Tldraw, exportToBlob, Editor } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { pickRandom, GLOBAL_PROMPT_PREFIX } from '@/lib/wordPrompts'
import type { WordPrompt } from '@/lib/wordPrompts'

const LEONARDO_STYLES = [
  'NONE', 'SKETCH_BW', 'SKETCH_COLOR', 'ILLUSTRATION', 'CINEMATIC',
  'ANIME', 'DIGITAL_ART', 'DYNAMIC', 'ENVIRONMENT', 'FANTASY_ART',
  'PHOTOGRAPHY', 'RENDER_3D', 'RAYTRACED', 'VIBRANT',
] as const

type LeonardoStyle = typeof LEONARDO_STYLES[number]

export function TestView() {
  const editorRef = useRef<Editor | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const isGeneratingRef = useRef(false)

  const [round, setRound] = useState<WordPrompt>(pickRandom)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiImage, setAiImage] = useState<string | null>(null)
  const [strength, setStrength] = useState(0.55)
  const [guidance, setGuidance] = useState(1.5)
  const [leonardoStyle, setLeonardoStyle] = useState<LeonardoStyle>('NONE')
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [customPromptText, setCustomPromptText] = useState('')

  // Refs so the store listener always has fresh values
  const strengthRef = useRef(strength)
  const guidanceRef = useRef(guidance)
  const styleRef = useRef(leonardoStyle)
  const roundRef = useRef(round)
  const useCustomPromptRef = useRef(useCustomPrompt)
  const customPromptTextRef = useRef(customPromptText)

  const updateCustomPromptText = (v: string) => { setCustomPromptText(v); customPromptTextRef.current = v }
  const toggleCustomPrompt = (on: boolean) => {
    setUseCustomPrompt(on)
    useCustomPromptRef.current = on
    // Pre-fill with current word prompt when switching on
    if (on && !customPromptTextRef.current) {
      updateCustomPromptText(roundRef.current.prompt)
    }
  }

  const updateStrength = (v: number) => { setStrength(v); strengthRef.current = v }
  const updateGuidance = (v: number) => { setGuidance(v); guidanceRef.current = v }
  const updateStyle = (v: LeonardoStyle) => { setLeonardoStyle(v); styleRef.current = v }

  const newRound = () => {
    const next = pickRandom(roundRef.current)
    setRound(next)
    roundRef.current = next
    setAiImage(null)
    // Clear the canvas
    const editor = editorRef.current
    if (editor) {
      const ids = [...editor.getCurrentPageShapeIds()]
      if (ids.length > 0) editor.deleteShapes(ids)
    }
  }

  const runCapture = useCallback(async () => {
    const editor = editorRef.current
    if (!editor || isGeneratingRef.current) return
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
          stylePrompt: GLOBAL_PROMPT_PREFIX + (useCustomPromptRef.current ? customPromptTextRef.current : roundRef.current.prompt),
          strength: strengthRef.current,
          guidanceScale: guidanceRef.current,
          leonardoStyle: styleRef.current,
        }),
      })

      if (!res.ok) {
        console.error('Generate API error:', res.status, await res.text())
        return
      }

      const { imageUrl } = await res.json()
      if (imageUrl) setAiImage(imageUrl)
    } catch (e) {
      console.error('Generate failed:', e)
    } finally {
      isGeneratingRef.current = false
      setIsGenerating(false)
    }
  }, [])

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor
    editor.store.listen(
      () => {
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(runCapture, 400)
      },
      { source: 'user', scope: 'document' }
    )
  }, [runCapture])

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Top bar */}
      <div className="flex flex-col px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0 gap-2">
        <div className="flex items-center gap-4">
          {/* Word */}
          <div className="flex-1 min-w-0">
            <p className="text-gray-500 text-xs uppercase tracking-widest">Draw this</p>
            <p className="text-2xl font-extrabold text-white truncate">{round.word}</p>
          </div>

          {/* Buttons */}
          <button
            onClick={newRound}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            New Round
          </button>

          {/* Custom prompt toggle */}
          <button
            onClick={() => toggleCustomPrompt(!useCustomPrompt)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors whitespace-nowrap
              ${useCustomPrompt
                ? 'bg-amber-500 border-amber-300 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-amber-500 hover:text-amber-400'}`}
          >
            {useCustomPrompt ? 'Custom ✎' : 'Custom prompt'}
          </button>

          <a href="/" className="text-xs text-gray-600 hover:text-gray-400 underline whitespace-nowrap">← Back</a>
        </div>

        {/* Prompt row — editable when custom mode on, read-only otherwise */}
        <div className="flex items-start gap-2">
          <p className="text-gray-500 text-xs uppercase tracking-widest whitespace-nowrap pt-1">
            {useCustomPrompt ? 'Custom prompt' : 'AI prompt'}
          </p>
          {useCustomPrompt ? (
            <textarea
              value={customPromptText}
              onChange={(e) => updateCustomPromptText(e.target.value)}
              placeholder="Enter custom prompt keywords, e.g. volcano, mountain, cone shape, eruption…"
              rows={2}
              className="flex-1 px-3 py-1.5 rounded-lg bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-500 resize-none"
            />
          ) : (
            <p className="flex-1 text-gray-300 text-sm italic pt-0.5">{round.prompt}</p>
          )}
        </div>
      </div>

      {/* Split screen */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: canvas */}
        <div className="flex-1 relative border-r border-gray-700">
          <div className="absolute inset-0">
            <Tldraw onMount={handleMount} />
          </div>
          <div className="absolute bottom-2 left-2 text-xs text-gray-500 pointer-events-none z-10">Raw sketch</div>
        </div>

        {/* Right: AI preview + controls */}
        <div className="flex-1 flex flex-col bg-gray-950">
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
                  <p className="text-sm">Draw on the left to see the AI version</p>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="px-4 py-4 border-t border-gray-800 space-y-3 flex-shrink-0">
            <p className="text-gray-500 text-xs uppercase tracking-widest">AI Controls</p>

            <label className="block space-y-1">
              <span className="text-xs text-gray-400">Leonardo style preset</span>
              <select
                value={leonardoStyle}
                onChange={(e) => updateStyle(e.target.value as LeonardoStyle)}
                className="w-full px-3 py-1.5 rounded-lg bg-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {LEONARDO_STYLES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Strength (sketch ↔ AI freedom)</span>
                <span>{strength.toFixed(2)}</span>
              </div>
              <input type="range" min="0.1" max="1" step="0.05" value={strength}
                onChange={(e) => updateStrength(parseFloat(e.target.value))}
                className="w-full accent-indigo-500" />
            </label>

            <label className="block space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Guidance (prompt adherence)</span>
                <span>{guidance.toFixed(1)}</span>
              </div>
              <input type="range" min="0.5" max="20" step="0.5" value={guidance}
                onChange={(e) => updateGuidance(parseFloat(e.target.value))}
                className="w-full accent-indigo-500" />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
