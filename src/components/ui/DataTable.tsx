import React from 'react'

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  getRowId
}: {
  columns: { key: string; header: string; render?: (row: T) => React.ReactNode; width?: string }[]
  data: T[]
  onRowClick?: (row: T) => void
  getRowId?: (row: T) => string
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-muted/35">
          <tr className="border-b border-border/80">
            {columns.map((col) => <th key={col.key} style={{ width: col.width }} className="h-11 whitespace-nowrap px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{col.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={getRowId ? getRowId(row) : idx}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-border/60 transition-[background-color,box-shadow] last:border-b-0 hover:bg-accent/45 ${onRowClick ? 'cursor-pointer hover:shadow-[inset_3px_0_0_hsl(var(--foreground)/0.18)]' : ''}`}
            >
              {columns.map((col) => <td key={col.key} className="px-4 py-3 text-foreground">{col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
