import type { ReactNode } from 'react'
import { Vacio } from './Estados'

export interface Columna<T> {
  clave: string
  titulo: string
  /** Si es true, el encabezado ordena por esta columna (la API ordena). */
  ordenable?: boolean
  alinear?: 'izq' | 'der' | 'centro'
  ancho?: string
  render: (fila: T) => ReactNode
}

interface Props<T> {
  columnas: Columna<T>[]
  filas: T[]
  claveFila: (fila: T) => string | number
  onClickFila?: (fila: T) => void
  sortBy?: string
  sortDir?: string
  onOrdenar?: (clave: string) => void
  vacio?: { titulo: string; texto?: string }
}

/**
 * Tabla de datos con orden por columna. El orden y la paginación los resuelve
 * la API (son 1.500+ permisos, no conviene traerlos todos al navegador).
 */
export function TablaFiltrable<T>({
  columnas,
  filas,
  claveFila,
  onClickFila,
  sortBy,
  sortDir,
  onOrdenar,
  vacio,
}: Props<T>) {
  if (filas.length === 0) {
    return (
      <Vacio
        titulo={vacio?.titulo ?? 'Sin resultados'}
        texto={vacio?.texto ?? 'Probá quitando algunos filtros.'}
      />
    )
  }

  return (
    <div className="tabla-scroll">
      <table className="tabla">
        <thead>
          <tr>
            {columnas.map((col) => {
              const activa = sortBy === col.clave
              const puedeOrdenar = col.ordenable && onOrdenar
              return (
                <th
                  key={col.clave}
                  style={col.ancho ? { width: col.ancho } : undefined}
                  className={[
                    puedeOrdenar ? 'ordenable' : '',
                    col.alinear === 'der' ? 'der' : col.alinear === 'centro' ? 'centro' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={puedeOrdenar ? () => onOrdenar(col.clave) : undefined}
                  aria-sort={activa ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {col.titulo}
                  {puedeOrdenar && (
                    <span className={`flecha ${activa ? 'flecha--activa' : ''}`}>
                      {activa ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr
              key={claveFila(fila)}
              className={onClickFila ? 'clickeable' : undefined}
              onClick={onClickFila ? () => onClickFila(fila) : undefined}
            >
              {columnas.map((col) => (
                <td
                  key={col.clave}
                  className={col.alinear === 'der' ? 'der' : col.alinear === 'centro' ? 'centro' : ''}
                >
                  {col.render(fila)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface PaginacionProps {
  page: number
  pageSize: number
  total: number
  onCambiarPagina: (pagina: number) => void
}

export function Paginacion({ page, pageSize, total, onCambiarPagina }: PaginacionProps) {
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize))
  const desde = total === 0 ? 0 : (page - 1) * pageSize + 1
  const hasta = Math.min(page * pageSize, total)

  return (
    <div className="paginacion">
      <div className="paginacion__info">
        Mostrando <strong className="tabular">{desde}–{hasta}</strong> de{' '}
        <strong className="tabular">{total.toLocaleString('es-CL')}</strong>
      </div>
      <div className="paginacion__controles">
        <button
          type="button"
          className="btn btn--sm btn--secundario"
          disabled={page <= 1}
          onClick={() => onCambiarPagina(page - 1)}
        >
          Anterior
        </button>
        <span className="texto-sm texto-suave tabular" style={{ padding: '0 8px' }}>
          Página {page} de {totalPaginas}
        </span>
        <button
          type="button"
          className="btn btn--sm btn--secundario"
          disabled={page >= totalPaginas}
          onClick={() => onCambiarPagina(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
