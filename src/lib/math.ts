import type { DataMeta, Player, SeasonKey } from '@/types'
import { FAM_NOUN, ROLE_FAMILY } from '@/lib/constants'

/* ==================================================================
   Ported computations — replicated exactly from the original app
   (index.html lines 640–701). No new analytics math.
=================================================================== */

/** Percentile rank 0–99 of `value` within `arr` (count <= value), capped at 99. */
export function pctRank(value: number | null, arr: number[]): number | null {
  if (value == null || !arr.length) return null
  let c = 0
  for (const x of arr) if (x <= value) c++
  return Math.min(99, Math.round((c / arr.length) * 100))
}

export function defaultWeights(pos: string, meta: DataMeta | null): Record<string, number> {
  return (meta && meta.groupWeights && meta.groupWeights[pos]) || {}
}

/**
 * A player's overall = weighted average of baked group ratings. Weights are the
 * per-player live edit when set, else the baked per-player default, else the
 * position default — same precedence as the original (lines 644–649).
 */
export function effectiveWeights(
  p: Player,
  edits: Record<string, { weights?: Record<string, number> | null }>,
  meta: DataMeta | null,
): Record<string, number> {
  const ed = edits[p.id || ''] || {}
  if (ed.weights && Object.keys(ed.weights).length) return ed.weights
  if (p && p.weights && Object.keys(p.weights).length) return p.weights
  return defaultWeights(p.pos, meta)
}

/** Weighted average of group ratings for one benchmark (falls back to 'all'). */
export function overallFor(p: Player, bench: string, weights?: Record<string, number>, meta?: DataMeta | null): number | null {
  const sc = p.sc && (p.sc[bench] || p.sc.all)
  if (!sc) return null
  const g = sc.g || {}
  const w = weights || defaultWeights(p.pos, meta ?? null)
  let num = 0
  let den = 0
  for (const k in g) {
    const ww = k in w ? w[k] : 0
    const gv = g[k]
    if (ww > 0 && gv != null) {
      num += gv * ww
      den += ww
    }
  }
  return den > 0 ? num / den : null
}

/** Pool = players of the same position family in the benchmark league (or all). */
export function famPool(fam: string, bench: string, pool: Player[]): Player[] {
  return pool.filter((p) => ROLE_FAMILY[p.pos] === fam && (bench === 'all' || p.league === bench))
}

/** Percentile rank of a player's overall within their position-family pool. */
export function overallPct(
  p: Player,
  bench: string,
  weights: Record<string, number>,
  pool: Player[],
  meta: DataMeta | null,
): number | null {
  const fam = ROLE_FAMILY[p.pos]
  const me = overallFor(p, bench, weights, meta)
  if (me == null || !fam) return null
  return pctRank(
    me,
    famPool(fam, bench, pool)
      .map((x) => overallFor(x, bench, weights, meta))
      .filter((v): v is number => v != null),
  )
}

/** Percentile rank of one group rating within the position pool (radar — average sits at 50). */
export function groupPctRank(p: Player, g: string, bench: string, pool: Player[]): number | null {
  const fam = ROLE_FAMILY[p.pos]
  const sc = p.sc[bench] || p.sc.all
  const me = sc && sc.g ? sc.g[g] : null
  if (me == null || !fam) return null
  return pctRank(
    me,
    famPool(fam, bench, pool)
      .map((x) => {
        const s = x.sc[bench] || x.sc.all
        return s && s.g ? s.g[g] : null
      })
      .filter((v): v is number => v != null),
  )
}

