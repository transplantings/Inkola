import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Pictionary',
  description: 'Draw, AI transforms, friends guess!',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 min-h-screen">{children}</body>
    </html>
  )
}
