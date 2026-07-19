import type { Player } from '@/types'
import { X } from 'lucide-react'

interface ChipsProps {
  players: Player[]
  colors: string[]
  onRemove: (p: Player) => void
}

/** Selected-player chips with the same color swatch the chart line uses. */
export function PlayerChips({ players, colors, onRemove }: ChipsProps) {
  if (!players.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {players.map((p, i) => (
        <span key={`${p.name}|${p.team || ''}|${i}`} className="tt-chip">
          <span
            className="h-2.5 w-2.5 flex-none rounded-full"
            style={{ background: colors[i % colors.length] }}
          />
          <span>{p.name}</span>
          <button
            type="button"
            title="Remove"
            onClick={() => onRemove(p)}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  )
}