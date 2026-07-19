import type { PosFamily } from '@/types'

/* ------------------------------------------------------------------
   Position model — ported verbatim from the original app (index.html
   lines 659–669). These maps are the single source of truth shared by
   Comparison, Our Players and the PDF report.
------------------------------------------------------------------- */

export const ROLE_FAMILY: Record<string, PosFamily> = {
  CB: 'DEF', FB: 'DEF', CM6: 'MID', CM8: 'MID', CM10: 'MID', W: 'WING', SS: 'STR', TS: 'STR',
}

export const ROLE_LABEL: Record<string, string> = {
  CB: 'Centre Back', FB: 'Full Back', CM6: 'Defensive Mid', CM8: 'Central Mid',
  CM10: 'Attacking Mid', W: 'Winger', SS: 'Striker', TS: 'Target Striker',
}

/** Radar display framing per position family. */
export const FRAME: Record<PosFamily, string[]> = {
  DEF: ['Defending', 'Def Duelling', 'Aerial', 'Distribution', 'Progression', 'Ball Carrying'],
  MID: ['Progression', 'Distribution', 'Chance Creation', 'Ball Carrying', 'Defending', 'Atk Duelling'],
  WING: ['Dribbling', 'Chance Creation', 'Crossing', 'Ball Carrying', 'Atk Duelling', 'Goal Threat'],
  STR: ['Goal Threat', 'Striker Threat', 'Chance Creation', 'Aerial', 'Atk Duelling', 'Ball Carrying'],
}

/** Plain-language noun for a position family ("Top X% of …"). */
export const FAM_NOUN: Record<PosFamily, string> = {
  DEF: 'defenders', MID: 'midfielders', WING: 'wingers', STR: 'forwards',
}

/** Singular noun used in comparison legend copy. */
export const FAM_LABEL: Record<PosFamily, string> = {
  DEF: 'defender', MID: 'midfielder', WING: 'winger', STR: 'striker',
}

/* Chart palettes (ported from the original). */
export const PALETTE = ['#16A34A', '#2563EB', '#DC2626', '#CA8A04', '#9333EA', '#0891B2', '#DB2777', '#334155']
export const SIMI = ['#CA8A04', '#9333EA', '#0891B2', '#DB2777']
export const CMP_PAL = ['#2563EB', '#DC2626', '#9333EA', '#0891B2', '#DB2777', '#334155', '#EA580C']

export const GOLD = '#CA8A04'
export const GREY = '#9A9AA8'
export const CLOUD = '#C9CCD6'
export const GRID = '#E5E5EC'
export const GRID_SOFT = '#EFEFF4'
export const INK_SOFT = '#1F1F28'

/** PDF report toggleable sections (target clubs are internal only — never a section). */
export const PDF_SECTIONS: [string, string][] = [
  ['info', 'Player info'],
  ['rating', 'Rating'],
  ['radar', 'Radar'],
  ['development', 'Development'],
  ['strengths', 'Strengths'],
  ['weaknesses', 'Weaknesses'],
  ['scout', 'Scout report'],
  ['technical', 'Technical detail'],
]

export const MAX_COMPARE = 8
export const MAX_PDF_COMPARE = 6