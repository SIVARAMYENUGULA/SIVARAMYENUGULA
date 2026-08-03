import * as React from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './input'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SortValue = string | number | boolean | null | undefined

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  filterable?: boolean
  render?: (item: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T) => void
  className?: string
  searchable?: boolean
  searchPlaceholder?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  className,
  searchable = false,
  searchPlaceholder = 'Search...',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string>('')
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data
    return data.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  }, [data, searchQuery])

  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey] as SortValue
      const bVal = b[sortKey] as SortValue
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortKey, sortDir])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider',
                      col.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                      col.width
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        <span className="inline-flex">
                          {sortKey === col.key ? (
                            sortDir === 'asc' ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    No results found
                  </td>
                </tr>
              ) : (
                sortedData.map((item, i) => (
                  <tr
                    key={i}
                    className={cn(
                      'transition-colors hover:bg-muted/20',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-sm text-foreground/80">
                        {col.render ? col.render(item) : String(item[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{sortedData.length} results</span>
      </div>
    </div>
  )
}
