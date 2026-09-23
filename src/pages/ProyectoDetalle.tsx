import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../hooks/useAuth'
import { Contenido } from '../components/Estados'
import { TablaFiltrable, type Columna } from '../components/TablaFiltrable'
import { SemaforoBadge, EstadoBadge, IdExcel } from '../components/SemaforoBadge'
import { IconoVolver, IconoMas } from '../components/Iconos'
import { LineaTiempoProyecto } from '../components/LineaTiempoProyecto'
import { fecha, numero, texto, mmusd } from '../lib/format'
import type { VPermiso, VProyecto } from '../shared/types'

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="dato__etiqueta">{etiqueta}</div>
      <div className="dato__valor">{children}</div>
    </div>
  )
}

export function ProyectoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { puedeEditar } = useAuth()

  const proyecto = useApi<VProyecto>(`/proyectos/${id}`)
  const permisos = useApi<VPermiso[]>(`/proyectos/${id}/permisos`)

  const columnas: Columna<VPermiso>[] = [
    {
      clave: 'nombre',
      titulo: 'Permiso',
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
      render: (p) => (
        <>
          <div className="nowrap">{p.organismo_nombre}</div>
          <div className="celda-secundaria truncar">{p.ministerio_nombre}</div>
        </>
      ),
    },
    {
      clave: 'habilitante_construccion',
      titulo: 'Habilitante',
      render: (p) =>
        p.habilitante_construccion ? (
          <span className="badge badge--info">Sí</span>
        ) : (
          <span className="texto-tenue">No</span>
        ),
    },
    { clave: 'estado', titulo: 'Estado', render: (p) => <EstadoBadge valor={p.estado} /> },
    {
      clave: 'fecha_ingreso',
      titulo: 'Ingreso',
      alinear: 'der',
      render: (p) => <span className="nowrap">{fecha(p.fecha_ingreso)}</span>,
    },
    {
      clave: 'dias_tramitacion',
      titulo: 'Días',
      alinear: 'der',
      render: (p) => <strong>{numero(p.dias_tramitacion)}</strong>,
    },
    { clave: 'semaforo', titulo: 'Semáforo', render: (p) => <SemaforoBadge valor={p.semaforo} /> },
  ]

  return (
    <Contenido
      cargando={proyecto.cargando}
      error={proyecto.error}
      datos={proyecto.datos}
      recargar={proyecto.recargar}
    >
      {(p) => (
        <>
          <div className="migas">
            <Link to="/proyectos">Proyectos</Link>
            <span>/</span>
            {p.id_excel ?? `#${p.id}`}
          </div>

          <div className="pagina-header">
            <div className="pagina-header__texto">
              <h1>{p.nombre}</h1>
              <div className="fila" style={{ marginTop: 8 }}>
                <IdExcel valor={p.id_excel} />
                <span className="texto-suave">{texto(p.empresa_nombre)}</span>
                {p.estado_validacion !== 'validado' && (
                  <span className="badge badge--pendiente">
                    {p.estado_validacion === 'en_revision' ? 'En revisión de OASI' : 'Borrador'}
                  </span>
                )}
              </div>
            </div>
            <div className="pagina-header__acciones">
              <Link to="/proyectos" className="btn btn--secundario">
                <IconoVolver /> Volver
              </Link>
              {puedeEditar && (
                <Link to={`/proyectos/${p.id}/permisos/nuevo`} className="btn btn--primario">
                  <IconoMas /> Agregar permiso
                </Link>
              )}
            </div>
          </div>

          <div className="kpis">
            <div className="kpi">
              <div className="kpi__etiqueta">Total de permisos</div>
              <div className="kpi__valor">{numero(p.total_permisos)}</div>
            </div>
            <div className="kpi kpi--alerta">
              <div className="kpi__etiqueta">Pendientes</div>
              <div className="kpi__valor">{numero(p.permisos_pendientes)}</div>
            </div>
            <div className="kpi kpi--critico">
              <div className="kpi__etiqueta">Superan 6 meses</div>
              <div className="kpi__valor kpi__valor--critico">{numero(p.permisos_6meses)}</div>
            </div>
            <div className="kpi kpi--neutro">
              <div className="kpi__etiqueta">Inversión</div>
              <div className="kpi__valor" style={{ fontSize: 22 }}>{mmusd(p.inversion_mmusd)}</div>
            </div>
          </div>

          <div className="panel">
            <div className="panel__header">
              <h2>Línea de tiempo</h2>
            </div>
            <div className="panel__cuerpo" style={{ overflowX: 'auto' }}>
              <LineaTiempoProyecto proyecto={p} permisos={permisos.datos ?? []} />
            </div>
          </div>

          <div className="panel">
            <div className="panel__header">
              <h2>Datos del proyecto</h2>
            </div>
            <div className="panel__cuerpo">
              <div className="datos">
                <Dato etiqueta="Titular">{texto(p.titular)}</Dato>
                <Dato etiqueta="Empresa">{texto(p.empresa_nombre)}</Dato>
                <Dato etiqueta="Sector">{texto(p.sector)}</Dato>
                <Dato etiqueta="Región">{texto(p.region)}</Dato>
                <Dato etiqueta="Etapa">{texto(p.etapa)}</Dato>
                <Dato etiqueta="Estado ambiental">{texto(p.estado_ambiental)}</Dato>
                <Dato etiqueta="Inversión">{mmusd(p.inversion_mmusd)}</Dato>
                <Dato etiqueta="Empleo en construcción">{numero(p.empleo_construccion)}</Dato>
                <Dato etiqueta="Empleo en operación">{numero(p.empleo_operacion)}</Dato>
                <Dato etiqueta="Inicio de construcción">{fecha(p.fecha_inicio_construccion)}</Dato>
                <Dato etiqueta="Inicio de operación">{fecha(p.fecha_inicio_operacion)}</Dato>
                <Dato etiqueta="Fecha de ingreso">{fecha(p.fecha_ingreso)}</Dato>
              </div>
              {p.observaciones_oasi && (
                <div style={{ marginTop: 20 }}>
                  <div className="dato__etiqueta">Observaciones OASI</div>
                  <div className="dato__valor" style={{ whiteSpace: 'pre-wrap' }}>{p.observaciones_oasi}</div>
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel__header">
              <h2>Permisos del proyecto</h2>
              <Link to={`/permisos?proyecto_id=${p.id}`} className="btn btn--sm btn--texto">
                Ver en la lista completa
              </Link>
            </div>
            <div className="panel__cuerpo panel__cuerpo--sin-padding">
              <Contenido
                cargando={permisos.cargando}
                error={permisos.error}
                datos={permisos.datos}
                recargar={permisos.recargar}
              >
                {(lista) => (
                  <TablaFiltrable
                    columnas={columnas}
                    filas={lista}
                    claveFila={(x) => x.id}
                    onClickFila={(x) => navigate(`/permisos/${x.id}`)}
                    vacio={{
                      titulo: 'Este proyecto no tiene permisos cargados',
                      texto: puedeEditar ? 'Podés agregar el primero con el botón de arriba.' : undefined,
                    }}
                  />
                )}
              </Contenido>
            </div>
          </div>
        </>
      )}
    </Contenido>
  )
}
