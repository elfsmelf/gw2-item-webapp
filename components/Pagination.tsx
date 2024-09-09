import React from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaginationProps {
  currentPage: number
  totalPages: number
  limit: number
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  isLoading: boolean
  lastUpdated: string | null
}

export function Pagination({ currentPage, totalPages, limit, setPage, setLimit, isLoading, lastUpdated }: PaginationProps) {
  return (
    <div>
      <div className="flex justify-between items-center">
        <Button 
          onClick={() => setPage(Math.max(currentPage - 1, 1))} 
          disabled={currentPage === 1 || isLoading}
        >
          Previous Page
        </Button>
        <span>
          {isLoading 
            ? 'Loading...' 
            : `Page ${currentPage} of ${totalPages}`
          }
        </span>
        <Button 
          onClick={() => setPage(currentPage + 1)} 
          disabled={isLoading || (currentPage === totalPages)}
        >
          Next Page
        </Button>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <Select
          value={limit.toString()}
          onValueChange={(value) => {
            setLimit(Number(value))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Items per page" />
          </SelectTrigger>
          <SelectContent>
            {[20, 50, 100, 200, 500].map((value) => (
              <SelectItem key={value} value={value.toString()}>
                {value} items
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {lastUpdated && (
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </div>
        )}
      </div>
    </div>
  )
}