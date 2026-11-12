import { useEffect, useId, useMemo, useRef, useState } from 'react'

export interface MultiSelectOption {
  value: string
  label: string
}

interface Props {
  label: string
  /** Picked values (empty = no filter). */
  values: string[]
  options: MultiSelectOption[]
  /** What the button says when nothing is picked ("Todos", "Todas"...). */
  placeholder: string
  /** Tick/untick one value. Must add up against the latest state (see useDashboardFilters.toggleFilter). */
  onToggle: (value: string) => void
  /** Untick everything. */
  onClear: () => void
  /** Fixed by the user's account: shown, with a lock, but not editable. */
  locked?: boolean
}

/** Show a search box only when the list is long enough to need it. */
const SEARCH_FROM = 8

/**
 * Dropdown with checkboxes, for filters that take several values at once
 * (e.g. agencies CMN and SAG). Picks of the same filter are OR'ed.
 *
 * Picked values that are no longer among the narrowed options (because
 * another filter changed) stay listed, so they can always be unticked.
 */
export function MultiSelect({ label, values, options, placeholder, onToggle, onClear, locked }: Props) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  // Close when clicking anywhere outside, or with Escape.
  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const allOptions = useMemo(() => {
    const known = new Set(options.map((o) => o.value))
    return [...options, ...values.filter((v) => !known.has(v)).map((v) => ({ value: v, label: v }))]
  }, [options, values])

  const labelOf = (value: string) => allOptions.find((o) => o.value === value)?.label ?? value
  const summary =
    values.length === 0
      ? placeholder
      : values.length <= 2
        ? values.map(labelOf).join(', ')
        : `${values.length} seleccionados`

  const term = search.trim().toLowerCase()
  const visible = term ? allOptions.filter((o) => o.label.toLowerCase().includes(term)) : allOptions

  return (
    <div className="campo multiselect" ref={rootRef}>
      <label className="campo__label" htmlFor={id}>
        {label}
        {values.length > 1 && <span className="multiselect__count">{values.length}</span>}
        {locked && <span className="texto-tenue" title="Fijo según tu cuenta"> 🔒</span>}
      </label>
      <button
        id={id}
        type="button"
        className={`select multiselect__button ${values.length ? 'multiselect__button--active' : ''}`}
        disabled={locked}
        title={locked ? 'Fijo según tu cuenta' : values.map(labelOf).join(', ') || undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="multiselect__summary">{summary}</span>
      </button>

      {open && (
        <div className="multiselect__panel" role="listbox" aria-multiselectable="true">
          {allOptions.length >= SEARCH_FROM && (
            <input
              className="input multiselect__search"
              placeholder="Buscar…"
              value={search}
              autoFocus
              onChange={(event) => setSearch(event.target.value)}
            />
          )}
          <div className="multiselect__options">
            {visible.length === 0 && <div className="multiselect__empty">Sin opciones</div>}
            {visible.map((option) => (
              <label key={option.value} className="multiselect__option">
                <input
                  type="checkbox"
                  checked={values.includes(option.value)}
                  onChange={() => onToggle(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {values.length > 0 && (
            <button type="button" className="multiselect__clear" onClick={onClear}>
              Quitar selección ({values.length})
            </button>
          )}
        </div>
      )}
    </div>
  )
}
