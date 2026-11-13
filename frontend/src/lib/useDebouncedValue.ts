import { useEffect, useState } from "react"

/**
 * Returns `value`, but only after it has stopped changing for `delayMs`. Used so that
 * typing "shanghai" sends one search request instead of eight.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
