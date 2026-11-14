import { Skeleton } from "@/components/ui/skeleton"

/**
 * Shown in place of a page whose code is still being downloaded. It only appears when
 * the site is opened directly on such a page; header and footer are already there.
 */
export function PageLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
