/** Same rule as the backend: a web address, with nothing after a space. */
const WEB_ADDRESS = /^https?:\/\/\S+$/i

/** What "github.com/someone" looks like: a host name with a dot, and maybe a path. */
const BARE_ADDRESS = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:\d+)?(\/\S*)?$/i

/**
 * Turns what was typed into the link field into the link to save.
 *
 * - Nothing typed: no link (null).
 * - "https://github.com/someone": taken as it is.
 * - "github.com/someone": people leave the "https://" out, so it is added.
 * - Anything else, such as "javascript:..." or a sentence: undefined, which the form
 *   reports as a mistake. The page turns the link into something a visitor can click, so
 *   only web addresses are accepted. The backend checks the same.
 */
export function linkFrom(typed: string): string | null | undefined {
  const text = typed.trim()
  if (text === "") return null
  if (WEB_ADDRESS.test(text)) return text
  if (BARE_ADDRESS.test(text)) return `https://${text}`
  return undefined
}

/** A link without its "https://" and without a slash at the end, to show next to a name. */
export function linkLabel(link: string): string {
  return link.replace(/^https?:\/\//i, "").replace(/\/$/, "")
}
