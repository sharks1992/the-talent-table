import { useState } from 'react'
import { useApp } from '@/state/AppContext'
import { bestSeason, effectiveWeights, initials, lowData, overallPct, seasonOf } from '@/lib/math'
import { ROLE_LABEL } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AddPlayerDialog } from '@/components/AddPlayerDialog'
import { PlayerProfile } from '@/views/PlayerProfile'
import { Plus, TriangleAlert } from 'lucide-react'
import type { Player } from '@/types'

function RosterCard({ p, rank, onClick }: { p: Player; rank: number | null; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tt-card group flex flex-col overflow-hidden text-left transition-shadow hover:shadow-md"
    >
      <div className="relative flex aspect-[5/4] items-center justify-center overflow-hidden bg-muted">
        {p.photo ? (
          <img src={p.photo} alt="" className="h-full w-full object-cover object-[50%_16%]" />
        ) : (
          <span className="display-title text-[64px] font-bold text-slate-300">{initials(p.name)}</span>
        )}
        {rank != null && (
          <span className="rating-numeral absolute right-2.5 top-2.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[22px] text-primary shadow-sm">
            {rank}
          </span>
        )}
      </div>
      <div className="p-3.5">
        <div className="truncate text-[15px] font-bold">{p.name}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] text-muted-foreground">
          <span className="truncate">
            {ROLE_LABEL[p.pos] || p.pos} · {p.team || ''}
          </span>
          {lowData(p) && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-px text-[10px] font-bold text-amber-700">
              <TriangleAlert className="h-2.5 w-2.5" />
              Limited minutes
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export function PlayersView() {
  const { roster, rosterState, poolState, retryLoad, edits, meta, pool } = useApp()
  const [detailId, setDetailId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  if (detailId) {
    return <PlayerProfile id={detailId} onBack={() => setDetailId(null)} />
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="display-title text-[28px] uppercase tracking-[0.03em]">Our Players</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
            Your agency roster. The only players you can build a PDF for. Open a player to upload a
            photo and edit the profile.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add player
        </Button>
      </div>

      {rosterState === 'loading' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="tt-card overflow-hidden">
              <Skeleton className="aspect-[5/4] w-full rounded-none" />
              <div className="space-y-2 p-3.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {rosterState === 'error' && (
        <div className="tt-card flex h-[260px] flex-col items-center justify-center gap-3 text-center">
          <div className="text-[14px] font-semibold">Couldn’t load player data — check your connection.</div>
          <Button onClick={retryLoad}>Try again</Button>
        </div>
      )}

      {rosterState === 'ready' && !roster.length && (
        <div className="tt-card flex h-[200px] items-center justify-center text-[14px] text-muted-foreground">
          No players yet. Use Add player to paste a Wyscout row.
        </div>
      )}

      {rosterState === 'ready' && roster.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {roster.map((p) => {
            // Same rank-based rating + best season the profile shows, so card and profile match.
            const rank = p.id
              ? overallPct(seasonOf(p, bestSeason(p, edits, meta)), 'all', effectiveWeights(p, edits, meta), pool, meta)
              : null
            return <RosterCard key={p.id || p.name} p={p} rank={rank} onClick={() => p.id && setDetailId(p.id)} />
          })}
        </div>
      )}

      {poolState === 'error' && rosterState === 'ready' && (
        <div className="tt-card mt-4 flex items-center justify-between gap-3 border-amber-300 bg-amber-50 px-4 py-3">
          <div className="text-[13px] font-medium text-amber-800">
            The benchmark pool failed to load — ratings and percentiles are unavailable until it does.
          </div>
          <Button variant="outline" size="sm" onClick={retryLoad}>
            Try again
          </Button>
        </div>
      )}

      <AddPlayerDialog open={addOpen} onOpenChange={setAddOpen} onAdded={() => {}} />
    </div>
  )
}