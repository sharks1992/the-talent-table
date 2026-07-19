import { cn } from '@/lib/utils'

interface SegProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  className?: string
  ariaLabel?: string
}

/** Segmented pill control — the app's benchmark / mode / frame switchers. */
export function SegmentedControl<T extends string>({ options, value, onChange, className, ariaLabel }: SegProps<T>) {
  return (
    <div className={cn('seg', className)} role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={o.value === value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}