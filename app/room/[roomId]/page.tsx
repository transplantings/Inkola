import dynamic from 'next/dynamic'

// Disable SSR for the game room — tldraw and partysocket need the browser
const GameRoom = dynamic(() => import('@/components/GameRoom').then((m) => m.GameRoom), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-white text-xl">
      Loading game...
    </div>
  ),
})

export default function RoomPage({ params }: { params: { roomId: string } }) {
  return <GameRoom roomId={params.roomId} />
}
