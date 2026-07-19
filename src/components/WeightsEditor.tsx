import type { Player } from '@/types'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'

interface WeightsEditorProps {
  player: Player
  /** Effective weights = position default merged with the player's live edits. */
  weights: Record<string, number>
  groupNames: string[]
  onChange: (group: string, value: number) => void
  onReset: () => void
}

/**
 * Per-player scoring-weight sliders (0–30, relative shares) — agency-internal
 * tuning, never shown on the PDF. Ported from the original (lines 1127–1138).
 */
export function WeightsEditor({ weights, groupNames, onChange, onReset }: WeightsEditorProps) {
  return (
    <div>
      <p className="mb-4 text-[12.5px] leading-relaxed text-muted-foreground">
        Tune how this player's overall rating is weighted. Each player can be weighted differently,
        even in the same position. Sliders are relative shares.
      </p>
      <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {groupNames.map((n) => {
          const val = weights[n] || 0
          return (
            <div key={n} className="flex items-center gap-3">
              <span className="w-28 flex-none text-[12.5px] font-semibold">{n}</span>
              <Slider
                min={0}
                max={30}
                step={0.5}
                value={[val]}
                onValueChange={(v) => onChange(n, v[0])}
                className="flex-1"
              />
              <span className="w-8 flex-none text-right font-mono text-[12px] text-muted-foreground">{val}</span>
            </div>
          )
        })}
      </div>
      <Button variant="outline" size="sm" className="mt-4" onClick={onReset}>
        Reset to position default
      </Button>
    </div>
  )
}