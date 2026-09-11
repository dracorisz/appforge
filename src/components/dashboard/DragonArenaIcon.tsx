import React from 'react'

export function DragonArenaIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8.5 7h7a5.5 5.5 0 0 1 5.25 7.15l-1.2 3.8a2.2 2.2 0 0 1-3.55 1l-2.05-1.7h-3.9L8 18.95a2.2 2.2 0 0 1-3.55-1l-1.2-3.8A5.5 5.5 0 0 1 8.5 7Z" />
      <path d="M7.5 11v4M5.5 13h4" />
      <circle cx="16.5" cy="11.5" r=".8" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="14" r=".8" fill="currentColor" stroke="none" />
    </svg>
  )
}
