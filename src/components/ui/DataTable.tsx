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
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }} className="px-4 py-3 font-medium text-muted-foreground">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={getRowId ? getRowId(row) : idx}
              onClick={() => onRowClick?.(row)}
              className="border-b border-border hover:bg-accent/50 cursor-pointer"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-foreground">
                  {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
