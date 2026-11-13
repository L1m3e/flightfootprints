/** One invalid field in a validation error, as the backend reports it. */
export interface FieldProblem {
  field: string
  /** Stable identifier of the failed rule, e.g. "NotBlank" or "UnknownAirport". */
  code: string
  /** English description, used when the UI has no translation for the code. */
  message: string
}

/**
 * Error body defined by RFC 9457 ("Problem Details for HTTP APIs").
 * The backend answers every failed request in this shape.
 */
export interface ProblemDetail {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: FieldProblem[]
}

/** Thrown for every response outside the 2xx range. */
export class ApiError extends Error {
  readonly status: number
  /** The parsed error body, or null when the response was not a problem document. */
  readonly problem: ProblemDetail | null

  constructor(status: number, problem: ProblemDetail | null) {
    super(problem?.detail ?? problem?.title ?? `HTTP ${status}`)
    this.name = "ApiError"
    this.status = status
    this.problem = problem
  }

  get fieldProblems(): FieldProblem[] {
    return this.problem?.errors ?? []
  }
}

const CSRF_COOKIE = "XSRF-TOKEN"
const CSRF_HEADER = "X-XSRF-TOKEN"
const ACCEPT = "application/json, application/problem+json"

function readCookie(name: string): string | null {
  const entry = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`))
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null
}

/**
 * The backend only accepts a POST, PUT or DELETE that repeats the value of the XSRF-TOKEN
 * cookie in a header. A script on another site can make the browser send our cookies,
 * but it cannot read them, so it cannot build this header.
 */
async function csrfToken(): Promise<string | null> {
  // Any GET makes the backend set the cookie. Normally the session check on page load
  // has already done that; this covers a write that happens before it finished.
  if (readCookie(CSRF_COOKIE) === null) {
    await fetch("/api/auth/me", { headers: { Accept: ACCEPT } })
  }
  return readCookie(CSRF_COOKIE)
}

async function readProblem(response: Response): Promise<ProblemDetail | null> {
  // A proxy or gateway in front of the backend may answer with HTML or plain text.
  if (!response.headers.get("Content-Type")?.includes("json")) return null
  try {
    return (await response.json()) as ProblemDetail
  } catch {
    return null
  }
}

async function request<T>(method: string, path: string, body?: BodyInit, contentType?: string): Promise<T> {
  const headers = new Headers({ Accept: ACCEPT })
  if (contentType) headers.set("Content-Type", contentType)
  if (method !== "GET") {
    const token = await csrfToken()
    if (token) headers.set(CSRF_HEADER, token)
  }

  // Paths are relative ("/api/..."), so requests go to whatever origin served the page:
  // the Vite dev server (which proxies them) in development, Spring Boot in production.
  // The session cookie is sent automatically because it is the same origin.
  const response = await fetch(path, { method, headers, body })
  if (!response.ok) {
    throw new ApiError(response.status, await readProblem(response))
  }
  // 204 No Content: nothing to parse.
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

function json(value: unknown): [BodyInit, string] {
  return [JSON.stringify(value), "application/json"]
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, ...(body === undefined ? [] : json(body))),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, ...json(body)),
  delete: (path: string) => request<void>("DELETE", path),
  /** Sends fields the way an HTML form does. Spring Security's form login expects this. */
  postForm: <T>(path: string, fields: Record<string, string>) =>
    request<T>("POST", path, new URLSearchParams(fields)),
}
