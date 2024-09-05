import GameItemFilter from '@/components/GameItemFilter'

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Game Item Filter</h1>
      <GameItemFilter />
    </div>
  )
}