'use client'

import { useCallback, useRef, useState } from 'react'
import { Tldraw, exportToBlob, Editor } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { pickRandomTest, GLOBAL_PROMPT_PREFIX } from '@/lib/wordPrompts'
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

  const [round, setRound] = useState<WordPrompt>(pickRandomTest)
  // null = show round.word; string = user-typed override
  const [customWord, setCustomWord] = useState<string | null>(null)
  const displayWord = customWord ?? round.word

  const [isGenerating, setIsGenerating] = useState(false)
  const [aiImage, setAiImage] = useState<string | null>(null)
  const [strength, setStrength] = useState(0.55)
  const [guidance, setGuidance] = useState(1.5)
  const [leonardoStyle, setLeonardoStyle] = useState<LeonardoStyle>('NONE')
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [customPromptText, setCustomPromptText] = useState('')
  const [showControls, setShowControls] = useState(false)

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
    // Pre-fill on first open if empty
    if (on && !customPromptTextRef.current) {
      updateCustomPromptText(roundRef.current.prompt)
    }
  }

  const updateStrength = (v: number) => { setStrength(v); strengthRef.current = v }
  const updateGuidance = (v: number) => { setGuidance(v); guidanceRef.current = v }
  const updateStyle = (v: LeonardoStyle) => { setLeonardoStyle(v); styleRef.current = v }

  const newRound = () => {
    const next = pickRandomTest(roundRef.current)
    setRound(next)
    roundRef.current = next
    setCustomWord(null)
    setAiImage(null)
    // Always sync custom prompt to the new word (whether textarea is open or not)
    updateCustomPromptText(next.prompt)
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
    editor.setCurrentTool('draw')
    editor.store.listen(
      () => {
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(runCapture, 400)
      },
      { source: 'user', scope: 'document' }
    )
  }, [runCapture])

  return (
    <div className="flex flex-col h-screen bg-gray-900 relative">

      {/* ── TOP BAR ── */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700">

        {/* Mobile top bar */}
        <div className="md:hidden px-3 py-1.5 space-y-1">
          <div className="flex items-center gap-2">
            {/* Word — label + input stacked, flex-1 */}
            <div className="flex-1 min-w-0">
              <p className="text-gray-500 text-[8px] uppercase tracking-widest leading-none">Draw this</p>
              <input
                value={displayWord}
                onChange={(e) => setCustomWord(e.target.value)}
                className="text-xs font-extrabold text-white bg-transparent border-b border-transparent hover:border-gray-600 focus:border-indigo-500 focus:outline-none w-full py-0 transition-colors truncate"
                placeholder="Type a word…"
              />
            </div>
            {/* Buttons */}
            <button
              onClick={newRound}
              className="flex-shrink-0 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded text-[9px] touch-manipulation"
            >
              New
            </button>
            <button
              onClick={() => toggleCustomPrompt(!useCustomPrompt)}
              className={`flex-shrink-0 px-2 py-0.5 rounded text-[9px] font-semibold border touch-manipulation
                ${useCustomPrompt ? 'bg-amber-500 border-amber-400 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}
            >
              {useCustomPrompt ? 'Prompt ✎' : 'Prompt'}
            </button>
            <a href="/" className="flex-shrink-0 text-[10px] text-gray-500 hover:text-gray-300 touch-manipulation">✕</a>
          </div>
          {useCustomPrompt && (
            <textarea
              value={customPromptText}
              onChange={(e) => updateCustomPromptText(e.target.value)}
              placeholder="Enter prompt keywords…"
              rows={2}
              className="w-full px-2 py-1 rounded bg-gray-700 text-white text-[10px] focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-gray-500 resize-none"
            />
          )}
        </div>

        {/* Desktop top bar */}
        <div className="hidden md:flex md:flex-col px-4 py-2 gap-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest leading-none mb-0.5">Draw this</p>
              <input
                value={displayWord}
                onChange={(e) => setCustomWord(e.target.value)}
                className="text-xl font-extrabold text-white bg-transparent border-b border-transparent hover:border-gray-600 focus:border-indigo-500 focus:outline-none w-full py-0 transition-colors"
                placeholder="Type a word…"
              />
            </div>
            <button
              onClick={newRound}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors text-xs whitespace-nowrap"
            >
              New Round
            </button>
            <button
              onClick={() => toggleCustomPrompt(!useCustomPrompt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap
                ${useCustomPrompt ? 'bg-amber-500 border-amber-400 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-amber-500 hover:text-amber-400'}`}
            >
              {useCustomPrompt ? 'Custom ✎' : 'Custom prompt'}
            </button>
            <a href="/" className="text-xs text-gray-600 hover:text-gray-400 underline whitespace-nowrap">← Back</a>
          </div>
          <div className="flex items-start gap-2">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest whitespace-nowrap pt-0.5">
              {useCustomPrompt ? 'Custom' : 'AI prompt'}
            </p>
            {useCustomPrompt ? (
              <textarea
                value={customPromptText}
                onChange={(e) => updateCustomPromptText(e.target.value)}
                placeholder="Enter custom prompt keywords…"
                rows={2}
                className="flex-1 px-3 py-1 rounded-lg bg-gray-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-500 resize-none"
              />
            ) : (
              <p className="flex-1 text-gray-300 text-xs italic pt-0.5 line-clamp-2">{round.prompt}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Canvas: full width on mobile (AI overlaid), 50% on desktop */}
        <div className="flex-1 relative md:border-r md:border-gray-700">
          <div className="absolute inset-0">
            <Tldraw onMount={handleMount} />
          </div>

          {/* Mobile AI overlay — 40vw square, top-right, floats above canvas */}
          <div
            className="md:hidden absolute z-10 rounded-2xl overflow-hidden shadow-2xl border-2 border-indigo-900/60 bg-gray-950"
            style={{ width: '40vw', height: '40vw', top: '10px', right: '10px' }}
          >
            {aiImage ? (
              <img src={aiImage} alt="AI" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isGenerating
                  ? <div className="w-7 h-7 border-2 border-gray-600 border-t-indigo-500 rounded-full animate-spin" />
                  : <p className="text-[9px] text-gray-600 text-center px-2 leading-tight">AI preview</p>
                }
              </div>
            )}
          </div>

          <div className="absolute bottom-2 left-2 text-xs text-gray-500 pointer-events-none z-10">Raw sketch</div>
        </div>

        {/* Desktop-only right panel */}
        <div className="hidden md:flex flex-1 flex-col bg-gray-950">
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

          {/* Desktop controls */}
          <div className="px-4 py-4 border-t border-gray-800 space-y-3 flex-shrink-0">
            <p className="text-gray-500 text-xs uppercase tracking-widest">AI Controls</p>
            <label className="block space-y-1">
              <span className="text-xs text-gray-400">Leonardo style preset</span>
              <select
                value={leonardoStyle}
                onChange={(e) => updateStyle(e.target.value as LeonardoStyle)}
                className="w-full px-3 py-1.5 rounded-lg bg-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {LEONARDO_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
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

      {/* ── MOBILE CONTROLS TOGGLE — overlays bottom of canvas ── */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 z-20">
        {showControls && (
          <div className="bg-gray-900/96 backdrop-blur border-t border-gray-700 px-3 pt-2 pb-1.5 space-y-1.5">
            <div className="flex gap-3">
              <label className="flex-1 space-y-0.5">
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>Strength</span><span>{strength.toFixed(2)}</span>
                </div>
                <input type="range" min="0.1" max="1" step="0.05" value={strength}
                  onChange={(e) => updateStrength(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500" />
              </label>
              <label className="flex-1 space-y-0.5">
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>Guidance</span><span>{guidance.toFixed(1)}</span>
                </div>
                <input type="range" min="0.5" max="20" step="0.5" value={guidance}
                  onChange={(e) => updateGuidance(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500" />
              </label>
            </div>
            <select value={leonardoStyle} onChange={(e) => updateStyle(e.target.value as LeonardoStyle)}
              className="w-full px-2 py-1 rounded bg-gray-800 text-white text-[10px] focus:outline-none">
              {LEONARDO_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        <button
          onClick={() => setShowControls(v => !v)}
          className="w-full py-1.5 bg-gray-800/95 backdrop-blur text-[10px] text-gray-400 font-semibold border-t border-gray-700 touch-manipulation"
        >
          {showControls ? '▾ Hide Controls' : '▴ AI Controls'}
        </button>
      </div>

    </div>
  )
}
