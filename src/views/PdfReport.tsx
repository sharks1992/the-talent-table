import type { DataMeta, EditsState, Player, SeasonKey } from '@/types'
import { I18N, type PdfLang } from '@/i18n'
import { ROLE_FAMILY } from '@/lib/constants'
import {
  cleanLabel,
  effectiveWeights,
  fmtDate,
  fmtStat,
  groupPctRank,
  growthFor,
  initials,
  overallPct,
  seasonOf,
  topBand,
} from '@/lib/math'
import './pdfReport.css'

/* ==================================================================
   The PDF report document — React-rendered (auto-escaped) port of the
   original render() (lines 1481–1525). Composed of `.pdf-unit` blocks
   so the exporter can avoid page breaks inside keep-together content.
   Target transfer clubs are internal only and never appear here.
=================================================================== */

export interface PdfReportProps {
  player: Player
  season: SeasonKey
  bench: string
  lang: PdfLang
  cmpPlayers: Player[]
  sections: Record<string, boolean>
  pool: Player[]
  meta: DataMeta | null
  edits: EditsState
  radarImg: string | null
}

function TechBlock({ p, g, bench, pool, lang, meta }: {
  p: Player
  g: string
  bench: string
  pool: Player[]
  lang: PdfLang
  meta: DataMeta | null
}) {
  const L = I18N[lang] || I18N.en
  const pc = groupPctRank(p, g, bench, pool)
  const w = pc == null ? 0 : pc
  const gm = meta?.techGroups.find((x) => x.name === g)
  const grp = p.tech_groups[g]
  const raws =
    gm && grp
      ? gm.keys
          .map((k, i) => (grp.v[i] == null ? null : { label: cleanLabel(k.label), value: fmtStat(grp.v[i]) }))
          .filter((x): x is { label: string; value: string } => !!x)
      : []
  return (
    <div className="tblk">
      <div className="t">
        <span>{L.groups[g] || g}</span>
        <span className="pc">{pc == null ? '' : pc}</span>
      </div>
      <div className="track">
        <div className="fill" style={{ width: w + '%' }} />
      </div>
      {raws.length > 0 && (
        <div className="raws">
          {raws.map((r, i) => (
            <span key={i}>
              {i > 0 ? ' · ' : ''}
              {r.label} <b>{r.value}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function SwCol({ items, title, cls }: { items: string[]; title: string; cls: 's' | 'w' }) {
  if (!items.length) return <div />
  return (
    <div>
      <h3>{title}</h3>
      <ul className={`sw ${cls}`} style={{ display: 'block' }}>
        {items.map((s, i) => (
          <li key={i}>
            <span className="d" />
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PdfReport({
  player: p,
  season,
  bench,
  lang,
  sections,
  pool,
  meta,
  edits,
  radarImg,
}: PdfReportProps) {
  const L = I18N[lang] || I18N.en
  const t = (k: keyof typeof L) => (L[k] as string) || (I18N.en[k] as string) || k
  const tg = (g: string) => L.groups[g] || g
  const tr = (r: string) => L.roles[r] || r
  const on = (k: string) => !!sections[k]

  const sp = seasonOf(p, season)
  const sc = sp.sc[bench] || sp.sc.all
  const eff = effectiveWeights(sp, edits, meta)
  const pcRank = overallPct(sp, bench, eff, pool, meta)
  const hgBadge = p.homegrown ? (
    <div className="hg">
      <span className="hg-badge">Homegrown {p.homegrown}</span>
    </div>
  ) : null

  const footVal = (f?: string | null): string => {
    const v = (f || '').toLowerCase()
    return v === 'right' ? L.right : v === 'left' ? L.left : v === 'both' ? L.both : f || 'n/a'
  }

  const facts: [string, string, typeof hgBadge?][] = [
    [t('position'), tr(sp.pos)],
    [t('club'), sp.team || 'n/a'],
    [t('age'), sp.age != null ? String(sp.age) : 'n/a'],
    [t('nationality'), sp.nationality || p.nationality || p.birth_country || 'n/a', hgBadge],
    [t('foot'), footVal(p.foot)],
    [t('height'), p.height ? p.height + ' cm' : 'n/a'],
    [t('minutes'), sp.minutes != null ? String(sp.minutes) : 'n/a'],
    [t('contract'), fmtDate(sp.contract_expires)],
    [t('league'), sp.league || 'n/a'],
  ]

  const str = (p.strengths || []).filter((x) => x && x.trim())
  const weak = (p.weaknesses || []).filter((x) => x && x.trim())
  const allGroups = Object.keys(I18N.en.groups)
  const techGroups = allGroups.filter((g) => sc && sc.g && sc.g[g] != null)
  const grow = season === 'current' ? growthFor(p, bench, pool, edits, meta) : null
  const date = new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : lang, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const famNoun = (L.fam || I18N.en.fam)[ROLE_FAMILY[sp.pos] || 'MID']
  const bandTxt = pcRank == null ? '' : topBand(pcRank) + ' ' + t('bandOf') + ' ' + famNoun

  // Technical detail: heading stays glued to the first row; later rows are
  // chunked into their own units so page breaks land between rows.
  const techFirst = techGroups.slice(0, 4)
  const techRest: string[][] = []
  for (let i = 4; i < techGroups.length; i += 6) techRest.push(techGroups.slice(i, i + 6))

  return (
    <div id="pdfReport">
      <div className="pdfr">
        {/* header */}
        <div className="pdf-unit">
          <div className="hd">
            <div className="lg">
              <span className="lgmark" role="img" aria-label="The Talent Table">
                TT
              </span>
              <b>The Talent Table</b>
            </div>
            <div className="meta">
              {t('report')}
              <br />
              {t('generated')} {date}
            </div>
          </div>
        </div>

        {/* hero: photo, identity, rating, facts */}
        <div className="pdf-unit">
          <div className="hero">
            <div className="ph" style={p.photo ? { backgroundImage: `url('${p.photo}')` } : undefined}>
              {p.photo ? null : <span className="ini">{initials(p.name)}</span>}
            </div>
            <div className="id">
              <h2>{p.name}</h2>
              <div className="role">{tr(sp.pos)}</div>
              <div className="club">
                {sp.team || ''}
                {sp.league ? ' · ' + sp.league : ''}
              </div>
              {on('rating') && (
                <>
                  <div className="rating">
                    <span className="big">{pcRank == null ? 'n/a' : pcRank}</span>
                    <span className="lbl">
                      {t('ttRating')}
                      <br />
                      {t('outOf100')}
                    </span>
                    {bandTxt && <span className="ratepill">{bandTxt}</span>}
                    {grow && grow.dOverall > 0 && (
                      <span className="delta">
                        ▲ +{grow.dOverall} pts {t('vsLastSeason')}
                      </span>
                    )}
                  </div>
                  <div className="rating-legend">{t('ratingLegend')}</div>
                </>
              )}
              {on('info') && (
                <div className="facts">
                  {facts.map(([k, v, badge], i) => (
                    <div className="f" key={i}>
                      <div className="k">{k}</div>
                      <div className="v">
                        {v}
                        {badge || null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* performance radar */}
        {on('radar') && radarImg && (
          <div className="pdf-unit blk">
            <h3>{t('performance')}</h3>
            <div className="perf">
              <img src={radarImg} alt="" />
            </div>
          </div>
        )}

        {/* development vs last season — chips carry pts, not % (ported bug fix) */}
        {on('development') && grow && (grow.dOverall > 0 || grow.ups.length > 0) && (
          <div className="pdf-unit blk">
            <h3>{t('development')}</h3>
            <div className="grow">
              {grow.dOverall > 0 && (
                <span className="g">
                  {t('rating')} +{grow.dOverall} pts
                </span>
              )}
              {grow.ups.map((u) => (
                <span className="g" key={u.g}>
                  {tg(u.g)} +{u.d} pts
                </span>
              ))}
            </div>
          </div>
        )}

        {/* strengths / weaknesses */}
        {((on('strengths') && str.length > 0) || (on('weaknesses') && weak.length > 0)) && (
          <div className="pdf-unit blk">
            <div className="sw">
              <SwCol items={on('strengths') ? str : []} title={t('strengths')} cls="s" />
              <SwCol items={on('weaknesses') ? weak : []} title={t('weaknesses')} cls="w" />
            </div>
          </div>
        )}

        {/* scout report */}
        {on('scout') && p.notes && p.notes.trim() && (
          <div className="pdf-unit blk">
            <h3>{t('scout')}</h3>
            <div className="notes">{p.notes}</div>
          </div>
        )}

        {/* technical detail */}
        {on('technical') && techFirst.length > 0 && (
          <div className="pdf-unit blk">
            <h3>{t('technical')}</h3>
            <div className="tech">
              {techFirst.map((g) => (
                <TechBlock key={g} p={sp} g={g} bench={bench} pool={pool} lang={lang} meta={meta} />
              ))}
            </div>
          </div>
        )}
        {on('technical') &&
          techRest.map((chunk, i) => (
            <div className="pdf-unit blk" key={i} style={{ marginTop: 13 }}>
              <div className="tech">
                {chunk.map((g) => (
                  <TechBlock key={g} p={sp} g={g} bench={bench} pool={pool} lang={lang} meta={meta} />
                ))}
              </div>
            </div>
          ))}

        {/* footer */}
        <div className="pdf-unit">
          <div className="ft">
            <span>The Talent Table · {t('confidential')}</span>
            <span>{date}</span>
          </div>
        </div>
      </div>
    </div>
  )
}