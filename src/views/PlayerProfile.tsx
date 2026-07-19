import { useEffect, useMemo, useRef, useState } from 'react'
import { Radar } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import { useApp } from '@/state/AppContext'
import {
  bandNum,
  benchPhrase,
  bestSeason,
  cap,
  cleanLabel,
  effectiveWeights,
  defaultWeights,
  fmtDate,
  fmtStat,
  groupPctRank,
  initials,
  ord,
  overallPct,
  seasonLabel,
  seasonOf,
  similarTo,
  topBand,
} from '@/lib/math'
import { FAM_NOUN, FRAME, GOLD, GREY, PALETTE, ROLE_FAMILY, ROLE_LABEL, SIMI } from '@/lib/constants'
import { radarScaleOpts } from '@/lib/charts'
import { fileToPhotoDataUrl } from '@/lib/photo'
import type { SeasonKey } from '@/types'
import { BenchPills } from '@/components/BenchPills'
import { SegmentedControl } from '@/components/SegmentedControl'
import { TagEditor } from '@/components/TagEditor'
import { WeightsEditor } from '@/components/WeightsEditor'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const GREEN = PALETTE[0]

export function PlayerProfile({ id, onBack }: { id: string; onBack: () => void }) {
  const { getPlayer, edits, meta, pool, patch, poolState } = useApp()
  const base = getPlayer(id)
  const [dBench, setDBench] = useState('all')
  const [dSeason, setDSeason] = useState<SeasonKey>('current')
  const [dSimilar, setDSimilar] = useState(false)
  const [weightsOpen, setWeightsOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Default to the season that shows the player best whenever a different player opens.
  useEffect(() => {
    if (base) {
      setDBench('all')
      setDSeason(bestSeason(base, edits, meta))
      setDSimilar(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const p = base
  const vp = useMemo(() => (p ? seasonOf(p, dSeason) : p), [p, dSeason])

  const weights = useMemo(() => (p ? effectiveWeights(p, edits, meta) : {}), [p, edits, meta])

  /* ---------- overall rating (rank 0–99 vs the position family) ---------- */
  const pc = vp ? overallPct(vp, dBench, weights, pool, meta) : null
  const fam = (vp && ROLE_FAMILY[vp.pos]) || 'MID'
  const noun = FAM_NOUN[fam]

  const growth = useMemo(() => {
    if (!p || dSeason !== 'current' || !p.previous || pc == null) return 0
    const prev = Object.assign({}, p, p.previous)
    const bw = effectiveWeights(p, edits, meta)
    const cp = overallPct(p, dBench, bw, pool, meta)
    const pp = overallPct(prev, dBench, bw, pool, meta)
    return cp != null && pp != null ? cp - pp : 0
  }, [p, dSeason, pc, dBench, edits, meta, pool])

  /* ---------- profile radar ---------- */
  const radarData = useMemo<ChartData<'radar', (number | null)[], string> | null>(() => {
    if (!vp || !pool.length) return null
    const groups = FRAME[ROLE_FAMILY[vp.pos] || 'MID']
    // BUG FIX vs the original: missing group ratings render as a gap, not as 0th percentile.
    const me = groups.map((g) => groupPctRank(vp, g, dBench, pool))
    const ds: ChartData<'radar', (number | null)[], string>['datasets'] = [
      {
        label: vp.name,
        data: me,
        borderColor: GREEN,
        backgroundColor: GREEN + '24',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: GREEN,
      },
    ]
    if (dSimilar) {
      similarTo(vp, 3, pool).forEach((s, i) =>
        ds.push({
          label: s.name + ' · ' + (s.team || ''),
          data: groups.map((g) => groupPctRank(s, g, dBench, pool)),
          borderColor: SIMI[i % SIMI.length],
          borderDash: [3, 3],
          borderWidth: 1.2,
          pointRadius: 0,
          backgroundColor: 'transparent',
        }),
      )
    }
    ds.push({
      label: 'Top scores',
      data: groups.map(() => 99),
      borderColor: GOLD,
      borderDash: [2, 3],
      borderWidth: 1.4,
      pointRadius: 0,
      backgroundColor: 'transparent',
    })
    ds.push({
      label: 'Average',
      data: groups.map(() => 50),
      borderColor: GREY,
      borderDash: [5, 4],
      borderWidth: 1.4,
      pointRadius: 0,
      backgroundColor: 'transparent',
    })
    return { labels: groups.slice(), datasets: ds }
  }, [vp, pool, dBench, dSimilar])

  const radarOptions = useMemo<ChartOptions<'radar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: { r: radarScaleOpts() },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label: (c) => c.dataset.label + ': ' + (c.parsed.r == null ? 'n/a' : ord(c.parsed.r) + ' pct'),
          },
        },
      },
    }),
    [],
  )

  if (!p || !vp) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" /> Back to roster
        </Button>
        <div className="mt-6 text-[14px] text-muted-foreground">Player not found.</div>
      </div>
    )
  }

  const ed = p.id ? edits[p.id] : undefined
  const NA = 'n/a'
  const facts: [string, string, boolean?][] = [
    ['Position', ROLE_LABEL[vp.pos] || vp.pos],
    ['Club', vp.team || NA],
    ['Age', vp.age != null ? String(vp.age) : NA],
    ['Nationality', vp.nationality || p.nationality || p.birth_country || NA, !!p.homegrown],
    ['Foot', cap(p.foot) || NA],
    ['Height', p.height ? p.height + ' cm' : NA],
    ['Minutes', vp.minutes != null ? String(vp.minutes) : NA],
    ['Contract', fmtDate(vp.contract_expires)],
  ]

  const onPhoto = (f: File) => {
    fileToPhotoDataUrl(f)
      .then((dataUrl) => patch(id, { photo: dataUrl }))
      .catch(() => {})
  }

  const seasonOpts: { value: SeasonKey; label: string }[] = p.previous
    ? ([
        { value: 'current', label: 'Current' },
        ...(p.combined ? [{ value: 'combined' as SeasonKey, label: 'Past 2 seasons' }] : []),
        { value: 'previous', label: 'Previous' },
      ] as { value: SeasonKey; label: string }[])
    : []

  const mergedWeights = Object.assign({}, defaultWeights(vp.pos, meta), ed?.weights || {})

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 mb-4">
        <ChevronLeft className="h-4 w-4" /> Back to roster
      </Button>

      {/* ---------- identity + facts ---------- */}
      <div className="mb-5 flex flex-col gap-6 sm:flex-row">
        <div className="w-full flex-none sm:w-[200px]">
          <div className="relative flex aspect-[5/6] items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
            {p.photo ? (
              <img src={p.photo} alt="" className="h-full w-full object-cover object-[50%_16%]" />
            ) : (
              <span className="display-title text-[72px] font-bold text-slate-300">{initials(p.name)}</span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files && e.target.files[0]
              if (f) onPhoto(f)
              e.target.value = ''
            }}
          />
          <Button variant="outline" size="sm" className="mt-2.5 w-full" onClick={() => fileRef.current?.click()}>
            {p.photo ? 'Replace photo' : 'Upload photo'}
          </Button>
          {p.photo && (
            <Button variant="ghost" size="sm" className="mt-1.5 w-full" onClick={() => patch(id, { photo: null })}>
              Remove photo
            </Button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="display-title text-[34px] uppercase leading-none tracking-[0.02em]">{p.name}</h1>
          <div className="mt-1.5 text-[13.5px] text-muted-foreground">
            {vp.team || ''}
            {vp.league ? ' · ' + vp.league : ''}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rating-numeral text-[52px] text-primary">{pc == null ? 'n/a' : pc}</span>
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Overall rating
              <br />
              out of 100
            </span>
            {pc != null && (
              <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[12px] font-bold">
                {topBand(pc)} of {noun}
              </span>
            )}
            {growth > 0 && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-bold text-primary">
                ▲ +{growth} pts vs last season
              </span>
            )}
          </div>
          {pc != null && (
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-muted-foreground">
              Rank vs {noun} in the {benchPhrase(dBench)} (higher is better, 99 is the top). {topBand(pc)} = better
              than {100 - (bandNum(pc) || 0)}% of them.
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {facts.map(([k, v, hg]) => (
              <div key={k} className="rounded-lg bg-white px-3 py-2 shadow-card border border-border">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{k}</div>
                <div className="mt-0.5 text-[13px] font-bold">
                  {v}
                  {hg && (
                    <span className="ml-1.5 inline-block rounded-full bg-emerald-600 px-2 py-px align-middle text-[9.5px] font-bold text-white">
                      Homegrown {p.homegrown}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- radar card ---------- */}
      <div className="tt-card mb-5 p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Benchmark</span>
          <BenchPills value={dBench} onChange={setDBench} />
          {seasonOpts.length > 0 && (
            <>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground min-[640px]:ml-3">
                Season
              </span>
              <SegmentedControl
                ariaLabel="Season"
                options={seasonOpts.map((o) => ({ value: o.value, label: o.label }))}
                value={dSeason}
                onChange={(v) => setDSeason(v as SeasonKey)}
              />
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDSimilar(!dSimilar)}
            className={cn('ml-auto', dSimilar && 'border-primary/40 bg-emerald-50 text-primary hover:bg-emerald-50')}
          >
            Similar players: {dSimilar ? 'on' : 'off'}
          </Button>
        </div>
        {poolState === 'ready' && radarData ? (
          <div className="mx-auto aspect-square w-full max-w-[440px]">
            <Radar data={radarData} options={radarOptions} />
          </div>
        ) : (
          <div className="flex h-[280px] items-center justify-center text-[13px] text-muted-foreground">
            {poolState === 'error' ? 'Benchmark pool unavailable — ratings cannot be computed.' : 'Loading player data…'}
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-muted-foreground">
          <span>
            Percentile per metric vs {dBench === 'all' ? 'All leagues' : dBench} {ROLE_LABEL[vp.pos] || vp.pos}s. Top
            scores = best in class (99), Average = 50.
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0 w-5 border-t-2 border-dashed" style={{ borderColor: GOLD }} /> Top scores
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0 w-5 border-t-2 border-dashed" style={{ borderColor: GREY }} /> Average
          </span>
        </div>
      </div>

      {/* ---------- strengths / weaknesses ---------- */}
      <div className="mb-5 grid gap-5 md:grid-cols-2">
        <div className="tt-card p-4 sm:p-5">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Strengths</div>
          <TagEditor
            values={p.strengths || []}
            onChange={(arr) => patch(id, { strengths: arr })}
            addLabel="Add strength"
            tone="s"
          />
        </div>
        <div className="tt-card p-4 sm:p-5">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Weaknesses</div>
          <TagEditor
            values={p.weaknesses || []}
            onChange={(arr) => patch(id, { weaknesses: arr })}
            addLabel="Add weakness"
            tone="w"
          />
        </div>
      </div>

      {/* ---------- target clubs (internal) ---------- */}
      <div className="tt-card mb-5 p-4 sm:p-5">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
          Potential transfer clubs
        </div>
        <TagEditor
          values={p.transferClubs || []}
          onChange={(arr) => patch(id, { transferClubs: arr })}
          addLabel="Add club"
          tone="c"
        />
      </div>

      {/* ---------- scout notes ---------- */}
      <div className="tt-card mb-5 p-4 sm:p-5">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
          Scout report &amp; context
        </div>
        <textarea
          value={p.notes || ''}
          onChange={(e) => patch(id, { notes: e.target.value })}
          placeholder="Context for the report: playing style, role fit, development, why these clubs"
          className="min-h-[120px] w-full rounded-md border border-input bg-white px-3 py-2 text-[13.5px] leading-relaxed shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </div>

      {/* ---------- raw technical stats ---------- */}
      <div className="tt-card mb-5 p-4 sm:p-5">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
          Technical stats
        </div>
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          {(meta?.techGroups || [])
            .filter((g) => vp.tech_groups[g.name])
            .map((g) => {
              const grpPct = groupPctRank(vp, g.name, dBench, pool)
              const vals = vp.tech_groups[g.name].v
              return (
                <div key={g.name}>
                  <div className="mb-1.5 flex items-baseline justify-between border-b border-border pb-1">
                    <span className="text-[13px] font-bold">{g.name}</span>
                    <span className="rating-numeral text-[15px] text-primary">{grpPct == null ? '' : ord(grpPct)}</span>
                  </div>
                  {g.keys.map((k, i) =>
                    vals[i] == null ? null : (
                      <div key={k.k} className="flex items-baseline justify-between py-0.5 text-[12.5px]">
                        <span className="text-muted-foreground">{cleanLabel(k.label)}</span>
                        <b className="font-semibold tabular-nums">{fmtStat(vals[i])}</b>
                      </div>
                    ),
                  )}
                </div>
              )
            })}
        </div>
      </div>

      {/* ---------- scoring weights (agency only) ---------- */}
      <div className="tt-card mb-5">
        <button
          type="button"
          onClick={() => setWeightsOpen(!weightsOpen)}
          className="flex w-full items-center justify-between p-4 text-left sm:px-5"
        >
          <span className="text-[13px] font-bold">Scoring weights · agency only, never shown on the PDF</span>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', weightsOpen && 'rotate-180')} />
        </button>
        {weightsOpen && (
          <div className="border-t border-border p-4 sm:px-5">
            <WeightsEditor
              player={vp}
              weights={mergedWeights}
              groupNames={(meta?.techGroups || []).map((g) => g.name)}
              onChange={(group, value) => {
                const cur = Object.assign({}, defaultWeights(vp.pos, meta), ed?.weights || {})
                cur[group] = value
                patch(id, { weights: cur })
              }}
              onReset={() => patch(id, { weights: null })}
            />
          </div>
        )}
      </div>

      <div className="pb-2 text-[12px] text-muted-foreground">
        Season shown: {seasonLabel(dSeason)}
      </div>
    </div>
  )
}