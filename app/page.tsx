'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const DynamicGameItemFilter = dynamic(() => import('@/components/GameItemFilter'), {
  ssr: false,
})

const ClientPage = dynamic(() => import('@/components/ClientPage'), {
  ssr: false,
})

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Game Item Filter</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ClientPage>
          {(searchParams) => (
            <DynamicGameItemFilter initialSearchParams={searchParams} />
          )}
        </ClientPage>
      </Suspense>
    </main>
  )
}