export interface CalendarGridItem {
  id: string
  title: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  /** When set, the item renders as a link (auth calendar). */
  to?: string
  /** Done tasks render muted + strikethrough. */
  done?: boolean
}
