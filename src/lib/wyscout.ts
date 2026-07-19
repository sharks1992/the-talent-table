import type { DataMeta, Player, ScoreEntry } from '@/types'
import { ROLE_FAMILY } from '@/lib/constants'

/* ==================================================================
   Wyscout paste parser — column map ported exactly from the original
   (index.html lines 1216–1268). The original scored parsed rows on a
   server function; this rebuild scores client-side against the raw
   metric distributions of the loaded benchmark pool (see below).
=================================================================== */

export const TT_TECH_MAP: [string, string[][]][] = [
  ['Goal Threat', [['Non-penalty goals per 90'], ['xG per 90'], ['Goal conversion, %']]],
  ['Striker Threat', [['Shots per 90'], ['Shots on target, %'], ['Touches in box per 90']]],
  ['Chance Creation', [['xA per 90'], ['Key passes per 90'], ['Passes to penalty area per 90']]],
  ['Crossing', [['Crosses per 90'], ['Accurate crosses, %'], ['Deep completed crosses per 90']]],
  ['Progression', [['Accurate progressive passes, %'], ['Passes to final third per 90'], ['Accurate passes to final third, %'], ['Deep completions per 90']]],
  ['Distribution', [['Accurate passes, %'], ['Accurate forward passes, %'], ['Accurate long passes, %']]],
  ['Atk Duelling', [['Offensive duels per 90'], ['Offensive duels won, %']]],
  ['Dribbling', [['Dribbles per 90'], ['Successful dribbles, %']]],
  ['Ball Carrying', [['Progressive runs per 90'], ['Accelerations per 90']]],
  ['Defending', [['PAdj Interceptions'], ['Successful defensive actions per 90'], ['PAdj Sliding tackles'], ['Shots blocked per 90']]],
  ['Def Duelling', [['Defensive duels per 90'], ['Defensive duels won, %']]],
  ['Aerial', [['Aerial duels per 90'], ['Aerial duels won, %'], ['Head goals per 90']]],
  ['Discipline', [['Yellow cards per 90'], ['Red cards per 90'], ['Fouls per 90']]],
]

export const TT_POS_BUCKET: Record<string, string> = {
  cb: 'CB', rcb: 'CB', lcb: 'CB', 'centre back': 'CB', 'central defender': 'CB', rcb3: 'CB', lcb3: 'CB',
  rb: 'FB', lb: 'FB', rwb: 'FB', lwb: 'FB', 'right back': 'FB', 'left back': 'FB', 'wing back': 'FB', rb5: 'FB', lb5: 'FB',
  dmf: 'CM6', rdmf: 'CM6', ldmf: 'CM6', 'defensive midfielder': 'CM6',
  cmf: 'CM8', rcmf: 'CM8', lcmf: 'CM8', 'central midfielder': 'CM8', midfielder: 'CM8', rcmf3: 'CM8', lcmf3: 'CM8',
  amf: 'CM10', 'attacking midfielder': 'CM10',
  lw: 'W', rw: 'W', lm: 'W', rm: 'W', lwf: 'W', rwf: 'W', lamf: 'W', ramf: 'W', winger: 'W',
  cf: 'SS', st: 'SS', 'centre forward': 'SS', striker: 'SS', forward: 'SS',
}

/** Wyscout number parsing — handles European decimal commas (ported line 1239). */
export function ttNum(v: unknown): number | null {
  if (v == null) return null
  let s = String(v).trim()
  if (!s || /^(n\/a|na|-|null)$/i.test(s)) return null
  s = s.replace(/[%\s]/g, '')
  s = /^-?\d+,\d+$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '')
  const n = parseFloat(s)
  return isFinite(n) ? n : null
}

export interface ParsedRow extends Omit<Player, 'id'> {}

export interface SkippedRow {
  name: string
  reason: string
}

export interface ParseResult {
  players: ParsedRow[]
  skipped: SkippedRow[]
}

/**
 * Parse pasted Wyscout export rows (header + data rows). Same rules as the
 * original — a row must map to a known position bucket and carry at least one
 * usable stat group — but dropped rows are reported back instead of silently
 * ignored (intended improvement).
 */
