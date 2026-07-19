import { useMemo } from 'react'
import { useApp } from '@/state/AppContext'
import { benchShort } from '@/lib/math'
import { SegmentedControl } from '@/components/SegmentedControl'

/** Benchmark pills: "All leagues" + every league from the metadata (ported benchButtonsHTML). */
export function BenchPills({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { meta } = useApp()
  const options = useMemo(
    () => [
      { value: 'all', label: 'All leagues' },
      ...(meta?.leagues || []).map((l) => ({ value: l, label: benchShort(l) })),
    ],
    [meta],
  )
  return <SegmentedControl options={options} value={value} onChange={onChange} ariaLabel="Benchmark" />
}