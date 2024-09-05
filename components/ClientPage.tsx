'use client'

import { useSearchParams } from 'next/navigation'
import { ReactNode } from 'react'

interface ClientPageProps {
  children: (searchParams: string) => ReactNode
}

export default function ClientPage({ children }: ClientPageProps) {
  const searchParams = useSearchParams()
  return <>{children(searchParams ? searchParams.toString() : '')}</>
}