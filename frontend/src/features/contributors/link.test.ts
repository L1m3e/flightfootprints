import { describe, expect, it } from "vitest"

import { linkFrom, linkLabel } from "@/features/contributors/link"

describe("linkFrom", () => {
  it.each(["", "   "])("is no link when nothing was typed (%j)", (typed) => {
    expect(linkFrom(typed)).toBeNull()
  })

  it.each([
    ["https://github.com/someone", "https://github.com/someone"],
    ["  https://github.com/someone  ", "https://github.com/someone"],
    ["http://example.com", "http://example.com"],
    ["HTTPS://Example.com/Page", "HTTPS://Example.com/Page"],
  ])("takes a web address as it is: %j", (typed, expected) => {
    expect(linkFrom(typed)).toBe(expected)
  })

  it.each([
    ["github.com/someone", "https://github.com/someone"],
    ["example.com", "https://example.com"],
    ["sub.example.co.uk/a/b?c=d", "https://sub.example.co.uk/a/b?c=d"],
    ["localhost.example:8080/x", "https://localhost.example:8080/x"],
  ])("adds the https:// that was left out of %j", (typed, expected) => {
    expect(linkFrom(typed)).toBe(expected)
  })

  // The page makes the link clickable, so nothing a browser would run may get through.
  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "mailto:someone@example.com",
    "ftp://example.com/file",
    "//example.com",
    "https://example.com/a b",
    "just some words",
    "someone",
    "https://",
  ])("refuses %j", (typed) => {
    expect(linkFrom(typed)).toBeUndefined()
  })
})

describe("linkLabel", () => {
  it("drops the scheme and a slash at the end", () => {
    expect(linkLabel("https://github.com/someone")).toBe("github.com/someone")
    expect(linkLabel("http://example.com/")).toBe("example.com")
    expect(linkLabel("https://example.com/a/b/")).toBe("example.com/a/b")
  })
})