/** Most statistically-similar pool players (same family, nearest by group ratings). */
export function similarTo(p: Player, n: number, pool: Player[]): Player[] {
  const fam = ROLE_FAMILY[p.pos]
  const bg = (p.sc && p.sc.all && p.sc.all.g) || {}
  const keys = Object.keys(bg)
  if (!fam || !keys.length) return []
  return famPool(fam, 'all', pool)
    .filter((x) => !(x.name === p.name && x.team === p.team))
    .map((x) => {
      const g = (x.sc.all && x.sc.all.g) || {}
      let s = 0
      let c = 0
      keys.forEach((k) => {
        const gv = g[k]
        const bv = bg[k]
        if (gv != null && bv != null) {
          const d = bv - gv
          s += d * d
          c++
        }
      })
      return { x, d: c ? Math.sqrt(s / c) : Infinity }
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((o) => o.x)
}

/* ---------------- seasons ---------------- */

/** Season-adjusted copy of an Our Player ('current' | 'previous' | 'combined'). */
export function seasonOf(p: Player, key: SeasonKey): Player {
  if (key === 'previous' && p && p.previous) return Object.assign({}, p, p.previous)
  if (key === 'combined' && p && p.combined) return Object.assign({}, p, p.combined)
  return p
}

export function seasonLabel(key: SeasonKey): string {
  return key === 'previous' ? 'Previous' : key === 'combined' ? 'Past 2 seasons' : 'Current'
}

/** The season that shows an Our Player best: higher-rated of Current vs Past 2 Seasons. */
export function bestSeason(
  p: Player,
  edits: Record<string, { weights?: Record<string, number> | null }>,
  meta: DataMeta | null,
): SeasonKey {
  if (!p || !p.combined) return 'current'
  const w = effectiveWeights(p, edits, meta)
  const cur = overallFor(seasonOf(p, 'current'), 'all', w, meta)
  const comb = overallFor(seasonOf(p, 'combined'), 'all', w, meta)
  return comb != null && (cur == null || comb > cur) ? 'combined' : 'current'
}

/* ---------------- bands & copy ---------------- */

/** A percentile rank as an exact scouting band: 97th -> "Top 3%". */
export function bandNum(pct: number | null): number | null {
  if (pct == null) return null
  return Math.max(1, 100 - pct)
}

export function topBand(pct: number | null): string {
  const n = bandNum(pct)
  return n == null ? '' : 'Top ' + n + '%'
}

/** Plain-English name for the benchmark pool. */
export function benchPhrase(bench: string): string {
  return bench === 'all' ? 'top European leagues' : bench
}

export function benchShort(l: string): string {
  return l === 'UK Championship' ? 'Championship' : l
}

/* ---------------- small formatters (ported) ---------------- */

export function ord(n: number | null): string {
  if (n == null) return ''
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function cap(s: string | null | undefined): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return 'n/a'
  const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return String(s)
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m[2] - 1]
  return +m[3] + ' ' + mon + ' ' + m[1]
}

export function initials(n: string | null | undefined): string {
  return (n || '')
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** "Limited minutes" warning when a player has fewer than 6 stat groups. */
export function lowData(p: Player): boolean {
  return Object.keys(p.tech_groups || {}).length < 6
}

export const fmtStat = (v: number | null | undefined): string => {
  if (v == null) return 'n/a'
  const r = Math.round(v * 100) / 100
  return String(r)
}

/** Strip the "lower is better" arrow from metric labels for display. */
export const cleanLabel = (s: string): string => String(s).replace(/\s*↓\s*$/, '')

/* ---------------- season-over-season growth (PDF + profile) ---------------- */

export interface Growth {
  dOverall: number
  ups: { g: string; d: number }[]
}

/**
 * Growth vs previous season: overall rank change + improved group ratings
 * (gains of >= 3 points, top 6). Ported from the original (lines 1364–1374).
 */
export function growthFor(
  p: Player,
  bench: string,
  pool: Player[],
  edits: Record<string, { weights?: Record<string, number> | null }>,
  meta: DataMeta | null,
): Growth | null {
  if (!p || !p.previous) return null
  const prev = Object.assign({}, p, p.previous)
  const eff = effectiveWeights(p, edits, meta)
  const cp = overallPct(p, bench, eff, pool, meta)
  const pp = overallPct(prev, bench, eff, pool, meta)
  const dOverall = cp != null && pp != null ? cp - pp : 0
  const cs = p.sc[bench] || p.sc.all
  const ps = prev.sc[bench] || prev.sc.all
  const cg = (cs && cs.g) || {}
  const pg = (ps && ps.g) || {}
  const ups = Object.keys(cg)
    .filter((g) => pg[g] != null && cg[g] != null)
    .map((g) => ({ g, d: Math.round(((cg[g] as number) - (pg[g] as number)) * 100) }))
    .filter((x) => x.d >= 3)
    .sort((a, b) => b.d - a.d)
    .slice(0, 6)
  return { dOverall, ups }
}

export function hasGrowth(
  p: Player,
  bench: string,
  pool: Player[],
  edits: Record<string, { weights?: Record<string, number> | null }>,
  meta: DataMeta | null,
): boolean {
  const g = growthFor(p, bench, pool, edits, meta)
  return !!(g && (g.dOverall > 0 || g.ups.length))
}

export function famNoun(p: Player): string {
  return FAM_NOUN[ROLE_FAMILY[p.pos] || 'MID']
}