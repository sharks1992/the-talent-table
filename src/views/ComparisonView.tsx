import { useEffect, useMemo, useRef, useState } from 'react'
import { Bar, Radar, Scatter } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import type { AxisOpt, Player } from '@/types'
import { useApp } from '@/state/AppContext'
import {
  CLOUD,
  FAM_LABEL,
  FRAME,
  GOLD,
  GREY,
  GRID_SOFT,
  INK_SOFT,
  MAX_COMPARE,
  PALETTE,
  ROLE_FAMILY,
  SIMI,
} from '@/lib/constants'
import { avgLinePlugin, crosshairPlugin, radarScaleOpts } from '@/lib/charts'
import { bestSeason, cleanLabel, ord, pctRank, seasonOf, similarTo } from '@/lib/math'
import { SegmentedControl } from '@/components/SegmentedControl'
import { BenchPills } from '@/components/BenchPills'
import { PlayerSearch } from '@/components/PlayerSearch'
import { PlayerChips } from '@/components/PlayerChips'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'

type Mode = 'radar' | 'scatter' | 'bar'
type RoleFrame = 'auto' | 'DEF' | 'MID' | 'WING' | 'STR'

type ScatterPoint = { x: number; y: number; _n?: string; _c?: string }

export function ComparisonView() {
  const { meta, pool, roster, searchPool, poolState, retryLoad, edits } = useApp()
  const [bench, setBench] = useState('all')
  const [mode, setMode] = useState<Mode>('radar')
  const [roleFrame, setRoleFrame] = useState<RoleFrame>('auto')
  const [refMode, setRefMode] = useState<'league' | 'club'>('league')
  const [refClub, setRefClub] = useState('')
  const [similarOn, setSimilarOn] = useState(false)
  const [selected, setSelected] = useState<Player[]>([])
  const [axisX, setAxisX] = useState('r:Progression:1')
  const [axisY, setAxisY] = useState('_t')
  const seeded = useRef(false)

  /* Friendly default: two elite midfielders, only once the pool has loaded. */
  useEffect(() => {
    if (seeded.current || selected.length || !pool.length) return
    const seed = ['F. de Jong', 'J. Kimmich'].map((n) => pool.find((p) => p.name === n)).filter(Boolean) as Player[]
    if (seed.length) {
      setSelected(seed)
      seeded.current = true
    }
  }, [pool, selected.length])

  /* Axis options: technical overall, each group rating, each raw metric (lines 727–733). */
  const axisOpts = useMemo<AxisOpt[]>(() => {
    if (!meta) return []
    const opts: AxisOpt[] = [{ key: '_t', label: 'Technical Overall', kind: 'total' }]
    meta.techGroups.forEach((g) => opts.push({ key: 'g:' + g.name, label: g.name + ' rating', kind: 'group', group: g.name }))
    meta.techGroups.forEach((g) =>
      g.keys.forEach((k, mi) => opts.push({ key: 'r:' + g.name + ':' + mi, label: cleanLabel(k.label), kind: 'raw', group: g.name, mi })),
    )
    return opts
  }, [meta])

  const clubs = useMemo(
    () => [...new Set(pool.map((p) => p.team).filter((t): t is string => !!t))].sort(),
    [pool],
  )

  useEffect(() => {
    if (refMode === 'club' && !refClub && clubs.length) setRefClub(clubs[0])
  }, [refMode, refClub, clubs])

  const val = (p: Player, opt: AxisOpt): number | null => {
    if (opt.kind === 'total') {
      const sc = p.sc[bench] || p.sc.all
      const t = sc ? sc.t : null
      return t == null ? null : t * 100
    }
    if (opt.kind === 'group') {
      const sc = p.sc[bench] || p.sc.all
      const s = sc && sc.g ? sc.g[opt.group || ''] : null
      return s == null ? null : s * 100
    }
    const g = p.tech_groups[opt.group || '']
    const v = g && opt.mi != null ? g.v[opt.mi] : null
    return v == null ? null : v
  }

  const frameKey = (): 'DEF' | 'MID' | 'WING' | 'STR' => {
    if (roleFrame !== 'auto') return roleFrame
    if (selected.length) return ROLE_FAMILY[selected[0].pos] || 'MID'
    return 'MID'
  }

  const poolForFrame = (fk: string): Player[] => {
    const roles = Object.keys(ROLE_FAMILY).filter((r) => ROLE_FAMILY[r] === fk)
    return pool.filter((p) => roles.includes(p.pos))
  }

  /* Reference cohort: a club's players at this family, else the whole league pool. */
  const refPool = (fk: string): Player[] => {
    if (refMode === 'club' && refClub) return poolForFrame(fk).filter((p) => p.team === refClub)
    return poolForFrame(fk)
  }

  const refLabel = () => (refMode === 'club' && refClub ? refClub + ' average' : 'League average')
  const benchLabel = () => (bench === 'all' ? 'All leagues' : bench)
  const frameLabel = () => FAM_LABEL[frameKey()] || 'player'

  const currentSimilar = useMemo(
    () => (similarOn && selected.length ? similarTo(selected[0], 4, pool) : []),
    [similarOn, selected, pool],
  )

  const addPlayer = (p: Player) => {
    if (selected.find((s) => s.name === p.name && s.team === p.team)) return
    if (selected.length >= MAX_COMPARE) return
    setSelected(selected.concat(p))
  }

  const addOurs = (id: string) => {
    const p = roster.find((x) => x.id === id)
    if (!p) return
    if (selected.find((s) => s.name === p.name && s.team === p.team)) return
    if (selected.length >= MAX_COMPARE) return
    // Add the season that shows them best (Current vs Past 2 Seasons) by default.
    setSelected(selected.concat({ ...seasonOf(p, bestSeason(p, edits, meta)), _our: true }))
  }

  /* ---------------- radar ---------------- */

  const radarData = useMemo<ChartData<'radar', (number | null)[], string> | null>(() => {
    if (mode !== 'radar' || !selected.length || !pool.length) return null
    const fk = frameKey()
    const groups = FRAME[fk]
    const full = poolForFrame(fk)
    const fullVals = (g: string) =>
      full
        .map((x) => {
          const s = x.sc[bench] || x.sc.all
          return s && s.g ? s.g[g] : null
        })
        .filter((v): v is number => v != null)
    // Percentile of a value within the full position pool. BUG FIX vs the original:
    // a missing group rating is a gap (null), not a 0th-percentile spoke.
    const gpr = (p: Player, g: string): number | null => {
      const sc = p.sc[bench] || p.sc.all
      const me = sc && sc.g ? sc.g[g] : null
      if (me == null) return null
      return pctRank(me, fullVals(g))
    }
    const rp = refPool(fk)
    const ref = groups.map((g) => {
      const vs = rp
        .map((p) => {
          const s = p.sc[bench] || p.sc.all
          return s && s.g ? s.g[g] : null
        })
        .filter((x): x is number => x != null)
      if (!vs.length) return 50
      const mean = vs.reduce((a, b) => a + b, 0) / vs.length
      return pctRank(mean, fullVals(g)) ?? 50
    })
    const ds: ChartData<'radar', (number | null)[], string>['datasets'] = selected.map((p, i) => ({
      label: p.name,
      data: groups.map((g) => gpr(p, g)),
      borderColor: PALETTE[i % PALETTE.length],
      backgroundColor: PALETTE[i % PALETTE.length] + '22',
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: PALETTE[i % PALETTE.length],
    }))
    currentSimilar.forEach((p, i) =>
      ds.push({
        label: p.name + ' (similar)',
        data: groups.map((g) => gpr(p, g)),
        borderColor: SIMI[i % SIMI.length],
        backgroundColor: 'transparent',
        borderWidth: 1.3,
        borderDash: [3, 3],
        pointRadius: 0,
      }),
    )
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
      label: refLabel(),
      data: ref,
      borderColor: GREY,
      borderDash: [5, 4],
      borderWidth: 1.4,
      pointRadius: 0,
      backgroundColor: 'transparent',
    })
    return { labels: groups.slice(), datasets: ds }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selected, pool, bench, refMode, refClub, currentSimilar, roleFrame])

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

  /* ---------------- bar ---------------- */

  const barAxis = axisOpts.find((a) => a.key === axisX) || axisOpts[0]

  const barData = useMemo<ChartData<'bar', (number | null)[], string> | null>(() => {
    if (mode !== 'bar' || !selected.length || !barAxis) return null
    const sim = currentSimilar
    const all = selected.concat(sim)
    const colors = selected
      .map((_, i) => PALETTE[i % PALETTE.length])
      .concat(sim.map((_, i) => SIMI[i % SIMI.length]))
    return {
      labels: all.map((p) => p.name + (selected.includes(p) ? '' : ' (similar)')),
      datasets: [
        {
          data: all.map((p) => val(p, barAxis)),
          backgroundColor: colors,
          borderRadius: 6,
          maxBarThickness: 64,
        },
      ],
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selected, currentSimilar, barAxis, bench, pool])

  const barAvg = useMemo(() => {
    if (mode !== 'bar' || !barAxis) return 0
    const vs = refPool(frameKey())
      .map((p) => val(p, barAxis))
      .filter((x): x is number => x != null)
    return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, barAxis, bench, pool, refMode, refClub, roleFrame])

  const barOptions = useMemo<ChartOptions<'bar'>>(() => {
    const isPct = barAxis ? barAxis.kind !== 'raw' : true
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) =>
              (barAxis?.label || '') + ': ' + (c.parsed.y == null ? 'n/a' : isPct ? Math.round(c.parsed.y) + '%' : String(c.parsed.y)),
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: GRID_SOFT },
          ticks: { color: '#9A9AA8', callback: (v) => (isPct ? v + '%' : v) },
        },
        x: { grid: { display: false }, ticks: { color: INK_SOFT, font: { weight: 600 } } },
      },
    }
  }, [barAxis])

  /* ---------------- scatter ---------------- */

  const scatterData = useMemo<ChartData<'scatter', ScatterPoint[], string> | null>(() => {
    if (mode !== 'scatter' || !axisOpts.length) return null
    const xo = axisOpts.find((a) => a.key === axisX) || axisOpts[0]
    const yo = axisOpts.find((a) => a.key === axisY) || axisOpts[1]
    const rp = refPool(frameKey())
    const cloud = rp
      .map((p) => ({ x: val(p, xo), y: val(p, yo) }))
      .filter((d): d is { x: number; y: number } => d.x != null && d.y != null)
    const picks: ScatterPoint[] = []
    selected.forEach((p, i) => {
      const x = val(p, xo)
      const y = val(p, yo)
      if (x != null && y != null) picks.push({ x, y, _n: p.name, _c: PALETTE[i % PALETTE.length] })
    })
    const ds: ChartData<'scatter', ScatterPoint[], string>['datasets'] = [
      {
        label: refMode === 'club' && refClub ? refClub : 'Top 5 pool',
        data: cloud,
        backgroundColor: CLOUD,
        pointRadius: 3,
        pointHoverRadius: 4,
      },
    ]
    currentSimilar.forEach((p, i) => {
      const x = val(p, xo)
      const y = val(p, yo)
      if (x != null && y != null)
        ds.push({
          label: p.name,
          data: [{ x, y, _n: p.name + ' (similar)' }],
          backgroundColor: SIMI[i % SIMI.length],
          pointRadius: 5,
          pointHoverRadius: 6,
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5,
        })
    })
    picks.forEach((d) =>
      ds.push({
        label: d._n,
        data: [d],
        backgroundColor: d._c,
        pointRadius: 7,
        pointHoverRadius: 8,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }),
    )
    return { datasets: ds }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, axisOpts, axisX, axisY, selected, currentSimilar, pool, bench, refMode, refClub, roleFrame])

  const scatterMeans = useMemo(() => {
    if (mode !== 'scatter' || !scatterData) return { mx: 0, my: 0 }
    const cloud = (scatterData.datasets[0]?.data || []) as ScatterPoint[]
    const mx = cloud.length ? cloud.reduce((a, b) => a + b.x, 0) / cloud.length : 0
    const my = cloud.length ? cloud.reduce((a, b) => a + b.y, 0) / cloud.length : 0
    return { mx, my }
  }, [mode, scatterData])

  const scatterOptions = useMemo<ChartOptions<'scatter'>>(() => {
    const xo = axisOpts.find((a) => a.key === axisX) || axisOpts[0]
    const yo = axisOpts.find((a) => a.key === axisY) || axisOpts[1]
    const xPct = xo ? xo.kind !== 'raw' : true
    const yPct = yo ? yo.kind !== 'raw' : true
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => {
              const d = c.raw as ScatterPoint
              return (
                (d._n ? d._n + ': ' : '') +
                '(' +
                (xPct ? Math.round(d.x) + '%' : d.x) +
                ', ' +
                (yPct ? Math.round(d.y) + '%' : d.y) +
                ')'
              )
            },
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: xo?.label || '', color: '#6B6B7B' },
          grid: { color: GRID_SOFT },
          ticks: { color: '#9A9AA8', callback: (v) => (xPct ? v + '%' : v) },
        },
        y: {
          title: { display: true, text: yo?.label || '', color: '#6B6B7B' },
          grid: { color: GRID_SOFT },
          ticks: { color: '#9A9AA8', callback: (v) => (yPct ? v + '%' : v) },
        },
      },
    }
  }, [axisOpts, axisX, axisY])

  /* ---------------- render ---------------- */

  const needPlayers = mode === 'radar' || mode === 'bar'
  const isPctBar = barAxis ? barAxis.kind !== 'raw' : true

  return (
    <div>
      <div className="mb-5">
        <h1 className="display-title text-[28px] uppercase tracking-[0.03em]">Comparison</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
          Benchmark players against all leagues combined, or filter to a single league or club.
          Search to add players, then switch between radar, scatter and bar.
        </p>
      </div>

      {/* Controls */}
      <div className="tt-card mb-5 flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="w-24 flex-none text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Benchmark
          </span>
          <BenchPills value={bench} onChange={setBench} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="w-24 flex-none text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">View</span>
          <SegmentedControl
            ariaLabel="Chart mode"
            options={[
              { value: 'radar', label: 'Radar' },
              { value: 'scatter', label: 'Scatter' },
              { value: 'bar', label: 'Bar' },
            ]}
            value={mode}
            onChange={(v) => setMode(v as Mode)}
          />
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground min-[640px]:ml-3">
            Position frame
          </span>
          <SegmentedControl
            ariaLabel="Position frame"
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'DEF', label: 'Defender' },
              { value: 'MID', label: 'Midfield' },
              { value: 'WING', label: 'Winger' },
              { value: 'STR', label: 'Striker' },
            ]}
            value={roleFrame}
            onChange={(v) => setRoleFrame(v as RoleFrame)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="w-24 flex-none text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Compare vs
          </span>
          <SegmentedControl
            ariaLabel="Reference"
            options={[
              { value: 'league', label: 'League average' },
              { value: 'club', label: 'A club' },
            ]}
            value={refMode}
            onChange={(v) => setRefMode(v as 'league' | 'club')}
          />
          {refMode === 'club' && (
            <select
              value={refClub}
              onChange={(e) => setRefClub(e.target.value)}
              className="h-9 max-w-[220px] rounded-md border border-input bg-white px-2.5 text-[13px] font-semibold shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              {clubs.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSimilarOn(!similarOn)}
            title="Show players with the most similar profile"
            className={similarOn ? 'border-primary/40 bg-emerald-50 text-primary hover:bg-emerald-50' : ''}
          >
            Similar players: {similarOn ? 'on' : 'off'}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlayerSearch
            pool={searchPool}
            onPick={addPlayer}
            placeholder="Search a player to add (any club)"
            className="min-w-[220px] flex-1"
          />
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) addOurs(e.target.value)
            }}
            className="h-9 rounded-md border border-input bg-white px-2.5 text-[13px] font-semibold shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <option value="">＋ Add one of Our Players</option>
            {roster.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
        <PlayerChips
          players={selected}
          colors={PALETTE}
          onRemove={(p) => setSelected(selected.filter((x) => x !== p))}
        />
      </div>

      {/* Chart card */}
      <div className="tt-card p-4 sm:p-5">
        {(mode === 'scatter' || mode === 'bar') && (
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground">
              {mode === 'bar' ? 'Metric' : 'X'}
              <select
                value={axisX}
                onChange={(e) => setAxisX(e.target.value)}
                className="h-8 max-w-[230px] rounded-md border border-input bg-white px-2 text-[12.5px] font-semibold shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {axisOpts.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {mode === 'scatter' && (
              <label className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground">
                Y
                <select
                  value={axisY}
                  onChange={(e) => setAxisY(e.target.value)}
                  className="h-8 max-w-[230px] rounded-md border border-input bg-white px-2 text-[12.5px] font-semibold shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  {axisOpts.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}

        {poolState === 'loading' && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-[420px] w-full rounded-lg" />
            <div className="text-center text-[12.5px] text-muted-foreground">Loading player data…</div>
          </div>
        )}
        {poolState === 'error' && (
          <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center">
            <div className="text-[14px] font-semibold">Couldn’t load player data — check your connection.</div>
            <Button onClick={retryLoad}>Try again</Button>
          </div>
        )}
        {poolState === 'ready' && needPlayers && !selected.length && (
          <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-muted-foreground">
            <Plus className="h-7 w-7" />
            <div className="text-[14px] font-medium">Search and add players to compare</div>
          </div>
        )}

        {poolState === 'ready' && mode === 'radar' && radarData && (
          <div className="mx-auto aspect-square w-full max-w-[560px]">
            <Radar data={radarData} options={radarOptions} />
          </div>
        )}
        {poolState === 'ready' && mode === 'bar' && barData && (
          <div className="h-[420px] w-full">
            <Bar data={barData} options={barOptions} plugins={[avgLinePlugin(barAvg)]} />
          </div>
        )}
        {poolState === 'ready' && mode === 'scatter' && scatterData && (
          <div className="h-[460px] w-full">
            <Scatter data={scatterData} options={scatterOptions} plugins={[crosshairPlugin(scatterMeans.mx, scatterMeans.my)]} />
          </div>
        )}

        {poolState === 'ready' && (selected.length > 0 || mode === 'scatter') && (
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-muted-foreground">
            {mode === 'radar' && (
              <>
                <span>
                  Percentile per metric vs {frameLabel()}s in the {benchLabel()} pool. Top scores = best in class (99).
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-0 w-5 border-t-2 border-dashed" style={{ borderColor: GOLD }} /> Top scores
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-0 w-5 border-t-2 border-dashed" style={{ borderColor: GREY }} /> {refLabel()}
                </span>
              </>
            )}
            {mode === 'bar' && barAxis && (
              <>
                <span>{barAxis.label}</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-0 w-5 border-t-2 border-dashed" style={{ borderColor: GREY }} /> {refLabel()}{' '}
                  {isPctBar ? Math.round(barAvg) + '%' : barAvg.toFixed(2)}
                </span>
              </>
            )}
            {mode === 'scatter' && (
              <>
                <span>
                  Grey dots are every {frameLabel()} in the {benchLabel()} pool.
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-0 w-5 border-t-2 border-dashed" style={{ borderColor: CLOUD }} /> Average lines
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}