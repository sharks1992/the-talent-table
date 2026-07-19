import type { DataMeta, Player } from '@/types'

/* ==================================================================
   Data loading — same two-phase strategy as the original:
   Phase 1: roster.json (small) renders the roster ASAP.
   Phase 2: data.json (15 MB benchmark pool) with bounded retries.
=================================================================== */

export interface RosterFile {
  ourPlayers: Player[]
  tech_groups: { name: string; keys: { k: string; label: string }[] }[]
  group_weights: Record<string, Record<string, number>>
  leagues: string[]
}

export interface PoolFile extends RosterFile {
  players: Player[]
}

export interface LoadedRoster {
  meta: DataMeta
  bakedRoster: Player[]
}

function toMeta(j: RosterFile): DataMeta {
  return {
    techGroups: j.tech_groups || [],
    groupWeights: j.group_weights || {},
    leagues: j.leagues || [],
  }
}

/** Relative data URL — survives hosting under a subpath (e.g. GitHub Pages project sites). */
function dataUrl(name: string): string {
  return `${import.meta.env.BASE_URL}data/${name}`
}

/** Phase 1 — roster + metadata. Throws on failure so the caller can show an error.
    Default HTTP caching (not force-cache): the browser revalidates per the host's
    Cache-Control, so a redeploy can never pin a stale or broken data file. */
export async function fetchRoster(): Promise<LoadedRoster> {
  const r = await fetch(dataUrl('roster.json'))
  if (!r.ok) throw new Error('roster-load-failed')
  const j = (await r.json()) as RosterFile
  return { meta: toMeta(j), bakedRoster: j.ourPlayers || [] }
}

/** Phase 2 — full benchmark pool, up to 5 attempts with linear backoff (as the original). */
export async function fetchPool(): Promise<Player[]> {
  let lastErr: unknown = null
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const r = await fetch(dataUrl('data.json'))
      if (!r.ok) throw new Error('pool-load-failed')
      const j = (await r.json()) as PoolFile
      return j.players || []
    } catch (e) {
      lastErr = e
      await new Promise((res) => setTimeout(res, 700 * (attempt + 1)))
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('pool-load-failed')
}

/** Metadata fallback from the full file when roster.json itself failed. */
export async function fetchMetaFromPool(): Promise<LoadedRoster> {
  const r = await fetch(dataUrl('data.json'))
  if (!r.ok) throw new Error('data-load-failed')
  const j = (await r.json()) as PoolFile
  return { meta: toMeta(j), bakedRoster: j.ourPlayers || [] }
}