import { Link, useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../hooks/useAuth'
import { useCatalogos } from '../hooks/useCatalogos'
import { useFiltrosUrl } from '../hooks/useFiltrosUrl'
import { Contenido } from '../components/Estados'
import { TablaFiltrable, Paginacion, type Columna } from '../components/TablaFiltrable'
import { IdExcel } from '../components/SemaforoBadge'
import { IconoMas } from '../components/Iconos'
import { numero, texto } from '../lib/format'
import type { PaginatedResponse, VProyecto } from '../shared/types'

export function Proyectos() {
  const navigate = useNavigate()
  const { puedeEditar, esEmpresa } = useAuth()
  const { datos: catalogos } = useCatalogos()
  const { filtros, setFiltro, limpiarFiltros, queryString, cantidadFiltros } = useFiltrosUrl()

  const { datos, cargando, error, recargar } = useApi<PaginatedResponse<VProyecto>>(
    `/proyectos?${queryString}`,
  )

  const sortBy = filtros.sortBy ?? 'permisos_pendientes'
  const sortDir = filtros.sortDir ?? 'desc'

  function ordenarPor(clave: string) {
    if (sortBy === clave) setFiltro('sortDir', sortDir === 'asc' ? 'desc' : 'asc')
    else {
      setFiltro('sortBy', clave)
      setFiltro('sortDir', 'desc')
    }
  }

  const columnas: Columna<VProyecto>[] = [
    {
      clave: 'nombre',
      titulo: 'Proyecto',
      ordenable: true,
      render: (p) => (
        <>
          <div className="celda-principal truncar">{p.nombre}</div>
          <div className="celda-secundaria">
            <IdExcel valor={p.id_excel} /> {p.titular ? `· ${p.titular}` : ''}
          </div>
        </>
      ),
    },
    {
      clave: 'empresa_nombre',
      titulo: 'Empresa',
      ordenable: true,
      render: (p) => texto(p.empresa_nombre),
    },
    { clave: 'sector', titulo: 'Sector', ordenable: true, render: (p) => texto(p.sector) },
    { clave: 'region', titulo: 'Región', ordenable: true, render: (p) => texto(p.region) },
    { clave: 'etapa', titulo: 'Etapa', ordenable: true, render: (p) => texto(p.etapa) },
    {
      clave: 'inversion_mmusd',
      titulo: 'Inversión (MMUSD)',
      ordenable: true,
      alinear: 'der',
      render: (p) => numero(p.inversion_mmusd),
    },
    {
      clave: 'total_permisos',
      titulo: 'Permisos',
      ordenable: true,
      alinear: 'der',
      render: (p) => numero(p.total_permisos),
    },
    {
      clave: 'permisos_pendientes',
      titulo: 'Pendientes',
      ordenable: true,
      alinear: 'der',
      render: (p) => <strong>{numero(p.permisos_pendientes)}</strong>,
    },
    {
      clave: 'permisos_6meses',
      titulo: '+6 meses',
      ordenable: true,
      alinear: 'der',
      render: (p) =>
        p.permisos_6meses > 0 ? (
          <span className="badge badge--critico">{numero(p.permisos_6meses)}</span>
        ) : (
          <span className="texto-tenue">0</span>
        ),
    },
  ]

  return (
    <>
      <div className="pagina-header">
        <div className="pagina-header__texto">
          <h1>Proyectos</h1>
          <p className="pagina-header__descripcion">
            {esEmpresa
              ? 'Tus proyectos y el estado de sus permisos.'
              : 'Proyectos de inversión en seguimiento y el estado de sus permisos.'}
          </p>
        </div>
        {puedeEditar && (
          <div className="pagina-header__acciones">
            <Link to="/proyectos/nuevo" className="btn btn--primario">
              <IconoMas /> Nuevo proyecto
            </Link>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel__header">
          <h2>Filtros</h2>
        </div>
        <div className="panel__cuerpo">
          <div className="filtros">
            <div className="campo">
              <label className="campo__label" htmlFor="p-buscar">Buscar</label>
              <input
                id="p-buscar"
                className="input"
                type="search"
                placeholder="Nombre del proyecto…"
                value={filtros.q ?? ''}
                onChange={(e) => setFiltro('q', e.target.value)}
              />
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="p-empresa">Empresa</label>
              <select
                id="p-empresa"
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
              <label className="campo__label" htmlFor="p-sector">Sector</label>
              <select
                id="p-sector"
                className="select"
                value={filtros.sector ?? ''}
                onChange={(e) => setFiltro('sector', e.target.value)}
              >
                <option value="">Todos</option>
                {catalogos?.sectores.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="p-region">Región</label>
              <select
                id="p-region"
                className="select"
                value={filtros.region ?? ''}
                onChange={(e) => setFiltro('region', e.target.value)}
              >
                <option value="">Todas</option>
                {catalogos?.regiones.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="p-etapa">Etapa</label>
              <select
                id="p-etapa"
                className="select"
                value={filtros.etapa ?? ''}
                onChange={(e) => setFiltro('etapa', e.target.value)}
              >
                <option value="">Todas</option>
                {catalogos?.etapas.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div className="campo">
              <label className="campo__label">Estado de permisos</label>
              <div className="columna" style={{ gap: 6 }}>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={filtros.con_permisos_6meses === 'true'}
                    onChange={(e) => setFiltro('con_permisos_6meses', e.target.checked ? 'true' : null)}
                  />
                  Con permisos +6 meses
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={filtros.sin_pendientes === 'true'}
                    onChange={(e) => setFiltro('sin_pendientes', e.target.checked ? 'true' : null)}
                  />
                  Sin pendientes
                </label>
              </div>
            </div>
          </div>

          <div className="filtros__pie">
            <div className="filtros__resumen">
              <strong>{(datos?.total ?? 0).toLocaleString('es-CL')}</strong> proyectos
              {cantidadFiltros > 0 && ` · ${cantidadFiltros} filtro${cantidadFiltros > 1 ? 's' : ''}`}
            </div>
            {cantidadFiltros > 0 && (
              <button type="button" className="btn btn--sm btn--secundario" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel__cuerpo panel__cuerpo--sin-padding">
          <Contenido cargando={cargando} error={error} datos={datos} recargar={recargar}>
            {(d) => (
              <>
                <TablaFiltrable
                  columnas={columnas}
                  filas={d.data}
                  claveFila={(p) => p.id}
                  onClickFila={(p) => navigate(`/proyectos/${p.id}`)}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onOrdenar={ordenarPor}
                  vacio={{ titulo: 'No hay proyectos con esos filtros' }}
                />
                {d.total > d.pageSize && (
                  <Paginacion
                    page={d.page}
                    pageSize={d.pageSize}
                    total={d.total}
                    onCambiarPagina={(n) => setFiltro('page', String(n))}
                  />
                )}
              </>
            )}
          </Contenido>
        </div>
      </div>
    </>
  )
}
