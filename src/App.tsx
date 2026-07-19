import { useEffect, useState } from 'react'
import { AppShell, type ViewKey } from '@/components/AppShell'
import { PlayersView } from '@/views/PlayersView'
import { ComparisonView } from '@/views/ComparisonView'
import { PdfView } from '@/views/PdfView'
import { loadView, persistView } from '@/lib/storage'

export default function App() {
  const [view, setView] = useState<ViewKey>(() => {
    const v = loadView()
    return v === 'comparison' || v === 'pdf' || v === 'players' ? v : 'players'
  })

  useEffect(() => {
    persistView(view)
  }, [view])

  const navigate = (v: ViewKey) => {
    setView(v)
    window.scrollTo({ top: 0 })
  }

  // Views stay mounted (like the original's sections) so chart selections,
  // search chips and PDF control state survive a view switch.
  return (
    <AppShell view={view} onNavigate={navigate}>
      <div style={{ display: view === 'players' ? undefined : 'none' }}>
        <PlayersView />
      </div>
      <div style={{ display: view === 'comparison' ? undefined : 'none' }}>
        <ComparisonView />
      </div>
      <div style={{ display: view === 'pdf' ? undefined : 'none' }}>
        <PdfView />
      </div>
    </AppShell>
  )
}