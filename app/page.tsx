'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

export default function LobbyPage() {
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const router = useRouter()

  const saveName = (n: string) => localStorage.setItem('playerName', n)

  const createRoom = () => {
    if (!name.trim()) return
    saveName(name.trim())
    router.push(`/room/${nanoid()}`)
  }

  const joinRoom = () => {
    if (!name.trim() || !roomCode.trim()) return
    saveName(name.trim())
    router.push(`/room/${roomCode.toUpperCase().trim()}`)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md space-y-6 shadow-2xl">
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">AI Pictionary</h1>
          <p className="text-gray-400">Draw rough sketches — AI makes them wild</p>
        </div>

        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createRoom()}
          className="w-full px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          maxLength={20}
          autoFocus
        />

        <button
          onClick={createRoom}
          disabled={!name.trim()}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
        >
          Create Room
        </button>

        <button
          onClick={() => router.push('/test')}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-xl transition-colors text-sm"
        >
          Test Mode (solo, no timer)
        </button>

        <div className="flex items-center gap-3 text-gray-500">
          <hr className="flex-1 border-gray-600" />
          <span className="text-sm">or</span>
          <hr className="flex-1 border-gray-600" />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-500 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
            maxLength={6}
          />
          <button
            onClick={joinRoom}
            disabled={!name.trim() || roomCode.length < 4}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
          >
            Join
          </button>
        </div>
      </div>
    </main>
  )
}
