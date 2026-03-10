import dynamic from 'next/dynamic'

const TestView = dynamic(() => import('@/components/TestView').then((m) => m.TestView), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-white text-xl">
      Loading…
    </div>
  ),
})

export default function TestPage() {
  return <TestView />
}
