import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { useFiltrosUrl } from '../hooks/useFiltrosUrl'
import { Contenido } from '../components/Estados'
import { TablaFiltrable, Paginacion, type Columna } from '../components/TablaFiltrable'
import { FiltrosPermisos } from '../components/FiltrosPermisos'
import { SemaforoBadge, EstadoBadge, IdExcel } from '../components/SemaforoBadge'
import { IconoDescargar } from '../components/Iconos'
import { fecha, numero, texto } from '../lib/format'
import { api } from '../lib/api'
import type { PaginatedResponse, VPermiso } from '../shared/types'

export function Permisos() {
  const navigate = useNavigate()
  const { filtros, setFiltro, limpiarFiltros, queryString, cantidadFiltros } = useFiltrosUrl()

  const { datos, cargando, error, recargar } = useApi<PaginatedResponse<VPermiso>>(
    `/permisos?${queryString}`,
  )

  const sortBy = filtros.sortBy ?? 'dias_tramitacion'
  const sortDir = filtros.sortDir ?? 'desc'

  function ordenarPor(clave: string) {
    if (sortBy === clave) {
      setFiltro('sortDir', sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setFiltro('sortBy', clave)
      setFiltro('sortDir', 'desc')
    }
  }

  async function exportar() {
    // Pide el CSV con los mismos filtros y lo descarga desde el navegador.
    const respuesta = await api.get(`/permisos/export?${queryString}`, { responseType: 'blob' })
    const url = URL.createObjectURL(respuesta.data as Blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `permisos-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(enlace)
    enlace.click()
    document.body.removeChild(enlace)
    URL.revokeObjectURL(url)
  }

  const columnas: Columna<VPermiso>[] = [
    {
      clave: 'nombre',
      titulo: 'Permiso',
      ordenable: true,
      render: (p) => (
        <>
          <div className="celda-principal truncar">{p.nombre}</div>
          <div className="celda-secundaria">
            <IdExcel valor={p.id_excel} />
            {p.critico && <span className="badge badge--critico-flag" style={{ marginLeft: 6 }}>Crítico</span>}
          </div>
        </>
      ),
    },
    {
      clave: 'organismo_nombre',
      titulo: 'Organismo',
      ordenable: true,
      render: (p) => (
        <>
          <div className="nowrap">{p.organismo_nombre}</div>
          <div className="celda-secundaria truncar">{p.ministerio_nombre}</div>
        </>
      ),
    },
    {
      clave: 'proyecto_nombre',
      titulo: 'Proyecto',
      ordenable: true,
      render: (p) => (
        <>
          <div className="truncar">{p.proyecto_nombre}</div>
          <div className="celda-secundaria">{texto(p.empresa_nombre)}</div>
        </>
      ),
    },
    {
      clave: 'estado',
      titulo: 'Estado',
      ordenable: true,
      render: (p) => <EstadoBadge valor={p.estado} />,
    },
    {
      clave: 'fecha_ingreso',
      titulo: 'Ingreso',
      ordenable: true,
      alinear: 'der',
      render: (p) => <span className="nowrap">{fecha(p.fecha_ingreso)}</span>,
    },
    {
      clave: 'dias_tramitacion',
      titulo: 'Días',
      ordenable: true,
      alinear: 'der',
      render: (p) => <strong>{numero(p.dias_tramitacion)}</strong>,
    },
    {
      clave: 'semaforo',
      titulo: 'Semáforo',
      ordenable: true,
      render: (p) => <SemaforoBadge valor={p.semaforo} />,
    },
  ]

  return (
    <>
      <div className="pagina-header">
        <div className="pagina-header__texto">
          <h1>Permisos</h1>
          <p className="pagina-header__descripcion">
            Todos los permisos sectoriales en seguimiento, con su estado y tiempo de tramitación.
          </p>
        </div>
        <div className="pagina-header__acciones">
          <button type="button" className="btn btn--secundario" onClick={exportar}>
            <IconoDescargar /> Exportar a Excel
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h2>Filtros</h2>
        </div>
        <FiltrosPermisos
          filtros={filtros}
          setFiltro={setFiltro}
          limpiarFiltros={limpiarFiltros}
          cantidadFiltros={cantidadFiltros}
          total={datos?.total ?? 0}
        />
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
                  onClickFila={(p) => navigate(`/permisos/${p.id}`)}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onOrdenar={ordenarPor}
                  vacio={{
                    titulo: 'No hay permisos con esos filtros',
                    texto: 'Probá quitando alguno o limpiando todos los filtros.',
                  }}
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
