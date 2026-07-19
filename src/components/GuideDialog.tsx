import type { ReactNode } from 'react'
import { Users, GitCompareArrows, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

/* ------------------------------------------------------------------ */
/*  The Talent Table · user guide key — five diagrams, always at hand  */
/* ------------------------------------------------------------------ */

const ROUTE = ['App map', 'Roster', 'Benchmark', 'PDF report', 'Reading the numbers']

const ROSTER_FLOW: [string, string][] = [
  ['Add a player', 'paste their Wyscout stats into the import box; duplicates are skipped and listed back to you.'],
  ['Open the profile', 'rating, percentile chip, facts, radar and similar players update automatically.'],
  ['Annotate the player', 'edit strengths, weaknesses, transfer-club tags and scout notes; everything saves on this device.'],
  ['Switch the season', 'Current, Past two seasons or Previous reshapes every chart and rating.'],
]

const BENCH_FLOW: [string, string][] = [
  ['Pick a benchmark league', '11 competitions, including the Championship.'],
  ['Choose a view', 'Radar, Scatter or Bar.'],
  ['Set the position frame', 'Auto, or Defender, Midfield, Winger, Striker.'],
  ['Choose the reference', 'league average, any of 290 clubs, or similar players.'],
  ['Add players to compare', 'search up to 8 at once, or quick-add from your roster.'],
]

const PDF_FLOW: [string, string][] = [
  ['Choose player and season', 'reports are for roster players only.'],
  ['Set benchmark and compare players', 'up to 6 players on the comparison radar.'],
  ['Tick sections and language', '8 sections, in EN, IT, FR, ES, PT or DE.'],
  ['Check the live A4 preview', 'what you see is exactly what downloads.'],
  ['Download the PDF', 'confidential footer included; transfer-club shortlists are never exported.'],
]

function DiagramHead({ n, title, purpose }: { n: number; title: string; purpose: string }) {
  return (
    <div className="mb-2 flex items-baseline gap-2">
      <span className="grid h-5 w-5 flex-none translate-y-[3px] place-items-center rounded-md bg-primary/10 text-[11.5px] font-bold text-primary">
        {n}
      </span>
      <span className="text-[13.5px] font-bold">{title}</span>
      <span className="text-[11.5px] text-muted-foreground">— {purpose}</span>
    </div>
  )
}

function Flow({ steps }: { steps: [string, string][] }) {
  return (
    <ol className="tt-flow">
      {steps.map(([t, d], i) => (
        <li key={t}>
          <span className="n">{i + 1}</span>
          <div className="text-[12.5px] leading-snug">
            <span className="font-semibold">{t}</span>
            <span className="text-muted-foreground"> — {d}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

function Chip({ tone = 'green', children }: { tone?: 'green' | 'amber' | 'neutral'; children: ReactNode }) {
  const cls =
    tone === 'amber'
      ? 'bg-amber-500/15 text-amber-700'
      : tone === 'neutral'
        ? 'border border-border bg-muted text-muted-foreground'
        : 'bg-primary/10 text-primary'
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11px] font-bold ${cls}`}>
      {children}
    </span>
  )
}

function AppMap() {
  const branches = [
    { icon: Users, t: 'Our players', d: 'Profiles, ratings, notes and edits' },
    { icon: GitCompareArrows, t: 'Comparison', d: 'League benchmarks and charts' },
    { icon: FileText, t: 'PDF report', d: 'Client-ready, multilingual exports' },
  ]
  return (
    <div className="tt-map">
      <div className="self-center rounded-xl border-[1.5px] border-primary/40 bg-primary/10 px-3.5 py-3">
        <div className="text-[13px] font-bold">Your roster</div>
        <div className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
          Players you add or import. Everything in the app starts here.
        </div>
      </div>
      <div className="tt-map-spine" aria-hidden="true">
        <i className="v" />
        <i className="b" style={{ top: '16.66%' }} />
        <i className="b" style={{ top: '50%' }} />
        <i className="b" style={{ top: '83.33%' }} />
      </div>
      <div className="grid gap-2.5" style={{ gridTemplateRows: '1fr 1fr 1fr' }}>
        {branches.map((b) => (
          <div
            key={b.t}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2"
          >
            <b.icon className="h-4 w-4 flex-none text-primary" />
            <div>
              <div className="text-[13px] font-bold">{b.t}</div>
              <div className="text-[11.5px] text-muted-foreground">{b.d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NumbersLegend() {
  return (
    <div className="grid gap-2">
      {[
        {
          sample: <span className="rating-numeral w-[38px] text-center text-[24px] text-primary">87</span>,
          txt: (
            <>
              <b>Rating = percentile, 0–99.</b> 87 means better than 87% of players in the same position family.
            </>
          ),
        },
        {
          sample: <Chip>Top 8% of Wingers</Chip>,
          txt: (
            <>
              <b>The same rating</b> expressed as a share of comparable players.
            </>
          ),
        },
        {
          sample: <Chip>+4 pts</Chip>,
          txt: (
            <>
              <b>Growth</b> — rating change versus the previous season snapshot.
            </>
          ),
        },
        {
          sample: (
            <svg viewBox="0 0 44 44" className="h-10 w-10" aria-hidden="true">
              <g stroke="currentColor" strokeWidth="1" opacity="0.45" className="text-foreground">
                <line x1="22" y1="22" x2="22" y2="4" />
                <line x1="22" y1="22" x2="39.1" y2="16.4" />
                <line x1="22" y1="22" x2="32.6" y2="36.6" strokeDasharray="2.5 2.5" />
                <line x1="22" y1="22" x2="11.4" y2="36.6" />
                <line x1="22" y1="22" x2="4.9" y2="16.4" />
              </g>
              <polygon
                points="22,4 39.1,16.4 22,22 11.4,36.6 4.9,16.4"
                fill="hsl(141.9 71.8% 29.2% / 0.12)"
                stroke="hsl(141.9 71.8% 29.2%)"
                strokeWidth="1.5"
              />
            </svg>
          ),
          txt: (
            <>
              <b>A gap in a radar</b> means the stat is unavailable — never read it as zero.
            </>
          ),
        },
        {
          sample: <Chip tone="amber">Limited minutes</Chip>,
          txt: (
            <>
              <b>Small sample</b> — treat the percentile with caution.
            </>
          ),
        },
        {
          sample: <Chip tone="neutral">HG</Chip>,
          txt: (
            <>
              <b>Homegrown</b> — trained at the club; matters for squad registration.
            </>
          ),
        },
      ].map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5"
        >
          <span className="flex w-[86px] flex-none justify-center">{item.sample}</span>
          <span className="text-[11.5px] leading-snug text-muted-foreground [&_b]:text-foreground">
            {item.txt}
          </span>
        </div>
      ))}
    </div>
  )
}

function GuideKey() {
  return (
    <div className="flex flex-col gap-5">
      {/* guide route */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-dashed border-border px-3 py-2 font-mono text-[11.5px] text-muted-foreground">
        {ROUTE.map((r, i) => (
          <span key={r} className="contents">
            {i > 0 && <span aria-hidden="true">→</span>}
            <span className="font-bold text-primary">
              {i + 1} {r}
            </span>
          </span>
        ))}
      </div>

      {/* 1 · app map */}
      <section>
        <DiagramHead n={1} title="The app map" purpose="your roster feeds every workspace" />
        <AppMap />
      </section>

      <div className="grid gap-5 min-[720px]:grid-cols-2">
        {/* 2 · roster */}
        <section>
          <DiagramHead n={2} title="Build your roster" purpose="Our players" />
          <Flow steps={ROSTER_FLOW} />
        </section>
        {/* 3 · benchmark */}
        <section>
          <DiagramHead n={3} title="Benchmark players" purpose="Comparison" />
          <Flow steps={BENCH_FLOW} />
        </section>
      </div>

      <div className="grid gap-5 min-[720px]:grid-cols-2">
        {/* 4 · pdf */}
        <section>
          <DiagramHead n={4} title="Export a report" purpose="PDF report" />
          <Flow steps={PDF_FLOW} />
        </section>
        {/* 5 · numbers */}
        <section>
          <DiagramHead n={5} title="Reading the numbers" purpose="legend used across the app" />
          <NumbersLegend />
        </section>
      </div>

      <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
        All edits save automatically on this device · ratings always benchmark against the selected league and
        season · transfer-club shortlists stay private and never leave the app.
      </p>
    </div>
  )
}

export function GuideDialog({ trigger }: { trigger: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[86vh] overflow-y-auto p-5 sm:max-w-2xl sm:p-6 lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="display-title text-[16px] uppercase tracking-[0.06em]">
            User guide key
          </DialogTitle>
          <DialogDescription>
            Five diagrams cover the whole app — follow the numbered steps in each one.
          </DialogDescription>
        </DialogHeader>
        <GuideKey />
      </DialogContent>
    </Dialog>
  )
}