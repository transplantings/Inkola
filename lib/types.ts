export type GamePhase = 'lobby' | 'word-selection' | 'drawing' | 'round-summary' | 'game-over'
export type GameMode = 'solo' | 'coop'
export type AiStyle = 'watercolour' | 'pencil' | 'cubist' | 'none'

export interface Player {
  id: string
  name: string
  isHost: boolean
}

export interface ChatMessage {
  playerId: string
  playerName: string
  text: string
  correct: boolean
  timestamp: number
}

export interface GameState {
  phase: GamePhase
  mode: GameMode
  players: Player[]
  drawerIds: string[]
  activeDrawerId: string | null
  currentWord: string
  wordChoices: string[]
  aiStyle: AiStyle
  timeLeft: number
  coopTurnTimeLeft: number
  coopTurnCount: number
  round: number
  totalRounds: number
  scores: Record<string, number>
  aiImage: string | null
  correctGuessers: string[]
  chat: ChatMessage[]
  roundSketch: string | null
}

export type ClientMessage =
  | { type: 'join'; name: string }
  | { type: 'start_game'; mode: GameMode }
  | { type: 'select_word'; word: string }
  | { type: 'guess'; text: string }
  | { type: 'ai_image'; imageUrl: string; sketch: string }
  | { type: 'next_round' }
  | { type: 'play_again' }

export type ServerMessage =
  | { type: 'state'; state: GameState }
  | { type: 'error'; message: string }
