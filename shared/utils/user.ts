/** Two-letter initials from a display name, for avatar fallbacks. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  const first = parts[0]
  if (!first) {
    return '?'
  }

  if (parts.length === 1) {
    return first.slice(0, 2).toUpperCase()
  }

  const last = parts[parts.length - 1] ?? first
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}
