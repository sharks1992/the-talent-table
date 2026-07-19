import type { EditsState } from '@/types'

/* ==================================================================
   Roster persistence — the original synced edits + photos through a
   Netlify Blobs backend (`/api/state`). The rebuild has no backend, so
   this module gives the same purpose (durable roster state across
   sessions and reloads) via localStorage, with a saved/saving
   indicator for the sidebar.
=================================================================== */

const KEY = 'tt.edits.v1'

export function loadEdits(): EditsState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const j = JSON.parse(raw)
    return (j && j.data) || {}
  } catch {
    return {}
  }
}

export function persistEdits(data: EditsState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, data }))
    return true
  } catch {
    // Quota errors (large photos) surface as a failed save — caller shows honest state.
    return false
  }
}

const VIEW_KEY = 'tt.view'

export function loadView(): string {
  try {
    return localStorage.getItem(VIEW_KEY) || 'players'
  } catch {
    return 'players'
  }
}

export function persistView(v: string): void {
  try {
    localStorage.setItem(VIEW_KEY, v)
  } catch {
    /* ignore */
  }
}