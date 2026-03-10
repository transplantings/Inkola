'use client'

import { useEffect, useRef, useState } from 'react'
import PartySocket from 'partysocket'
import type { GameState, ClientMessage, ServerMessage } from '@/lib/types'
import { DrawerView } from './DrawerView'
import { GuesserView } from './GuesserView'
import { WordSelection } from './WordSelection'
import { RoundSummary } from './RoundSummary'
import { GameOver } from './GameOver'

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999'

interface Props {
  roomId: string
}

export function GameRoom({ roomId }: Props) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [myId, setMyId] = useState('')
  const [strength, setStrength] = useState(0.55)
  const [guidanceScale, setGuidanceScale] = useState(1.5)
  const socketRef = useRef<PartySocket | null>(null)

  useEffect(() => {
    const playerName = localStorage.getItem('playerName') || 'Player'
    const socket = new PartySocket({ host: PARTYKIT_HOST, room: roomId })
    socketRef.current = socket

    socket.addEventListener('open', () => {
      setMyId(socket.id)
      socket.send(JSON.stringify({ type: 'join', name: playerName } satisfies ClientMessage))
    })

    socket.addEventListener('message', (e: MessageEvent) => {
      const msg = JSON.parse(e.data) as ServerMessage
      if (msg.type === 'state') setGameState(msg.state)
    })

    return () => socket.close()
  }, [roomId])

  const send = (msg: ClientMessage) => socketRef.current?.send(JSON.stringify(msg))

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-gray-600 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">Connecting to room {roomId}…</p>
        </div>
      </div>
    )
  }

  const isDrawer = gameState.drawerIds.includes(myId)
  const isActiveDrawer = gameState.activeDrawerId === myId
  const isHost = gameState.players.find((p) => p.id === myId)?.isHost ?? false

  // --- Lobby ---
  if (gameState.phase === 'lobby') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full space-y-5 shadow-2xl">
          <div className="text-center space-y-1">
            <p className="text-gray-400 text-sm uppercase tracking-widest">Room</p>
            <h2 className="text-3xl font-extrabold text-white tracking-widest">{roomId}</h2>
            <p className="text-gray-500 text-xs">Share this code with your friends</p>
          </div>

          <div className="space-y-2">
            {gameState.players.map((p) => (
              <div key={p.id} className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-xl">
                <span className="flex-1 text-white font-medium">{p.name}</span>
                {p.isHost && (
                  <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full">Host</span>
                )}
                {p.id === myId && <span className="text-xs text-gray-400">you</span>}
              </div>
            ))}
          </div>

          {isHost && gameState.players.length >= 2 && (
            <div className="space-y-2 pt-2">
              <p className="text-gray-400 text-sm text-center">Choose game mode:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => send({ type: 'start_game', mode: 'solo' })}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
                >
                  Solo Draw
                </button>
                {gameState.players.length >= 3 && (
                  <button
                    onClick={() => send({ type: 'start_game', mode: 'coop' })}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
                  >
                    Co-op Draw
                  </button>
                )}
              </div>
            </div>
          )}

          {gameState.players.length < 2 && (
            <p className="text-yellow-400 text-sm text-center">Need at least 2 players to start</p>
          )}
          {!isHost && gameState.players.length >= 2 && (
            <p className="text-gray-500 text-sm text-center">Waiting for host to start…</p>
          )}
        </div>
      </div>
    )
  }

  // --- Word selection ---
  if (gameState.phase === 'word-selection') {
    if (isDrawer) {
      return (
        <WordSelection
          words={gameState.wordChoices}
          aiStyle={gameState.aiStyle}
          onSelect={(word) => send({ type: 'select_word', word })}
        />
      )
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white text-2xl font-semibold">Waiting for drawer to pick a word…</p>
      </div>
    )
  }

  // --- Drawing ---
  if (gameState.phase === 'drawing') {
    if (isDrawer) {
      return (
        <DrawerView
          state={gameState}
          myId={myId}
          isActive={isActiveDrawer}
          strength={strength}
          guidanceScale={guidanceScale}
          onStrengthChange={setStrength}
          onGuidanceScaleChange={setGuidanceScale}
          onAiImage={(imageUrl, sketch) => send({ type: 'ai_image', imageUrl, sketch })}
        />
      )
    }
    return <GuesserView state={gameState} myId={myId} onGuess={(text) => send({ type: 'guess', text })} />
  }

  // --- Round summary ---
  if (gameState.phase === 'round-summary') {
    return <RoundSummary state={gameState} myId={myId} isHost={isHost} onNextRound={() => send({ type: 'next_round' })} />
  }

  // --- Game over ---
  if (gameState.phase === 'game-over') {
    return (
      <GameOver
        state={gameState}
        myId={myId}
        isHost={isHost}
        onPlayAgain={() => send({ type: 'play_again' })}
      />
    )
  }

  return null
}
