/** The site mark: a route arc between two airports. Same drawing as public/favicon.svg. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M7.5 21.5C11 9.5 19.5 7 24.5 12.5"
        fill="none"
        strokeWidth="2.2"
        strokeLinecap="round"
        className="stroke-brand"
      />
      <circle cx="7.5" cy="21.5" r="2.5" className="fill-primary-foreground" />
      <circle cx="24.5" cy="12.5" r="2.5" className="fill-primary-foreground" />
    </svg>
  )
}
