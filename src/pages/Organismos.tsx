import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useApi } from '../hooks/useApi'
import { Contenido } from '../components/Estados'
import { TablaFiltrable, type Columna } from '../components/TablaFiltrable'
import { numero, mmusd } from '../lib/format'

interface ResumenOrganismo {
  organismo_id: number
  organismo_nombre: string
  ministerio_nombre: string
  pendientes: number
  supera_6_meses: number
  promedio_dias: number | null
  inversion_bloqueada_mmusd: number | null
}

export function Organismos() {
  const navigate = useNavigate()
  const { datos, cargando, error, recargar } = useApi<ResumenOrganismo[]>('/organismos')

  const columnas: Columna<ResumenOrganismo>[] = [
    {
      clave: 'organismo',
      titulo: 'Organismo',
      render: (o) => (
        <>
          <div className="celda-principal">{o.organismo_nombre}</div>
          <div className="celda-secundaria">{o.ministerio_nombre}</div>
        </>
      ),
    },
    {
      clave: 'pendientes',
      titulo: 'Pendientes',
      alinear: 'der',
      render: (o) => <strong>{numero(o.pendientes)}</strong>,
    },
    {
      clave: 'supera_6',
      titulo: 'Superan 6 meses',
      alinear: 'der',
      render: (o) =>
        o.supera_6_meses > 0 ? (
          <span className="badge badge--critico">{numero(o.supera_6_meses)}</span>
        ) : (
          <span className="texto-tenue">0</span>
        ),
    },
    {
      clave: 'promedio',
      titulo: 'Promedio de días',
      alinear: 'der',
      render: (o) => numero(o.promedio_dias),
    },
    {
      clave: 'inversion',
      titulo: 'Inversión bloqueada',
      alinear: 'der',
      render: (o) => mmusd(o.inversion_bloqueada_mmusd),
    },
  ]

  return (
    <>
      <div className="pagina-header">
        <div className="pagina-header__texto">
          <h1>Organismos</h1>
          <p className="pagina-header__descripcion">
            Carga de permisos pendientes por organismo sectorial y su tiempo promedio de
            tramitación.
          </p>
        </div>
      </div>

      <Contenido cargando={cargando} error={error} datos={datos} recargar={recargar}>
        {(lista) => (
          <>
            <div className="panel">
              <div className="panel__header">
                <h2>Pendientes por organismo</h2>
              </div>
              <div className="panel__cuerpo">
                <div style={{ height: Math.max(260, lista.length * 32) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={lista}
                      layout="vertical"
                      margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E1E6F0" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="organismo_nombre"
                        width={140}
                        interval={0}
                      />
                      <Tooltip cursor={{ fill: '#D3DEF2', opacity: 0.4 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="pendientes" name="Pendientes" fill="#006BB9" radius={[0, 3, 3, 0]} />
                      <Bar dataKey="supera_6_meses" name="Supera 6 meses" fill="#CC0000" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel__header">
                <h2>Detalle</h2>
                <span className="texto-sm texto-tenue">Clic en una fila para ver sus permisos</span>
              </div>
              <div className="panel__cuerpo panel__cuerpo--sin-padding">
                <TablaFiltrable
                  columnas={columnas}
                  filas={lista}
                  claveFila={(o) => o.organismo_id}
                  onClickFila={(o) =>
                    navigate(`/permisos?organismo_id=${o.organismo_id}&estado=Pendiente`)
                  }
                  vacio={{ titulo: 'No hay organismos con permisos' }}
                />
              </div>
            </div>
          </>
        )}
      </Contenido>
    </>
  )
}
