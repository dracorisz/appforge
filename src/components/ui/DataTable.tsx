import React from "react";

export function DataTable<T>({ columns, data, onRowClick, getRowId }: { columns: { key: string; header: string; render?: (row: T) => React.ReactNode; width?: string }[]; data: T[]; onRowClick?: (row: T) => void; getRowId?: (row: T) => string }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border/70">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-muted/35">
          <tr className="border-b border-border/70">
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }} className="h-9 whitespace-nowrap px-4 text-sm font-semibold text-muted-foreground">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={getRowId ? getRowId(row) : idx} onClick={() => onRowClick?.(row)} className={`border-b border-border/60 transition-colors last:border-b-0 hover:bg-accent/45 ${onRowClick ? "cursor-pointer" : ""}`}>
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2 text-sm text-foreground">
                  {col.render ? col.render(row) : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
