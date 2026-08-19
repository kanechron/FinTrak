interface IconProps {
  className?: string
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" fill="none" className={className}>
      <path
        d="M2.5 3.5H11.5M5.25 3.5V2.25C5.25 1.83579 5.58579 1.5 6 1.5H8C8.41421 1.5 8.75 1.83579 8.75 2.25V3.5M6 6.25V9.75M8 6.25V9.75M3.5 3.5L4 11.25C4 11.6642 4.33579 12 4.75 12H9.25C9.66421 12 10 11.6642 10 11.25L10.5 3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function FilterIcon({ className }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" fill="none" className={className}>
      <path
        d="M1.5 2H12.5L8.25 6.75V11L5.75 12V6.75L1.5 2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function KebabIcon({ className }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor" className={className}>
      <circle cx="7" cy="2.5" r="1.15" />
      <circle cx="7" cy="7" r="1.15" />
      <circle cx="7" cy="11.5" r="1.15" />
    </svg>
  )
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" fill="none" className={className}>
      <rect x="2.5" y="6.25" width="9" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M4.25 6.25V4.25C4.25 2.73122 5.48122 1.5 7 1.5C8.51878 1.5 9.75 2.73122 9.75 4.25V6.25"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="7" cy="9" r="0.9" fill="currentColor" />
    </svg>
  )
}

export function UnlockIcon({ className }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" fill="none" className={className}>
      <rect x="2.5" y="6.25" width="9" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M4.25 6.25V4.25C4.25 2.73122 5.48122 1.5 7 1.5C8.29403 1.5 9.38314 2.38312 9.66977 3.5786"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="7" cy="9" r="0.9" fill="currentColor" />
    </svg>
  )
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" fill="none" className={className}>
      <path
        d="M9.5 1.5L12.5 4.5L4.5 12.5H1.5V9.5L9.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.75 3.25L10.75 6.25"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
