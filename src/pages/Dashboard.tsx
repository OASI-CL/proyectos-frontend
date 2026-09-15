import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../hooks/useAuth'
import { Contenido } from '../components/Estados'
import { TablaFiltrable, type Columna } from '../components/TablaFiltrable'
import { SemaforoBadge, IdExcel } from '../components/SemaforoBadge'
import { fecha, numero, mmusdCompacto, ETIQUETAS_SEMAFORO } from '../lib/format'

interface DatosDashboard {
  kpis: {
    total_permisos: number
    pendientes: number
    pendientes_6meses: number
    resueltos: number
    criticos_pendientes: number
    promedio_dias_pendientes: number | null
    total_proyectos: number
    proyectos_con_pendientes: number
    inversion_bloqueada_mmusd: number
  }
  por_organismo: {
    organismo_id: number
    organismo_nombre: string
    ministerio_nombre: string
    pendientes: number
    supera_6_meses: number
    promedio_dias: number | null
  }[]
  evolucion_comites: {
    comite_numero: number
    comite_fecha: string
    permisos_en_agenda: number
    permisos_resueltos: number
    promedio_dias: number | null
  }[]
  semaforo: { semaforo: string; cantidad: number }[]
  mas_antiguos: {
    id: number
    id_excel: string | null
    nombre: string
    organismo_nombre: string
    proyecto_nombre: string
    empresa_nombre: string
    fecha_ingreso: string | null
    dias_tramitacion: number | null
    semaforo: string
  }[]
}

const COLORES_SEMAFORO: Record<string, string> = {
  en_plazo: '#009933',
  en_alerta: '#FFCC00',
  critico: '#CC0000',
  finalizado: '#D9D9D9',
}

function TooltipCustom({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="tooltip-custom">
      <div className="tooltip-custom__titulo">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{numero(p.value)}</strong>
        </div>
      ))}
    </div>
  )
}

