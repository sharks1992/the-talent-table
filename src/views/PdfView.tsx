import { useEffect, useMemo, useRef, useState } from 'react'
import type { Player, SeasonKey } from '@/types'
import { useApp } from '@/state/AppContext'
import { FAM_NOUN, MAX_PDF_COMPARE, CMP_PAL, PDF_SECTIONS, ROLE_FAMILY } from '@/lib/constants'
import { bestSeason, hasGrowth, seasonOf } from '@/lib/math'
import { renderRadarPng } from '@/lib/radarImage'
import { downloadPdf } from '@/lib/pdf'
import { LANG_LABELS, type PdfLang } from '@/i18n'
import { PdfReport } from '@/views/PdfReport'
import { BenchPills } from '@/components/BenchPills'
import { SegmentedControl } from '@/components/SegmentedControl'
import { PlayerSearch } from '@/components/PlayerSearch'
import { PlayerChips } from '@/components/PlayerChips'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Download } from 'lucide-react'

const REPORT_W = 794

export function PdfView() {
  const { roster, pool, poolState, meta, edits, searchPool } = useApp()
  const [playerId, setPlayerId] = useState<string>('')
  const [season, setSeason] = useState<SeasonKey>('current')
  const [bench, setBench] = useState('all')
  const [lang, setLang] = useState<PdfLang>('en')
  const [cmpPlayers, setCmpPlayers] = useState<Player[]>([])
  const [sections, setSections] = useState<Record<string, boolean>>({})
  const [radarImg, setRadarImg] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [reportH, setReportH] = useState(0)

  const player = useMemo(
    () => roster.find((p) => p.id === playerId) || roster[0],
    [roster, playerId],
  )

  /* Defaults whenever the subject changes: best season, smart section defaults, cleared compares. */
  useEffect(() => {
    if (!player) return
    setSeason(bestSeason(player, edits, meta))
    const s: Record<string, boolean> = {}
    PDF_SECTIONS.forEach(([k]) => (s[k] = true))
    s.development = hasGrowth(seasonOf(player, 'current'), bench, pool, edits, meta)
    setSections(s)
    setCmpPlayers([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id])

  /* Keep the selected id valid as the roster loads/changes. */
  useEffect(() => {
    if (player && player.id !== playerId) setPlayerId(player.id || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id])

  const sp = useMemo(() => (player ? seasonOf(player, season) : player), [player, season])

  /* Off-screen radar PNG, regenerated with any input that affects it. */
  useEffect(() => {
    if (!sp || !pool.length) {
      setRadarImg(null)
      return
    }
    try {
      setRadarImg(renderRadarPng(sp, cmpPlayers, bench, pool, lang))
    } catch {
      setRadarImg(null)
    }
  }, [sp, cmpPlayers, bench, pool, lang])

  /* Live scaled A4 preview: fit the 794 px report to the stage width,
     re-measuring when content (incl. the radar image) settles. */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const ro = new ResizeObserver(() => setScale(Math.min(1, stage.clientWidth / REPORT_W)))
    ro.observe(stage)
    setScale(Math.min(1, stage.clientWidth / REPORT_W))
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setReportH(el.offsetHeight))
    ro.observe(el)
    setReportH(el.offsetHeight)
    return () => ro.disconnect()
  }, [player, season, bench, lang, sections, radarImg, cmpPlayers])

  /* ---------- compare radar: players + whole-club cohorts (ported 1397–1436) ---------- */
  const fam = (player && ROLE_FAMILY[player.pos]) || 'MID'

  const addCmp = (p: Player) => {
    const q = p._our
      ? Object.assign(seasonOf(p, bestSeason(p, edits, meta)), { _our: true, name: p.name })
      : p
    setCmpPlayers((prev) => {
      if (prev.length >= MAX_PDF_COMPARE) return prev
      if (prev.find((x) => x.name === q.name && x.team === q.team)) return prev
      return prev.concat(q)
    })
  }

  const clubMatches = (q: string) => {
    const counts: Record<string, number> = {}
    pool.forEach((x) => {
      if ((ROLE_FAMILY[x.pos] || '') !== fam || !x.team) return
      counts[x.team] = (counts[x.team] || 0) + 1
    })
    return Object.keys(counts)
      .filter((c) => counts[c] >= 2 && c.toLowerCase().includes(q))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 4)
      .map((c) => ({ club: c, n: counts[c] }))
  }

  const addClub = (club: string) => {
    pool
      .filter((x) => x.team === club && (ROLE_FAMILY[x.pos] || '') === fam)
      .forEach(addCmp)
  }

  /* ---------- download ---------- */
  const download = async () => {
    if (!player || downloading) return
    setDownloading(true)
    setDownloadError(false)
    const wrap = contentRef.current
    const root = wrap?.querySelector<HTMLElement>('.pdfr')
    if (!wrap || !root) {
      setDownloading(false)
      setDownloadError(true)
      return
    }
    const prevTransform = wrap.style.transform
    wrap.style.transform = 'none' // capture at the true 794 px width, free of the preview scale
    const name = (player.name + '_' + lang).replace(/[^a-z0-9]+/gi, '_')
    try {
      // Let the transform reset paint before capturing.
      await new Promise((r) => setTimeout(r, 50))
      await downloadPdf(root, name + '.pdf')
    } catch (err) {
      console.error('[pdf-download]', err)
      setDownloadError(true)
    } finally {
      wrap.style.transform = prevTransform
      setDownloading(false)
    }
  }

  if (!roster.length) {
    return (
      <div>
        <div className="mb-5">
          <h1 className="display-title text-[28px] uppercase tracking-[0.03em]">PDF Report</h1>
        </div>
        <div className="tt-card flex h-[220px] items-center justify-center px-6 text-center text-[14px] text-muted-foreground">
          Add a player in Our Players first — only roster players can be exported.
        </div>
      </div>
    )
  }

  const seasonOpts: { value: SeasonKey; label: string }[] =
    player && player.previous
      ? ([
          { value: 'current', label: 'Current' },
          ...(player.combined ? [{ value: 'combined' as SeasonKey, label: 'Past 2 seasons' }] : []),
          { value: 'previous', label: 'Previous' },
        ] as { value: SeasonKey; label: string }[])
      : []

  return (
    <div>
      <div className="mb-5">
        <h1 className="display-title text-[28px] uppercase tracking-[0.03em]">PDF Report</h1>
        <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground">
          Build a premium report for one of Our Players. Choose the benchmark and the language for the
          receiving club, then download. Strengths, weaknesses and scout notes come from the player's
          profile in Our Players. Target clubs are internal only and never appear on the exported PDF.
        </p>
      </div>

      {/* Controls */}
      <div className="tt-card mb-5 flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="w-24 flex-none text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Player
          </span>
          <select
            value={player?.id || ''}
            onChange={(e) => setPlayerId(e.target.value)}
            className="h-9 rounded-md border border-input bg-white px-2.5 text-[13.5px] font-semibold shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            {roster.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {seasonOpts.length > 0 && (
            <>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground min-[640px]:ml-3">
                Season
              </span>
              <SegmentedControl ariaLabel="Season" options={seasonOpts} value={season} onChange={(v) => setSeason(v as SeasonKey)} />
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="w-24 flex-none text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Benchmark
          </span>
          <BenchPills value={bench} onChange={setBench} />
        </div>

        <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
          <span className="w-24 flex-none pt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Compare radar
          </span>
          <div className="min-w-[240px] max-w-[560px] flex-1">
            <PlayerSearch
              pool={searchPool}
              onPick={addCmp}
              placeholder="Type a player or club to add to the radar"
              maxHits={12}
              extraRows={(q, done) =>
                clubMatches(q.toLowerCase()).map((o) => (
                  <button
                    key={o.club}
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-muted"
                    onClick={() => {
                      addClub(o.club)
                      done()
                    }}
                  >
                    <span className="inline-flex w-[92px] flex-none items-center justify-center rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-background">
                      Club
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">
                      ＋ {o.club} {FAM_NOUN[fam]}
                    </span>
                    <span className="flex-none text-right text-[11px] leading-tight text-muted-foreground">
                      {o.n} players
                      <br />
                      whole club
                    </span>
                  </button>
                ))
              }
            />
            <div className="mt-2">
              <PlayerChips
                players={cmpPlayers}
                colors={CMP_PAL}
                onRemove={(p) => setCmpPlayers(cmpPlayers.filter((x) => x !== p))}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
          <span className="w-24 flex-none pt-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Sections
          </span>
          <div className="flex max-w-[820px] flex-wrap gap-2">
            {PDF_SECTIONS.map(([k, lab]) => (
              <label
                key={k}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-2.5 py-1.5 text-[13px] font-semibold"
              >
                <Checkbox
                  checked={!!sections[k]}
                  onCheckedChange={(c) => setSections({ ...sections, [k]: c === true })}
                />
                {lab}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="w-24 flex-none text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Language
          </span>
          <SegmentedControl
            ariaLabel="Language"
            options={LANG_LABELS.map(([v, l]) => ({ value: v, label: l }))}
            value={lang}
            onChange={(v) => setLang(v as PdfLang)}
          />
          <Button onClick={download} disabled={downloading || poolState !== 'ready'} className="ml-auto">
            <Download className="h-4 w-4" />
            {downloading ? 'Building…' : 'Download PDF'}
          </Button>
        </div>
        {downloadError && (
          <div className="text-[12.5px] text-destructive">Could not build the PDF. Please try again.</div>
        )}
        {poolState !== 'ready' && (
          <div className="text-[12.5px] text-muted-foreground">
            {poolState === 'loading'
              ? 'Loading the benchmark pool — the preview and download enable when it is ready…'
              : 'The benchmark pool failed to load. Use Try again on another view, then come back.'}
          </div>
        )}
      </div>

      {/* Live scaled A4 preview */}
      <div
        ref={stageRef}
        className="overflow-hidden rounded-xl border border-border bg-white shadow-card"
        style={{ height: reportH * scale || undefined }}
      >
        <div
          ref={contentRef}
          style={{ width: REPORT_W, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {player && sp && (
            <PdfReport
              player={player}
              season={season}
              bench={bench}
              lang={lang}
              cmpPlayers={cmpPlayers}
              sections={sections}
              pool={pool}
              meta={meta}
              edits={edits}
              radarImg={radarImg}
            />
          )}
        </div>
      </div>
    </div>
  )
}