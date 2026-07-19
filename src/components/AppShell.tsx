import type { ReactNode } from 'react'
import { Users, GitCompareArrows, FileText, CircleHelp } from 'lucide-react'
import { useApp } from '@/state/AppContext'
import { cn } from '@/lib/utils'
import { GuideDialog } from '@/components/GuideDialog'

export type ViewKey = 'players' | 'comparison' | 'pdf'

const NAV: { key: ViewKey; label: string; short: string; icon: typeof Users }[] = [
  { key: 'players', label: 'Our Players', short: 'Players', icon: Users },
  { key: 'comparison', label: 'Comparison', short: 'Compare', icon: GitCompareArrows },
  { key: 'pdf', label: 'PDF Report', short: 'PDF', icon: FileText },
]

function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 370 224" fill="currentColor" aria-hidden="true" className={cn('tt-brandmark', className)}>
      {/* tabletop — spins like a table-top spinner */}
      <g className="tt-top">
        <path fillRule="evenodd" d="M0 0 H370 V66 H0 Z M20 20 H350 V46 H20 Z" />
      </g>
      {/* legs — stay planted */}
      <g className="tt-legs">
        <path
          fillRule="evenodd"
          d="M78 66 H140 V224 H78 Z M98 66 H120 V204 H98 Z M230 66 H292 V224 H230 Z M250 66 H270 V204 H250 Z"
        />
      </g>
    </svg>
  )
}

function SaveIndicator() {
  const { saveStatus } = useApp()
  return (
    <div className="flex items-center gap-2 px-1 text-[12px] font-medium text-muted-foreground" title="Roster edits are stored on this device">
      <span
        className={cn(
          'h-2 w-2 rounded-full transition-colors',
          saveStatus === 'saved' ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse',
        )}
      />
      {saveStatus === 'saved' ? 'Saved on this device' : 'Saving…'}
    </div>
  )
}

export function AppShell({
  view,
  onNavigate,
  children,
}: {
  view: ViewKey
  onNavigate: (v: ViewKey) => void
  children: ReactNode
}) {
  return (
    <div className="min-h-screen">
      {/* ---------- Desktop sidebar (≥880px) ---------- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col border-r border-sidebar-border bg-sidebar-background min-[880px]:flex">
        <div className="flex items-center gap-3 px-5 pb-6 pt-6">
          <BrandMark className="h-7 w-auto text-primary" />
          <div className="leading-tight">
            <div className="display-title text-[15px] uppercase tracking-[0.06em]">The Talent Table</div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Player Intelligence
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {NAV.map((n) => {
            const Icon = n.icon
            const active = view === n.key
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => onNavigate(n.key)}
                className={cn(
                  'relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-semibold transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-primary" />}
                <Icon className={cn('h-[18px] w-[18px]', active ? 'text-primary' : '')} />
                {n.label}
              </button>
            )
          })}
        </nav>
        <div className="mt-auto border-t border-sidebar-border px-3 py-3">
          <GuideDialog
            trigger={
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Open the user guide key"
              >
                <CircleHelp className="h-[17px] w-[17px]" />
                Guide key
              </button>
            }
          />
          <div className="px-2 pt-1">
            <SaveIndicator />
          </div>
        </div>
      </aside>

      {/* ---------- Mobile top bar ---------- */}
      <header className="sticky top-0 z-40 flex items-center gap-2.5 border-b border-border bg-background/95 px-4 py-3 backdrop-blur min-[880px]:hidden">
        <BrandMark className="h-6 w-auto text-primary" />
        <div className="leading-tight">
          <div className="display-title text-[14px] uppercase tracking-[0.06em]">The Talent Table</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <GuideDialog
            trigger={
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Open the user guide key"
                aria-label="Open the user guide key"
              >
                <CircleHelp className="h-[19px] w-[19px]" />
              </button>
            }
          />
          <SaveIndicator />
        </div>
      </header>

      {/* ---------- Content ---------- */}
      <main className="px-4 pb-24 pt-6 min-[880px]:ml-[232px] min-[880px]:px-8 min-[880px]:pb-12 min-[880px]:pt-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>

      {/* ---------- Mobile bottom tab bar ---------- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur min-[880px]:hidden">
        {NAV.map((n) => {
          const Icon = n.icon
          const active = view === n.key
          return (
            <button
              key={n.key}
              type="button"
              onClick={() => onNavigate(n.key)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-[10.5px] font-semibold',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-[21px] w-[21px]" />
              {n.short}
            </button>
          )
        })}
      </nav>
    </div>
  )
}