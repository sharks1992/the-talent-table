import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { DataMeta, EditsState, Player, PlayerEdit, SaveStatus } from '@/types'
import { fetchMetaFromPool, fetchPool, fetchRoster } from '@/lib/data'
import { loadEdits, persistEdits } from '@/lib/storage'

type LoadState = 'loading' | 'ready' | 'error'

interface AppState {
  meta: DataMeta | null
  bakedRoster: Player[]
  pool: Player[]
  rosterState: LoadState
  poolState: LoadState
  retryLoad: () => void
  edits: EditsState
  patch: (id: string, obj: Partial<PlayerEdit>) => void
  addImportedPlayers: (players: Player[]) => void
  saveStatus: SaveStatus
  roster: Player[]
  getPlayer: (id: string) => Player | undefined
  searchPool: Player[]
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<DataMeta | null>(null)
  const [bakedRoster, setBakedRoster] = useState<Player[]>([])
  const [pool, setPool] = useState<Player[]>([])
  const [rosterState, setRosterState] = useState<LoadState>('loading')
  const [poolState, setPoolState] = useState<LoadState>('loading')
  const [edits, setEdits] = useState<EditsState>(() => loadEdits())
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const saveTimer = useRef<number | null>(null)
  const runId = useRef(0)

  const load = useCallback(() => {
    const id = ++runId.current
    setRosterState((s) => (s === 'ready' ? s : 'loading'))
    setPoolState((s) => (s === 'ready' ? s : 'loading'))
    // Phase 1: small roster file — render the roster ASAP.
    fetchRoster()
      .then((r) => {
        if (runId.current !== id) return
        setMeta(r.meta)
        setBakedRoster(r.bakedRoster)
        setRosterState('ready')
      })
      .catch(() => {
        // Fallback: the full file carries the same metadata + baked roster.
        fetchMetaFromPool()
          .then((r) => {
            if (runId.current !== id) return
            setMeta(r.meta)
            setBakedRoster(r.bakedRoster)
            setRosterState('ready')
          })
          .catch(() => {
            if (runId.current !== id) return
            setRosterState('error')
          })
      })
    // Phase 2: the 15 MB benchmark pool, with retries inside fetchPool.
    fetchPool()
      .then((players) => {
        if (runId.current !== id) return
        setPool(players)
        setPoolState('ready')
      })
      .catch(() => {
        if (runId.current !== id) return
        setPoolState('error')
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const persist = useCallback((next: EditsState) => {
    setSaveStatus('saving')
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      persistEdits(next)
      setSaveStatus('saved')
    }, 600)
  }, [])

  const patch = useCallback(
    (id: string, obj: Partial<PlayerEdit>) => {
      setEdits((prev) => {
        const merged: PlayerEdit = Object.assign({}, prev[id], obj, { id })
        if (!bakedRoster.find((b) => b.id === id)) merged._added = true
        const next = Object.assign({}, prev, { [id]: merged })
        persist(next)
        return next
      })
    },
    [bakedRoster, persist],
  )

  const addImportedPlayers = useCallback(
    (players: Player[]) => {
      setEdits((prev) => {
        const next = Object.assign({}, prev)
        players.forEach((p) => {
          if (!p.id) return
          next[p.id] = Object.assign({}, next[p.id], p, { id: p.id, _added: true })
        })
        persist(next)
        return next
      })
    },
    [persist],
  )

  /** Roster = baked players overlaid with edits + pasted additions (original roster()). */
  const roster = useMemo(() => {
    const list = bakedRoster.map((p) => ({ ...p, ...(p.id ? edits[p.id] || {} : {}) }))
    Object.values(edits).forEach((e) => {
      if (e && e._added && !bakedRoster.find((b) => b.id === e.id)) list.push({ ...(e as Player) })
    })
    return list
  }, [bakedRoster, edits])

  const getPlayer = useCallback((id: string) => roster.find((p) => p.id === id), [roster])

  /** Everything searchable: the benchmark pool + Our Players flagged with _our. */
  const searchPool = useMemo(
    () => pool.concat(roster.map((p) => ({ ...p, _our: true }))),
    [pool, roster],
  )

  const value: AppState = {
    meta,
    bakedRoster,
    pool,
    rosterState,
    poolState,
    retryLoad: load,
    edits,
    patch,
    addImportedPlayers,
    saveStatus,
    roster,
    getPlayer,
    searchPool,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used inside AppProvider')
  return v
}