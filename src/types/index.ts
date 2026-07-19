/* Shared data model — mirrors the baked shapes in roster.json / data.json exactly. */

export type PosFamily = 'DEF' | 'MID' | 'WING' | 'STR'
export type SeasonKey = 'current' | 'previous' | 'combined'

/** Baked score block for one benchmark: overall t (0..1) + per-group ratings (0..1). */
export interface ScoreEntry {
  t: number | null
  g: Record<string, number | null>
}

/** Raw metric values for one technical group (aligned with TechGroupMeta.keys). */
export interface TechGroupValues {
  v: (number | null)[]
}

export interface Player {
  id?: string
  name: string
  team?: string | null
  league?: string
  pos: string
  positions?: string[]
  age?: number | null
  nationality?: string | null
  birth_country?: string | null
  minutes?: number | null
  matches?: number | null
  contract_expires?: string | null
  foot?: string | null
  height?: number | null
  weight?: number | null
  market_value?: number | null
  homegrown?: string | null
  photo?: string | null
  strengths?: string[]
  weaknesses?: string[]
  notes?: string
  transferClubs?: string[]
  weights?: Record<string, number> | null
  sc: Record<string, ScoreEntry>
  tech_groups: Record<string, TechGroupValues>
  previous?: Partial<Player>
  combined?: Partial<Player>
  /** true for roster players injected into the search pool */
  _our?: boolean
  /** true for players added via Wyscout paste (stored in edits, not baked) */
  _added?: boolean
}

export interface TechGroupKey {
  k: string
  label: string
}

export interface TechGroupMeta {
  name: string
  keys: TechGroupKey[]
}

export interface DataMeta {
  techGroups: TechGroupMeta[]
  groupWeights: Record<string, Record<string, number>>
  leagues: string[]
}

/** Editable overlay stored in localStorage (same purpose as the original Blobs store). */
export interface PlayerEdit extends Partial<Player> {
  id: string
  _added?: boolean
}

export type EditsState = Record<string, PlayerEdit>

export type SaveStatus = 'saved' | 'saving'

/** Axis option for the comparison scatter/bar pickers. */
export interface AxisOpt {
  key: string
  label: string
  kind: 'total' | 'group' | 'raw'
  group?: string
  mi?: number
}