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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set("Accept", "application/json, application/problem+json")

  // Paths are relative ("/api/..."), so requests go to whatever origin served the page:
  // the Vite dev server (which proxies them) in development, Spring Boot in production.
  const response = await fetch(path, { ...init, headers })
  if (!response.ok) {
    throw new ApiError(response.status, await readProblem(response))
  }
  return (await response.json()) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
}
