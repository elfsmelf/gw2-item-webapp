import React from 'react'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ColumnManagerProps {
  visibleColumns: Set<string>
  toggleColumn: (column: string) => void
}

export function ColumnManager({ visibleColumns, toggleColumn }: ColumnManagerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          Manage Columns
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandEmpty>No column found.</CommandEmpty>
          <CommandGroup>
            {['image', 'name', 'rarity', 'type', 'buy_price', 'sell_price', 'profit', 'roi'].map((column) => (
              <CommandItem
                key={column}
                onSelect={() => {
                  toggleColumn(column)
                  setOpen(false)
                }}
              >
                <div className={cn(
                  "mr-2 h-4 w-4 border border-primary rounded-sm",
                  visibleColumns.has(column) ? "bg-primary" : "bg-transparent"
                )} />
                {column}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}