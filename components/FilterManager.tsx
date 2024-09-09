import React from 'react'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronsUpDown, X } from "lucide-react"

interface FilterManagerProps {
  filters: FilterEntry[]
  addFilter: (key: string) => void
  updateFilter: (index: number, value: [string, string]) => void
  removeFilter: (index: number) => void
  getUniqueValues: (column: string) => string[]
}

export function FilterManager({ filters, addFilter, updateFilter, removeFilter, getUniqueValues }: FilterManagerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            Add Filter
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search filters..." />
            <CommandEmpty>No filter found.</CommandEmpty>
            <CommandGroup>
              {['rarity', 'type'].map((column) => (
                <CommandItem
                  key={column}
                  onSelect={() => {
                    addFilter(column)
                    setOpen(false)
                  }}
                >
                  {column}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap gap-4">
        {filters.map((filter, index) => (
          <div key={index} className="flex items-center gap-2 bg-gray-100 p-2 rounded">
            <span>{filter.key}:</span>
            <Select
              value={filter.value[0]}
              onValueChange={(value) => updateFilter(index, [value, filter.value[1]])}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a value" />
              </SelectTrigger>
              <SelectContent>
                {getUniqueValues(filter.key).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => removeFilter(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </>
  )
}