export function parseWyscout(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) return { players: [], skipped: [] }
  const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ','
  const head = lines[0].split(sep).map((h) => h.trim())
  const H = head.map((h) => h.toLowerCase())
  const ci = (names: string[]): number => {
    for (const n of names) {
      const i = H.indexOf(n.toLowerCase())
      if (i >= 0) return i
    }
    return -1
  }
  const cName = ci(['Player', 'Name'])
  const cTeam = ci(['Team within selected timeframe', 'Team', 'Club'])
  const cPos = ci(['Position', 'Pos'])
  const cAge = ci(['Age'])
  const cNat = ci(['Passport country', 'Birth country'])
  const cFoot = ci(['Foot'])
  const cHt = ci(['Height'])
  const cWt = ci(['Weight'])
  const cContract = ci(['Contract expires'])
  const cMin = ci(['Minutes played'])
  const cMatch = ci(['Matches played'])
  const gi = TT_TECH_MAP.map(([g, slots]) => [g, slots.map((al) => ci(al))] as [string, number[]])

  const players: ParsedRow[] = []
  const skipped: SkippedRow[] = []
  for (let r = 1; r < lines.length; r++) {
    const c = lines[r].split(sep).map((x) => x.trim())
    const nm = cName >= 0 ? c[cName] : undefined
    if (!nm || /^(player|name)$/i.test(nm)) continue
    const posRaw = cPos >= 0 ? (c[cPos] || '').split(/[,/]/)[0].trim().toLowerCase() : ''
    const pos = TT_POS_BUCKET[posRaw] || null
    const tg: Record<string, { v: (number | null)[] }> = {}
    gi.forEach(([g, idxs]) => {
      const v = idxs.map((i) => (i >= 0 ? ttNum(c[i]) : null))
      if (v.some((x) => x != null)) tg[g] = { v }
    })
    const row: ParsedRow = {
      name: nm,
      team: cTeam >= 0 ? c[cTeam] : null,
      pos: pos || '',
      positions: pos ? [pos] : [],
      age: cAge >= 0 ? Math.round(ttNum(c[cAge]) || 0) || null : null,
      nationality: cNat >= 0 ? c[cNat] : null,
      foot: cFoot >= 0 ? (c[cFoot] || '').toLowerCase() : null,
      height: cHt >= 0 ? ttNum(c[cHt]) : null,
      weight: cWt >= 0 ? ttNum(c[cWt]) : null,
      contract_expires: cContract >= 0 && /\d{4}/.test(c[cContract] || '') ? c[cContract] : null,
      minutes: cMin >= 0 ? Math.round(ttNum(c[cMin]) || 0) || null : null,
      matches: cMatch >= 0 ? Math.round(ttNum(c[cMatch]) || 0) || null : null,
      tech_groups: tg,
      sc: {},
    }
    if (!pos) {
      skipped.push({ name: nm, reason: 'unrecognized position' })
      continue
    }
    if (!Object.keys(tg).length) {
      skipped.push({ name: nm, reason: 'no usable stats in the mapped columns' })
      continue
    }
    players.push(row)
  }
  return { players, skipped }
}

export function slugify(n: string): string {
  return (n || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

/* ==================================================================
   Client-side scoring (replaces the original POST /api/score):
   for each parsed metric, its percentile vs the raw values of
   same-position-family pool players; group rating = average of the
   group's metric percentiles; overall = group ratings weighted by the
   position bucket's group_weights. Computed for 'all' + every league
   benchmark so imported players behave like baked ones.
=================================================================== */

function percentile01(value: number, pool: number[], inverted: boolean): number | null {
  if (!pool.length) return null
  let c = 0
  for (const x of pool) {
    if (inverted ? x >= value : x <= value) c++
  }
  return c / pool.length
}

export function scoreWyscoutPlayers(
  rows: ParsedRow[],
  pool: Player[],
  meta: DataMeta,
): Player[] {
  const benchmarks = ['all', ...meta.leagues]
  // Metric inversion flags from the metadata labels (↓ = lower is better).
  const inverted: Record<string, boolean[]> = {}
  meta.techGroups.forEach((g) => {
    inverted[g.name] = g.keys.map((k) => /↓\s*$/.test(k.label))
  })

  return rows.map((row) => {
    const fam = ROLE_FAMILY[row.pos]
    const weights = meta.groupWeights[row.pos] || {}
    const sc: Record<string, ScoreEntry> = {}

    for (const bench of benchmarks) {
      const benchPool = pool.filter(
        (p) => ROLE_FAMILY[p.pos] === fam && (bench === 'all' || p.league === bench),
      )
      const gOut: Record<string, number | null> = {}
      for (const [gName, tg] of Object.entries(row.tech_groups)) {
        const groupMetaIdx = meta.techGroups.findIndex((g) => g.name === gName)
        if (groupMetaIdx < 0) continue
        const nKeys = meta.techGroups[groupMetaIdx].keys.length
        const parts: number[] = []
        for (let mi = 0; mi < Math.min(tg.v.length, nKeys); mi++) {
          const v = tg.v[mi]
          if (v == null) continue
          const poolVals: number[] = []
          for (const pp of benchPool) {
            const pv = pp.tech_groups[gName]?.v[mi]
            if (pv != null) poolVals.push(pv)
          }
          const pct = percentile01(v, poolVals, !!inverted[gName]?.[mi])
          if (pct != null) parts.push(pct)
        }
        if (parts.length) {
          gOut[gName] = Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 10000) / 10000
        }
      }
      // Overall: same weighting rule as overallFor (weights > 0 only).
      let num = 0
      let den = 0
      for (const k in gOut) {
        const ww = k in weights ? weights[k] : 0
        const gv = gOut[k]
        if (ww > 0 && gv != null) {
          num += gv * ww
          den += ww
        }
      }
      const t = den > 0 ? Math.round((num / den) * 10000) / 10000 : null
      sc[bench] = { t, g: gOut }
    }

    return { ...row, sc } as Player
  })
}