import { useState } from 'react'
import { useApp } from '@/state/AppContext'
import { parseWyscout, scoreWyscoutPlayers, slugify, type SkippedRow } from '@/lib/wyscout'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface AddPlayerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: () => void
}

/**
 * Paste Wyscout export rows (including the header) → each row becomes an
 * editable roster player, scored client-side against the loaded pool.
 * Dropped rows are reported instead of silently ignored.
 */
export function AddPlayerDialog({ open, onOpenChange, onAdded }: AddPlayerDialogProps) {
  const { pool, poolState, meta, addImportedPlayers } = useApp()
  const [text, setText] = useState('')
  const [msg, setMsg] = useState<{ kind: 'err' | 'ok'; text: string; skipped?: SkippedRow[] } | null>(null)
  const [busy, setBusy] = useState(false)

  const canScore = poolState === 'ready' && !!meta

  const reset = () => {
    setText('')
    setMsg(null)
    setBusy(false)
  }

  const go = async () => {
    if (!meta) return
    setBusy(true)
    setMsg(null)
    // Let the button state paint before the (synchronous) scoring pass over 3.6k players.
    await new Promise((r) => setTimeout(r, 30))
    const { players, skipped } = parseWyscout(text)
    if (!players.length) {
      setBusy(false)
      setMsg({
        kind: 'err',
        text: 'Could not read any player rows. Include the header row.',
        skipped,
      })
      return
    }
    const scored = scoreWyscoutPlayers(players, pool, meta).map((p) => ({ ...p, id: slugify(p.name) }))
    addImportedPlayers(scored)
    setBusy(false)
    if (skipped.length) {
      setMsg({ kind: 'ok', text: `Added ${scored.length} player${scored.length === 1 ? '' : 's'}.`, skipped })
      setText('')
      onAdded()
    } else {
      reset()
      onOpenChange(false)
      onAdded()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add a player</DialogTitle>
          <DialogDescription>
            Paste one or more rows from a Wyscout search, including the header row. Each row becomes
            an editable player you can build a PDF for.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Player\tTeam\tPosition\tAge\t...'}
          className="min-h-[160px] font-mono text-[12px]"
        />
        {msg && (
          <div className={msg.kind === 'err' ? 'text-[13px] text-destructive' : 'text-[13px] text-primary'}>
            <div className="font-semibold">{msg.text}</div>
            {msg.skipped && msg.skipped.length > 0 && (
              <ul className="mt-1 list-inside list-disc text-muted-foreground">
                {msg.skipped.map((s, i) => (
                  <li key={i}>
                    Skipped {s.name}: {s.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {!canScore && poolState !== 'error' && (
          <div className="text-[12.5px] text-muted-foreground">
            Scoring data is still loading — the Add button enables when the benchmark pool is ready.
          </div>
        )}
        {poolState === 'error' && (
          <div className="text-[12.5px] text-destructive">
            The benchmark pool failed to load, so new players cannot be scored right now.
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={go} disabled={busy || !canScore || !text.trim()}>
            {busy ? 'Adding…' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}