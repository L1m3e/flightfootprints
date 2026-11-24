import { cn } from "cn"
import { LoaderCircle } from "lucide-react"
import { useTranslation } from "react-i18next"

/**
 * Fills the place of the map while there is nothing to see yet: first while the flights
 * are fetched, then while the map downloads its style and tiles, which takes a few
 * seconds on a phone. Without it that time is spent looking at an empty grey box.
 *
 * @param done the map is ready: this fades out and stops getting in the way of the map
 */
export function MapLoading({ done = false, className }: { done?: boolean; className?: string }) {
  const { t } = useTranslation()

  return (
    // <output> is announced by screen readers when it appears, like role="status". Once
    // the map is there, they skip it.
    <output
      aria-hidden={done}
      className={cn(
        "flex size-full flex-col items-center justify-center gap-3 bg-muted text-sm text-muted-foreground transition-opacity duration-300",
        // Faded out it is still in the page, so it must not catch clicks meant for the
        // map, and its animations stop instead of running unseen.
        done && "pointer-events-none opacity-0 **:[animation-play-state:paused]",
        className,
      )}
    >
      {/* A slow pulse over the whole box, so it reads as "working" even at a glance. */}
      <span aria-hidden="true" className="absolute inset-0 animate-pulse bg-foreground/5" />
      <LoaderCircle aria-hidden="true" className="relative size-6 animate-spin" />
      <span className="relative">{t("map.loading")}</span>
    </output>
  )
}
