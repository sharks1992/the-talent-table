import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagEditorProps {
  values: string[]
  onChange: (list: string[]) => void
  addLabel: string
  tone: 's' | 'w' | 'c'
}

/**
 * Editable tag list for strengths / weaknesses / target clubs —
 * same interaction model as the original (inline-editable rows + add button).
 */
export function TagEditor({ values, onChange, addLabel, tone }: TagEditorProps) {
  const set = (i: number, v: string) => {
    const arr = values.slice()
    arr[i] = v
    onChange(arr)
  }
  const del = (i: number) => {
    const arr = values.slice()
    arr.splice(i, 1)
    onChange(arr)
  }
  return (
    <div className="flex flex-col gap-2">
      {values.map((txt, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-2 rounded-lg border bg-white pl-3 pr-1.5 py-1',
            tone === 's' && 'border-emerald-200',
            tone === 'w' && 'border-red-200',
            tone === 'c' && 'border-border',
          )}
        >
          <span
            className={cn(
              'h-2 w-2 flex-none rounded-full',
              tone === 's' && 'bg-emerald-600',
              tone === 'w' && 'bg-red-600',
              tone === 'c' && 'bg-slate-400',
            )}
          />
          <input
            value={txt}
            onChange={(e) => set(i, e.target.value)}
            className="h-7 min-w-0 flex-1 bg-transparent text-[13px] font-medium outline-none"
          />
          <button
            type="button"
            title="Remove"
            onClick={() => del(i)}
            className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange(values.concat(''))}
        className="inline-flex w-fit items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 py-1.5 text-[12.5px] font-semibold text-muted-foreground hover:border-primary hover:text-primary"
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </button>
    </div>
  )
}