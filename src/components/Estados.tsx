import type { ReactNode } from 'react'

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="estado-caja">
      <div className="cargando-barra" style={{ maxWidth: 220, margin: '0 auto 16px' }} />
      <div className="estado-caja__texto">{texto}</div>
    </div>
  )
}

export function ErrorCaja({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  return (
    <div className="alerta alerta--error">
      <div style={{ flex: 1 }}>
        <strong>No se pudieron cargar los datos.</strong>
        <div style={{ marginTop: 4 }}>{mensaje}</div>
      </div>
      {onReintentar && (
        <button type="button" className="btn btn--sm btn--secundario" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  )
}

export function Vacio({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <div className="estado-caja">
      <div className="estado-caja__titulo">{titulo}</div>
      {texto && <div className="estado-caja__texto">{texto}</div>}
    </div>
  )
}

/**
 * Envuelve el patrón cargando / error / vacío / contenido, que se repite en
 * todas las páginas.
 */
export function Contenido<T>({
  cargando,
  error,
  datos,
  recargar,
  vacio,
  children,
}: {
  cargando: boolean
  error: string | null
  datos: T | null
  recargar?: () => void
  vacio?: { titulo: string; texto?: string }
  children: (datos: T) => ReactNode
}) {
  if (cargando) return <Cargando />
  if (error) return <ErrorCaja mensaje={error} onReintentar={recargar} />
  if (!datos) return <Vacio titulo={vacio?.titulo ?? 'Sin datos'} texto={vacio?.texto} />
  return <>{children(datos)}</>
}
