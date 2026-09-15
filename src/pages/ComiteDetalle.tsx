import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { Contenido } from '../components/Estados'
import { TablaFiltrable, type Columna } from '../components/TablaFiltrable'
import { EstadoBadge, IdExcel } from '../components/SemaforoBadge'
import { IconoVolver, IconoDescargar } from '../components/Iconos'
import { fecha, numero, texto } from '../lib/format'

interface PermisoComite {
  id: number
  id_excel: string | null
  nombre: string
  organismo_nombre: string
  ministerio_nombre: string
  proyecto_id: number
  proyecto_nombre: string
  empresa_nombre: string
  fecha_ingreso: string | null
  dias_tramitacion: number | null
  estado_a_la_fecha: string
  compromiso: string | null
  supera_6_meses: boolean | null
}

interface RespuestaComite {
  sesion: {
    comite_numero: number
    comite_fecha: string
    permisos_en_agenda: number
    permisos_resueltos: number
    promedio_dias: number | null
  }
  permisos: PermisoComite[]
}

export function ComiteDetalle() {
  const { numero: numeroComite } = useParams()
  const navigate = useNavigate()
  const { datos, cargando, error, recargar } = useApi<RespuestaComite>(`/comites/${numeroComite}`)

  function exportarCsv(d: RespuestaComite) {
    const columnas = ['id_excel', 'nombre', 'organismo_nombre', 'proyecto_nombre', 'empresa_nombre',
      'fecha_ingreso', 'dias_tramitacion', 'estado_a_la_fecha', 'compromiso']
    const escapar = (v: unknown) => {
      if (v === null || v === undefined) return ''
      const s = String(v).replace(/"/g, '""')
      return /[",;\n]/.test(s) ? `"${s}"` : s
    }
    const csv = [
      columnas.join(';'),
      ...d.permisos.map((p) => columnas.map((c) => escapar((p as any)[c])).join(';')),
    ].join('\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `comite-${numeroComite}.csv`
    document.body.appendChild(enlace)
    enlace.click()
    document.body.removeChild(enlace)
    URL.revokeObjectURL(url)
  }

  const columnas: Columna<PermisoComite>[] = [
    {
      clave: 'nombre',
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
          <div className="celda-secundaria">{texto(p.empresa_nombre)}</div>
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
      clave: 'dias',
      titulo: 'Días a la fecha',
      alinear: 'der',
      render: (p) => (
        <strong className={p.supera_6_meses ? 'texto-critico' : undefined}
          style={p.supera_6_meses ? { color: 'var(--rojo)' } : undefined}>
          {numero(p.dias_tramitacion)}
        </strong>
      ),
    },
    {
      clave: 'estado',
      titulo: 'Estado a esa fecha',
      render: (p) => <EstadoBadge valor={p.estado_a_la_fecha} />,
    },
    {
      clave: 'compromiso',
      titulo: 'Compromiso',
      render: (p) => <span className="truncar">{texto(p.compromiso)}</span>,
    },
  ]

  return (
    <Contenido cargando={cargando} error={error} datos={datos} recargar={recargar}>
      {(d) => (
        <>
          <div className="migas">
            <Link to="/comites">Comités</Link>
            <span>/</span>
            Comité {d.sesion.comite_numero}
          </div>

          <div className="pagina-header">
            <div className="pagina-header__texto">
              <h1>Comité {d.sesion.comite_numero}</h1>
              <p className="pagina-header__descripcion">
                Sesión del {fecha(d.sesion.comite_fecha)}. Los días de tramitación y el estado
                están calculados <strong>a esa fecha</strong>.
              </p>
            </div>
            <div className="pagina-header__acciones">
              <Link to="/comites" className="btn btn--secundario">
                <IconoVolver /> Volver
              </Link>
              <button type="button" className="btn btn--secundario" onClick={() => exportarCsv(d)}>
                <IconoDescargar /> Exportar tabla
              </button>
            </div>
          </div>

          <div className="kpis">
            <div className="kpi">
              <div className="kpi__etiqueta">Permisos en agenda</div>
              <div className="kpi__valor">{numero(d.sesion.permisos_en_agenda)}</div>
            </div>
            <div className="kpi kpi--ok">
              <div className="kpi__etiqueta">Resueltos a esa fecha</div>
              <div className="kpi__valor">{numero(d.sesion.permisos_resueltos)}</div>
            </div>
            <div className="kpi kpi--neutro">
              <div className="kpi__etiqueta">Promedio de días</div>
              <div className="kpi__valor">{numero(d.sesion.promedio_dias)}</div>
            </div>
          </div>

          <div className="panel">
            <div className="panel__header">
              <h2>Tabla de la sesión</h2>
            </div>
            <div className="panel__cuerpo panel__cuerpo--sin-padding">
              <TablaFiltrable
                columnas={columnas}
                filas={d.permisos}
                claveFila={(p) => p.id}
                onClickFila={(p) => navigate(`/permisos/${p.id}`)}
                vacio={{
                  titulo: 'Esta sesión no tiene permisos en agenda',
                  texto: 'El Excel de origen no asoció ningún permiso a este comité.',
                }}
              />
            </div>
          </div>
        </>
      )}
    </Contenido>
  )
}
