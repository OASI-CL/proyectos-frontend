import type { ReactNode } from 'react'

interface Props {
  title: string
  hint?: string
  notice?: ReactNode
  height?: number
  children: ReactNode
}

/** Panel wrapper shared by every chart, so they all line up. */
export function ChartCard({ title, hint, notice, height = 300, children }: Props) {
  return (
    <div className="panel">
      <div className="panel__header">
        <h2>{title}</h2>
        {hint && <span className="texto-sm texto-tenue">{hint}</span>}
      </div>
      <div className="panel__cuerpo">
        {notice && <div className="alerta alerta--aviso" style={{ marginBottom: 14 }}>{notice}</div>}
        <div style={{ height }}>{children}</div>
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
