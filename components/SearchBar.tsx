import React from 'react'
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  searchTerm: string
  handleSearch: (value: string) => void
}

export function SearchBar({ searchTerm, handleSearch }: SearchBarProps) {
  return (
    <Input
      type="text"
      placeholder="Search items..."
      value={searchTerm}
      onChange={(e) => handleSearch(e.target.value)}
      className="max-w-sm"
    />
  )
}