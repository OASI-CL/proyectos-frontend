import { useCatalogos } from '../hooks/useCatalogos'

interface Props {
  filtros: Record<string, string>
  setFiltro: (clave: string, valor: string | null) => void
  limpiarFiltros: () => void
  cantidadFiltros: number
  total: number
}

/**
 * Filtros de la página de Permisos. Todos escriben en la URL (useFiltrosUrl),
 * así la vista filtrada se puede compartir por link.
 */
export function FiltrosPermisos({ filtros, setFiltro, limpiarFiltros, cantidadFiltros, total }: Props) {
  const { datos: catalogos } = useCatalogos()

  return (
    <div className="panel__cuerpo">
      <div className="filtros">
        <div className="campo">
          <label className="campo__label" htmlFor="f-buscar">Buscar</label>
          <input
            id="f-buscar"
            className="input"
            type="search"
            placeholder="Nombre de permiso o proyecto…"
            value={filtros.q ?? ''}
            onChange={(e) => setFiltro('q', e.target.value)}
          />
        </div>

        <div className="campo">
          <label className="campo__label" htmlFor="f-organismo">Organismo</label>
          <select
            id="f-organismo"
            className="select"
            value={filtros.organismo_id ?? ''}
            onChange={(e) => setFiltro('organismo_id', e.target.value)}
          >
            <option value="">Todos</option>
            {catalogos?.organismos.map((o) => (
              <option key={o.id} value={o.id}>{o.nombre}</option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label className="campo__label" htmlFor="f-ministerio">Ministerio</label>
          <select
            id="f-ministerio"
            className="select"
            value={filtros.ministerio_id ?? ''}
            onChange={(e) => setFiltro('ministerio_id', e.target.value)}
          >
            <option value="">Todos</option>
            {catalogos?.ministerios.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label className="campo__label" htmlFor="f-estado">Estado</label>
          <select
            id="f-estado"
            className="select"
            value={filtros.estado ?? ''}
            onChange={(e) => setFiltro('estado', e.target.value)}
          >
            <option value="">Todos</option>
            {catalogos?.estados.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label className="campo__label" htmlFor="f-tramo">Tramo de tramitación</label>
          <select
            id="f-tramo"
            className="select"
            value={filtros.tramo ?? ''}
            onChange={(e) => setFiltro('tramo', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="menos_3">Menos de 3 meses</option>
            <option value="entre_3_6">Entre 3 y 6 meses</option>
            <option value="mas_6">Supera 6 meses</option>
          </select>
        </div>

        <div className="campo">
          <label className="campo__label" htmlFor="f-region">Región</label>
          <select
            id="f-region"
            className="select"
            value={filtros.region ?? ''}
            onChange={(e) => setFiltro('region', e.target.value)}
          >
            <option value="">Todas</option>
            {catalogos?.regiones.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label className="campo__label" htmlFor="f-sector">Sector</label>
          <select
            id="f-sector"
            className="select"
            value={filtros.sector ?? ''}
            onChange={(e) => setFiltro('sector', e.target.value)}
          >
            <option value="">Todos</option>
            {catalogos?.sectores.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label className="campo__label" htmlFor="f-empresa">Empresa</label>
          <select
            id="f-empresa"
            className="select"
            value={filtros.empresa_id ?? ''}
            onChange={(e) => setFiltro('empresa_id', e.target.value)}
          >
            <option value="">Todas</option>
            {catalogos?.empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label className="campo__label" htmlFor="f-desde">Ingreso desde</label>
          <input
            id="f-desde"
            className="input"
            type="date"
            value={filtros.fecha_ingreso_desde ?? ''}
            onChange={(e) => setFiltro('fecha_ingreso_desde', e.target.value)}
          />
        </div>

        <div className="campo">
          <label className="campo__label" htmlFor="f-hasta">Ingreso hasta</label>
          <input
            id="f-hasta"
            className="input"
            type="date"
            value={filtros.fecha_ingreso_hasta ?? ''}
            onChange={(e) => setFiltro('fecha_ingreso_hasta', e.target.value)}
          />
        </div>

        <div className="campo">
          <label className="campo__label">Marcas</label>
          <div className="columna" style={{ gap: 6 }}>
            <label className="check">
              <input
                type="checkbox"
                checked={filtros.critico === 'true'}
                onChange={(e) => setFiltro('critico', e.target.checked ? 'true' : null)}
              />
              Solo críticos
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={filtros.habilitante === 'true'}
                onChange={(e) => setFiltro('habilitante', e.target.checked ? 'true' : null)}
              />
              Solo habilitantes
            </label>
          </div>
        </div>
      </div>

      <div className="filtros__pie">
        <div className="filtros__resumen">
          <strong>{total.toLocaleString('es-CL')}</strong> permisos
          {cantidadFiltros > 0 && ` · ${cantidadFiltros} filtro${cantidadFiltros > 1 ? 's' : ''} aplicado${cantidadFiltros > 1 ? 's' : ''}`}
        </div>
        {cantidadFiltros > 0 && (
          <button type="button" className="btn btn--sm btn--secundario" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}
