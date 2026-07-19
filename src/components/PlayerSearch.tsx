import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Player } from '@/types'
import { ROLE_LABEL } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface PlayerSearchProps {
  pool: Player[]
  onPick: (p: Player) => void
  placeholder?: string
  maxHits?: number
  className?: string
  /** Optional rows rendered above player hits (e.g. whole-club cohorts in the PDF view). */
  extraRows?: (q: string, done: () => void) => ReactNode
}

/**
 * Player search with a results dropdown — same behaviour as the original:
 * matches name or team (case-insensitive substring), capped hit list,
 * closes on outside click.
 */
export function PlayerSearch({ pool, onPick, placeholder, maxHits = 14, className, extraRows }: PlayerSearchProps) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const hits = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return pool
      .filter((p) => p.name.toLowerCase().includes(s) || (p.team || '').toLowerCase().includes(s))
      .slice(0, maxHits)
  }, [q, pool, maxHits])

  const done = () => {
    setQ('')
    setOpen(false)
  }

  const showBox = open && q.trim() !== ''

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-9 w-full rounded-md border border-input bg-white px-3 text-[13.5px] shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring"
      />
      {showBox && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
          {extraRows && extraRows(q.trim().toLowerCase(), done)}
          {hits.map((p) => (
            <button
              key={`${p.name}|${p.team || ''}`}
              type="button"
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-muted"
              onClick={() => {
                onPick(p)
                done()
              }}
            >
              <span className="inline-flex w-[92px] flex-none items-center justify-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary-foreground">
                {ROLE_LABEL[p.pos] || p.pos}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">
                {p.name}
                {p._our ? ' ★' : ''}
              </span>
              <span className="flex-none text-right text-[11px] leading-tight text-muted-foreground">
                {p.team || ''}
                <br />
                {p._our ? 'Our Players' : p.league || ''}
              </span>
            </button>
          ))}
          {!hits.length && !(extraRows && q.trim()) && (
            <div className="px-3 py-2 text-[12.5px] text-muted-foreground">No players found</div>
          )}
        </div>
      )}
    </div>
  )
}