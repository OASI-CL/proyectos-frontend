import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { Contenido } from '../components/Estados'
import { TablaFiltrable, type Columna } from '../components/TablaFiltrable'
import { fecha, numero } from '../lib/format'

interface ResumenComite {
  comite_id: number
  comite_numero: number
  comite_fecha: string
  permisos_en_agenda: number
  permisos_resueltos: number
  promedio_dias: number | null
}

export function Comites() {
  const navigate = useNavigate()
  const { datos, cargando, error, recargar } = useApi<ResumenComite[]>('/comites')

  const hoy = new Date().toISOString().slice(0, 10)

  const columnas: Columna<ResumenComite>[] = [
    {
      clave: 'numero',
      titulo: 'Sesión',
      render: (c) => (
        <>
          <div className="celda-principal">Comité {c.comite_numero}</div>
          {c.comite_fecha.slice(0, 10) > hoy && (
            <div className="celda-secundaria">
              <span className="badge badge--info">Próxima</span>
            </div>
          )}
        </>
      ),
    },
    {
      clave: 'fecha',
      titulo: 'Fecha',
      render: (c) => <span className="nowrap">{fecha(c.comite_fecha)}</span>,
    },
    {
      clave: 'agenda',
      titulo: 'Permisos en agenda',
      alinear: 'der',
      render: (c) => numero(c.permisos_en_agenda),
    },
    {
      clave: 'resueltos',
      titulo: 'Resueltos a esa fecha',
      alinear: 'der',
      render: (c) =>
        c.permisos_resueltos > 0 ? (
          <span className="badge badge--resuelto">{numero(c.permisos_resueltos)}</span>
        ) : (
          <span className="texto-tenue">0</span>
        ),
    },
    {
      clave: 'promedio',
      titulo: 'Promedio de días',
      alinear: 'der',
      render: (c) => numero(c.promedio_dias),
    },
  ]

  return (
    <>
      <div className="pagina-header">
        <div className="pagina-header__texto">
          <h1>Comités</h1>
          <p className="pagina-header__descripcion">
            Sesiones del comité. Cada tabla se reconstruye con los datos <strong>a la fecha de
            esa sesión</strong>, no a la fecha de hoy.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel__cuerpo panel__cuerpo--sin-padding">
          <Contenido cargando={cargando} error={error} datos={datos} recargar={recargar}>
            {(lista) => (
              <TablaFiltrable
                columnas={columnas}
                filas={lista}
                claveFila={(c) => c.comite_numero}
                onClickFila={(c) => navigate(`/comites/${c.comite_numero}`)}
                vacio={{ titulo: 'No hay sesiones registradas' }}
              />
            )}
          </Contenido>
        </div>
      </div>

      <div className="alerta alerta--info mt-16">
        Las sesiones sin permisos en agenda son las que el Excel de origen no traía asociadas a
        ningún permiso (el archivo solo registra el comité actual de cada permiso, no el
        historial completo).
      </div>
    </>
  )
}
