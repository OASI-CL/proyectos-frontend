import type { ReactNode } from 'react'

interface Props {
  title: string
  hint?: string
  notice?: ReactNode
  height?: number
  children: ReactNode
}

/**
 * Panel wrapper shared by every chart, so they all line up.
 *
 * `height` is a MINIMUM, not a fixed size. Two ChartCards side by side in a
 * `.graficos` grid row stretch to the same outer height (CSS grid's default
 * `align-items: stretch`) whenever their own `height` props differ or their
 * header wraps to a different number of lines — but a plain fixed-height
 * inner div doesn't grow with that stretch, so the shorter chart's content
 * (its legend, above all) stays put and the extra space shows up as blank
 * white space at the bottom of that panel. `panel--grafico` makes the panel
 * a flex column and the content area `flex: 1`, so it always fills however
 * tall the row actually turned out to be — the two charts' legends end up
 * at the same Y no matter what.
 */
export function ChartCard({ title, hint, notice, height = 300, children }: Props) {
  return (
    <div className="panel panel--grafico">
      <div className="panel__header">
        <h2>{title}</h2>
        {hint && <span className="texto-sm texto-tenue">{hint}</span>}
      </div>
      <div className="panel__cuerpo">
        {notice && <div className="alerta alerta--aviso" style={{ marginBottom: 14 }}>{notice}</div>}
        {/* flexGrow+flexBasis, not the `flex: 1` shorthand: that sets
            flex-basis to 0%, and a standalone chart (nothing stretching its
            panel taller) then has no free space to grow into — it collapses
            to 0px and the whole chart goes blank (ResponsiveContainer measures
            a 0-height parent). flexBasis: height gives it a real starting
            size always; flexGrow still lets it expand when a taller sibling
            stretches the panel. */}
        <div style={{ flexGrow: 1, flexBasis: height, minHeight: height }}>{children}</div>
      </div>
    </div>
  )
}

/** Section divider for PROYECTOS / PERMISOS. */
export function SectionTitle({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="section-title">
      <div>
        <h2 className="section-title__text">{title}</h2>
        {description && <p className="section-title__description">{description}</p>}
      </div>
      {children}
    </div>
  )
}
