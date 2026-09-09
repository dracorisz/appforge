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
      <path d="M12 3c2.2 0 4.1 1.1 5.2 2.8l2.6.2-1.7 2.1c.2.6.3 1.2.3 1.9 0 4-2.9 7.2-6.4 7.2S5.6 14 5.6 10c0-.7.1-1.3.3-1.9L4.2 6l2.6-.2A6.1 6.1 0 0 1 12 3Z" />
      <path d="m8.4 8.8 2.1 1.1L12 8.2l1.5 1.7 2.1-1.1" />
      <path d="M9.2 12.5c.8.6 1.7.9 2.8.9s2-.3 2.8-.9" />
      <path d="M8.3 17.2 6.8 21l5.2-2.2 5.2 2.2-1.5-3.8" />
    </svg>
  )
}
