import React from 'react'

export function LamatLogo({ className = 'h-5 w-5', ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Lamat logo"
      {...props}
    >
      <rect width="512" height="512" rx="112" fill="#090d16" />
      <circle cx="256" cy="256" r="140" fill="#4f46e5" opacity="0.25" />
      <polygon points="256,64 296,216 448,256 296,296 256,448 216,296 64,256 216,216" fill="#6366f1" />
      <polygon points="256,120 286,226 392,256 286,286 256,392 226,286 120,256 226,226" fill="#38bdf8" />
      <circle cx="256" cy="256" r="32" fill="#ffffff" />
      <circle cx="256" cy="256" r="16" fill="#38bdf8" />
    </svg>
  )
}