export function Dashboard() {
  const { datos, cargando, error, recargar } = useApi<DatosDashboard>('/dashboard')
  const { esEmpresa, rol } = useAuth()
  const navigate = useNavigate()

  const columnasAntiguos: Columna<DatosDashboard['mas_antiguos'][number]>[] = [
    {
      clave: 'permiso',
      titulo: 'Permiso',
      render: (p) => (
        <>
          <div className="celda-principal truncar">{p.nombre}</div>
          <div className="celda-secundaria">
            <IdExcel valor={p.id_excel} /> · {p.organismo_nombre}
          </div>
        </>
      ),
    },
    {
      clave: 'proyecto',
      titulo: 'Proyecto',
      render: (p) => (
        <>
          <div className="truncar">{p.proyecto_nombre}</div>
          <div className="celda-secundaria">{p.empresa_nombre}</div>
        </>
      ),
    },
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
    {
      clave: 'semaforo',
      titulo: 'Semáforo',
      render: (p) => <SemaforoBadge valor={p.semaforo} />,
    },
  ]

  return (
    <>
      <div className="pagina-header">
        <div className="pagina-header__texto">
          <h1>Dashboard</h1>
          <p className="pagina-header__descripcion">
            {esEmpresa
              ? 'Resumen de los permisos de tus proyectos.'
              : 'Estado general de los permisos sectoriales en seguimiento.'}
          </p>
        </div>
      </div>

      <Contenido cargando={cargando} error={error} datos={datos} recargar={recargar}>
        {(d) => (
          <>
            <div className="kpis">
              <div className="kpi kpi--alerta">
                <div className="kpi__etiqueta">Permisos pendientes</div>
                <div className="kpi__valor">{numero(d.kpis.pendientes)}</div>
                <div className="kpi__detalle">de {numero(d.kpis.total_permisos)} en seguimiento</div>
              </div>

              <div className="kpi kpi--critico">
                <div className="kpi__etiqueta">Superan 6 meses</div>
                <div className="kpi__valor kpi__valor--critico">{numero(d.kpis.pendientes_6meses)}</div>
                <div className="kpi__detalle">
                  {d.kpis.pendientes > 0
                    ? `${Math.round((d.kpis.pendientes_6meses / d.kpis.pendientes) * 100)}% de los pendientes`
                    : 'sin pendientes'}
                </div>
              </div>

              <div className="kpi">
                <div className="kpi__etiqueta">Inversión bloqueada</div>
                <div className="kpi__valor">{mmusdCompacto(d.kpis.inversion_bloqueada_mmusd)}</div>
                <div className="kpi__detalle">
                  MMUSD · {numero(d.kpis.proyectos_con_pendientes)} proyectos con pendientes
                </div>
              </div>

              <div className="kpi kpi--neutro">
                <div className="kpi__etiqueta">Promedio de tramitación</div>
                <div className="kpi__valor">{numero(d.kpis.promedio_dias_pendientes)}</div>
                <div className="kpi__detalle">días, permisos pendientes</div>
              </div>

              <div className="kpi kpi--ok">
                <div className="kpi__etiqueta">Resueltos</div>
                <div className="kpi__valor">{numero(d.kpis.resueltos)}</div>
                <div className="kpi__detalle">{numero(d.kpis.total_proyectos)} proyectos en total</div>
              </div>
            </div>

            <div className="graficos">
              <div className="panel">
                <div className="panel__header">
                  <h2>Permisos pendientes por organismo</h2>
                  <Link to="/organismos" className="btn btn--sm btn--texto">Ver detalle</Link>
                </div>
                <div className="panel__cuerpo">
                  <div className="grafico-alto">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={d.por_organismo.slice(0, 10)}
                        margin={{ top: 4, right: 8, left: 0, bottom: 44 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E1E6F0" vertical={false} />
                        <XAxis
                          dataKey="organismo_nombre"
                          angle={-38}
                          textAnchor="end"
                          interval={0}
                          height={60}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<TooltipCustom />} cursor={{ fill: '#D3DEF2', opacity: 0.4 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="pendientes" name="Pendientes" fill="#006BB9" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="supera_6_meses" name="Supera 6 meses" fill="#CC0000" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel__header">
                  <h2>Distribución por semáforo</h2>
                </div>
                <div className="panel__cuerpo">
                  <div className="grafico-alto">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={d.semaforo.map((s) => ({
                            ...s,
                            etiqueta: ETIQUETAS_SEMAFORO[s.semaforo] ?? s.semaforo,
                          }))}
                          dataKey="cantidad"
                          nameKey="etiqueta"
                          innerRadius={62}
                          outerRadius={96}
                          paddingAngle={2}
                        >
                          {d.semaforo.map((s) => (
                            <Cell key={s.semaforo} fill={COLORES_SEMAFORO[s.semaforo] ?? '#7F7F7F'} />
                          ))}
                        </Pie>
                        <Tooltip content={<TooltipCustom />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {d.evolucion_comites.length > 0 && (
              <div className="panel mt-24">
                <div className="panel__header">
                  <h2>Evolución a través de los comités</h2>
                  <span className="texto-sm texto-tenue">
                    Permisos en agenda y resueltos por sesión
                  </span>
                </div>
                <div className="panel__cuerpo">
                  <div className="grafico-alto">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={d.evolucion_comites.map((c) => ({
                          ...c,
                          etiqueta: `Comité ${c.comite_numero}`,
                        }))}
                        margin={{ top: 8, right: 32, left: 0, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E1E6F0" />
                        <XAxis dataKey="etiqueta" />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<TooltipCustom />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line
                          type="monotone"
                          dataKey="permisos_en_agenda"
                          name="En agenda"
                          stroke="#25306B"
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="permisos_resueltos"
                          name="Resueltos"
                          stroke="#009933"
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            <div className="panel mt-24">
              <div className="panel__header">
                <h2>Permisos más antiguos sin resolver</h2>
                <Link to="/permisos?tramo=mas_6&estado=Pendiente" className="btn btn--sm btn--texto">
                  Ver todos los +6 meses
                </Link>
              </div>
              <div className="panel__cuerpo panel__cuerpo--sin-padding">
                <TablaFiltrable
                  columnas={columnasAntiguos}
                  filas={d.mas_antiguos}
                  claveFila={(p) => p.id}
                  onClickFila={(p) => navigate(`/permisos/${p.id}`)}
                  vacio={{ titulo: 'No hay permisos pendientes', texto: 'Todos los permisos están resueltos.' }}
                />
              </div>
            </div>

            {rol === 'organismo_lector' && (
              <div className="alerta alerta--info mt-24">
                Estás viendo solo los permisos de tu organismo.
              </div>
            )}
          </>
        )}
      </Contenido>
    </>
  )
}
