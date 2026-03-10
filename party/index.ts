import type * as Party from 'partykit/server'
import { WORDS } from '../lib/words'
import type { GameState, GameMode, AiStyle, Player, ChatMessage, ClientMessage } from '../lib/types'

const ROUND_DURATION = 60
const COOP_TURN_DURATION = 5
const COOP_TURNS_EACH = 4 // 4 turns × 5s each = 20s per drawer, 40s total
const SUMMARY_DURATION = 6

interface ServerState extends GameState {
  drawerOrder: string[]
  drawerOrderIndex: number
  usedWords: string[]
}

function pickWords(usedWords: string[]): string[] {
  const available = WORDS.filter((w) => !usedWords.includes(w))
  const pool = available.length >= 3 ? available : WORDS
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

export default class GameRoom implements Party.Server {
  state: ServerState
  timer: ReturnType<typeof setInterval> | null = null

  constructor(readonly room: Party.Room) {
    this.state = this.freshState()
  }

  freshState(): ServerState {
    return {
      phase: 'lobby',
      mode: 'solo',
      players: [],
      drawerIds: [],
      activeDrawerId: null,
      currentWord: '',
      wordChoices: [],
      aiStyle: 'none',
      timeLeft: 0,
      coopTurnTimeLeft: 0,
      coopTurnCount: 0,
      round: 0,
      totalRounds: 0,
      scores: {},
      aiImage: null,
      correctGuessers: [],
      chat: [],
      roundSketch: null,
      drawerOrder: [],
      drawerOrderIndex: 0,
      usedWords: [],
    }
  }

  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ type: 'state', state: this.clientState() }))
  }

  onClose(conn: Party.Connection) {
    this.state.players = this.state.players.filter((p) => p.id !== conn.id)
    if (this.state.players.length > 0 && !this.state.players.some((p) => p.isHost)) {
      this.state.players[0].isHost = true
    }
    this.broadcast()
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage
    try {
      msg = JSON.parse(message)
    } catch {
      return
    }

    switch (msg.type) {
      case 'join':
        this.handleJoin(sender, msg.name)
        break
      case 'start_game':
        this.handleStartGame(sender, msg.mode)
        break
      case 'select_word':
        this.handleSelectWord(sender, msg.word)
        break
      case 'guess':
        this.handleGuess(sender, msg.text)
        break
      case 'ai_image':
        this.handleAiImage(sender, msg.imageUrl, msg.sketch)
        break
      case 'next_round':
        this.handleNextRound(sender)
        break
      case 'play_again':
        this.handlePlayAgain(sender)
        break
    }
  }

  handleJoin(conn: Party.Connection, name: string) {
    const existing = this.state.players.find((p) => p.id === conn.id)
    if (existing) {
      existing.name = name.slice(0, 20)
    } else {
      const isHost = this.state.players.length === 0
      const player: Player = { id: conn.id, name: name.slice(0, 20), isHost }
      this.state.players.push(player)
      this.state.scores[conn.id] = 0
    }
    this.broadcast()
  }

  handleStartGame(conn: Party.Connection, mode: GameMode) {
    const player = this.state.players.find((p) => p.id === conn.id)
    if (!player?.isHost) return
    if (this.state.players.length < 2) return

    this.state.mode = mode
    this.state.round = 0
    this.state.usedWords = []

    const ids = this.state.players.map((p) => p.id)
    if (mode === 'solo') {
      this.state.drawerOrder = ids
      this.state.totalRounds = ids.length
    } else {
      // Co-op: first two players draw together
      this.state.drawerOrder = ids.slice(0, 2)
      this.state.totalRounds = 1
    }

    this.state.drawerOrderIndex = 0
    this.startRound()
  }

  startRound() {
    this.stopTimer()
    this.state.round++
    this.state.aiImage = null
    this.state.roundSketch = null
    this.state.correctGuessers = []
    this.state.chat = []

    this.state.wordChoices = pickWords(this.state.usedWords)
    this.state.aiStyle = 'none'

    if (this.state.mode === 'solo') {
      const drawerId = this.state.drawerOrder[this.state.drawerOrderIndex % this.state.drawerOrder.length]
      this.state.drawerIds = [drawerId]
      this.state.activeDrawerId = drawerId
    } else {
      this.state.drawerIds = [...this.state.drawerOrder]
      this.state.activeDrawerId = this.state.drawerIds[0]
      this.state.coopTurnCount = 0
      this.state.coopTurnTimeLeft = COOP_TURN_DURATION
    }

    this.state.phase = 'word-selection'
    this.broadcast()
  }

  handleSelectWord(conn: Party.Connection, word: string) {
    if (!this.state.drawerIds.includes(conn.id)) return
    if (this.state.phase !== 'word-selection') return
    if (!this.state.wordChoices.includes(word)) return

    this.state.currentWord = word
    this.state.usedWords.push(word)
    this.state.phase = 'drawing'
    this.state.timeLeft = this.state.mode === 'coop' ? COOP_TURN_DURATION * COOP_TURNS_EACH * 2 : ROUND_DURATION
    this.startTimer()
    this.broadcast()
  }

  startTimer() {
    this.stopTimer()
    this.timer = setInterval(() => {
      if (this.state.phase === 'drawing') {
        this.state.timeLeft = Math.max(0, this.state.timeLeft - 1)

        if (this.state.mode === 'coop') {
          this.state.coopTurnTimeLeft = Math.max(0, this.state.coopTurnTimeLeft - 1)
          if (this.state.coopTurnTimeLeft <= 0) {
            this.state.coopTurnCount++
            const totalTurns = COOP_TURNS_EACH * 2
            if (this.state.coopTurnCount >= totalTurns) {
              this.endRound()
              return
            } else {
              const idx = this.state.coopTurnCount % 2
              this.state.activeDrawerId = this.state.drawerIds[idx]
              this.state.coopTurnTimeLeft = COOP_TURN_DURATION
            }
          }
        }

        if (this.state.timeLeft <= 0) {
          this.endRound()
          return
        }
      }
      this.broadcast()
    }, 1000)
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  handleGuess(conn: Party.Connection, text: string) {
    if (this.state.phase !== 'drawing') return
    if (this.state.drawerIds.includes(conn.id)) return
    if (this.state.correctGuessers.includes(conn.id)) return

    const player = this.state.players.find((p) => p.id === conn.id)
    if (!player) return

    const isCorrect = text.trim().toLowerCase() === this.state.currentWord.toLowerCase()

    const msg: ChatMessage = {
      playerId: conn.id,
      playerName: player.name,
      text: isCorrect ? '✓ Got it!' : text.slice(0, 80),
      correct: isCorrect,
      timestamp: Date.now(),
    }
    this.state.chat = [...this.state.chat.slice(-49), msg]

    if (isCorrect) {
      this.state.correctGuessers.push(conn.id)
      const elapsed = (this.state.mode === 'coop' ? COOP_TURN_DURATION * COOP_TURNS_EACH * 2 : ROUND_DURATION) - this.state.timeLeft
      const points = Math.max(100, 500 - elapsed * 8)
      this.state.scores[conn.id] = (this.state.scores[conn.id] || 0) + points

      const guessers = this.state.players.filter((p) => !this.state.drawerIds.includes(p.id))
      if (this.state.correctGuessers.length >= guessers.length) {
        this.endRound()
        return
      }
    }

    this.broadcast()
  }

  handleAiImage(conn: Party.Connection, imageUrl: string, sketch: string) {
    if (!this.state.drawerIds.includes(conn.id)) return
    this.state.aiImage = imageUrl
    if (sketch) this.state.roundSketch = sketch
    this.broadcast()
  }

  endRound() {
    this.stopTimer()
    if (this.state.correctGuessers.length > 0) {
      for (const id of this.state.drawerIds) {
        this.state.scores[id] = (this.state.scores[id] || 0) + 200
      }
    }
    this.state.phase = 'round-summary'
    this.state.timeLeft = 0
    this.broadcast()
  }

  handleNextRound(conn: Party.Connection) {
    if (this.state.phase !== 'round-summary') return
    // Allow the host or the next drawer to advance
    const isHost = this.state.players.find((p) => p.id === conn.id)?.isHost
    const nextDrawerIdx = this.state.drawerOrderIndex + 1
    const nextDrawerId = this.state.drawerOrder[nextDrawerIdx % this.state.drawerOrder.length]
    const isNextDrawer = conn.id === nextDrawerId
    if (!isHost && !isNextDrawer) return
    this.advanceToNextRound()
  }

  advanceToNextRound() {
    this.stopTimer()
    this.state.drawerOrderIndex++
    if (this.state.round >= this.state.totalRounds) {
      this.state.phase = 'game-over'
      this.broadcast()
    } else {
      this.startRound()
    }
  }

  handlePlayAgain(conn: Party.Connection) {
    const player = this.state.players.find((p) => p.id === conn.id)
    if (!player?.isHost) return
    const players = this.state.players
    const scores: Record<string, number> = {}
    players.forEach((p) => (scores[p.id] = 0))
    this.state = { ...this.freshState(), players, scores }
    this.broadcast()
  }

  clientState(): GameState {
    const { drawerOrder, drawerOrderIndex, usedWords, ...rest } = this.state
    return rest
  }

  broadcast() {
    const msg = JSON.stringify({ type: 'state', state: this.clientState() })
    this.room.broadcast(msg)
  }
}
