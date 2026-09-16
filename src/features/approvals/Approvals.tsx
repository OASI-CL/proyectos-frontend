import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import { Contenido } from '../../components/Estados'
import { api, mensajeError } from '../../lib/api'
import { formatDateTime, formatText } from '../../lib/formatters'

type EstadoFiltro = 'pendiente' | 'aprobada' | 'rechazada' | 'todas'

interface SolicitudFila {
  id: number
  entidad: 'proyecto' | 'permiso'
  entidadId: number
  tipo: 'creacion' | 'edicion'
  cambios: Record<string, unknown>
  estado: 'pendiente' | 'aprobada' | 'rechazada'
  comentario: string | null
  solicitadoPor: string
  solicitadoPorNombre: string | null
  solicitadoAt: string
  revisadoPorNombre: string | null
  revisadoAt: string | null
  comentarioRevision: string | null
  entidadNombre: string | null
  entidadIdExcel: string | null
  empresaNombre: string | null
  organismoNombre: string | null
  region: string | null
}

/** Field names as the reviewer knows them, not as the DB spells them. */
const ETIQUETAS_CAMPO: Record<string, string> = {
  nombre: 'Nombre',
  nombre_estandar: 'Nombre estándar',
  tipo_permiso: 'Tipo de permiso',
  n_expediente: 'N° de expediente',
  critico: 'Crítico',
  que_habilita: 'Qué habilita',
  habilitante_construccion: 'Habilitante construcción',
  estado: 'Estado',
  fecha_ingreso: 'Fecha de ingreso',
  fecha_resolucion_estimada: 'Resolución estimada',
  fecha_resolucion: 'Fecha de resolución',
  tipo_resolucion: 'Tipo de resolución',
  hito_tramitacion: 'Hito de tramitación',
  incluido_catastro_hacienda: 'Incluido en catastro',
  n_catastro: 'N° de catastro',
  observaciones: 'Observaciones',
  titular: 'Titular',
  region: 'Región',
  sector: 'Sector',
  inversion_mmusd: 'Inversión (MMUSD)',
  empleo_construccion: 'Empleo construcción',
  empleo_operacion: 'Empleo operación',
  estado_ambiental: 'Estado ambiental',
  etapa: 'Etapa',
  fecha_inicio_construccion: 'Inicio de construcción',
  fecha_inicio_operacion: 'Inicio de operación',
  observaciones_oasi: 'Observaciones OASI',
}

function valorLegible(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '(vacío)'
  if (valor === true) return 'Sí'
  if (valor === false) return 'No'
  return String(valor)
}

/**
 * Approvals queue.
 *
 * OASI/admin review what empresa and organismo submit. The submitting roles
 * see the same screen scoped to their own records, so they can follow up on
 * what they sent — but without the approve/reject buttons.
 */
export function Approvals() {
  const navigate = useNavigate()
  const { puedeAprobar } = useAuth()
  const [estado, setEstado] = useState<EstadoFiltro>('pendiente')
  const [procesando, setProcesando] = useState<number | null>(null)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const { datos, cargando, error, recargar } = useApi<SolicitudFila[]>(`/approvals?estado=${estado}`)

  async function revisar(id: number, accion: 'approve' | 'reject') {
    const comentario = window.prompt(
      accion === 'approve'
        ? 'Comentario para el solicitante (opcional):'
        : '¿Por qué se rechaza? (el solicitante lo va a ver)',
      '',
    )
    // prompt devuelve null si cancelaron
    if (comentario === null) return

    setProcesando(id)
    setMensaje(null)
    try {
      await api.post(`/approvals/${id}/${accion}`, { comentario: comentario || undefined })
      setMensaje({
        tipo: 'ok',
        texto: accion === 'approve' ? 'Solicitud aprobada y aplicada.' : 'Solicitud rechazada.',
      })
      recargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) })
    } finally {
      setProcesando(null)
    }
  }

  return (
    <>
      <div className="pagina-header">
        <div className="pagina-header__texto">
          <h1>Aprobaciones</h1>
          <p className="pagina-header__descripcion">
            {puedeAprobar
              ? 'Cambios que enviaron las empresas y los organismos, esperando revisión de OASI.'
              : 'Los cambios que enviaste, y en qué estado quedaron.'}
          </p>
        </div>
        <div className="pagina-header__acciones">
          <div className="campo">
            <label className="campo__label" htmlFor="f-estado-solicitud">Estado</label>
            <select
              id="f-estado-solicitud"
              className="select"
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoFiltro)}
            >
              <option value="pendiente">Pendientes</option>
              <option value="aprobada">Aprobadas</option>
              <option value="rechazada">Rechazadas</option>
              <option value="todas">Todas</option>
            </select>
          </div>
        </div>
      </div>

      {mensaje && (
        <div className={`alerta alerta--${mensaje.tipo === 'ok' ? 'ok' : 'error'}`}>
          {mensaje.texto}
        </div>
      )}

      <Contenido cargando={cargando} error={error} datos={datos} recargar={recargar}>
        {(solicitudes) =>
          solicitudes.length === 0 ? (
            <div className="panel">
              <div className="estado-caja">
                <div className="estado-caja__titulo">
                  {estado === 'pendiente' ? 'No hay nada pendiente' : 'Sin solicitudes'}
                </div>
                <div className="estado-caja__texto">
                  {estado === 'pendiente' && puedeAprobar
                    ? 'Cuando una empresa u organismo envíe un cambio, va a aparecer acá.'
                    : 'No hay solicitudes con ese estado.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="columna" style={{ gap: 16 }}>
              {solicitudes.map((s) => (
                <div key={s.id} className="panel">
                  <div className="panel__header">
                    <div>
                      <h2>
                        {s.tipo === 'creacion' ? 'Alta de ' : 'Edición de '}
                        {s.entidad === 'proyecto' ? 'proyecto' : 'permiso'}
                      </h2>
                      <div className="celda-secundaria" style={{ marginTop: 2 }}>
                        {s.entidadIdExcel && (
                          <span className="badge-id" style={{ marginRight: 6 }}>{s.entidadIdExcel}</span>
                        )}
                        {formatText(s.entidadNombre)}
                      </div>
                    </div>
                    <div className="fila" style={{ gap: 8 }}>
                      <EstadoSolicitudBadge estado={s.estado} />
                      <button
                        type="button"
                        className="btn btn--sm btn--secundario"
                        onClick={() =>
                          navigate(
                            s.entidad === 'proyecto'
                              ? `/proyectos/${s.entidadId}`
                              : `/permisos/${s.entidadId}`,
                          )
                        }
                      >
                        Ver ficha
                      </button>
                    </div>
                  </div>

                  <div className="panel__cuerpo">
                    <div className="datos" style={{ marginBottom: 14 }}>
                      <Dato etiqueta="Solicitado por">
                        {formatText(s.solicitadoPorNombre ?? s.solicitadoPor)}
                      </Dato>
                      <Dato etiqueta="Fecha">{formatDateTime(s.solicitadoAt)}</Dato>
                      {s.organismoNombre && <Dato etiqueta="Organismo">{s.organismoNombre}</Dato>}
                      {s.empresaNombre && <Dato etiqueta="Empresa">{s.empresaNombre}</Dato>}
                      {s.region && <Dato etiqueta="Región">{s.region}</Dato>}
                    </div>

                    {s.comentario && (
                      <div className="alerta alerta--info" style={{ marginBottom: 14 }}>
                        <div>
                          <strong>Nota del solicitante:</strong> {s.comentario}
                        </div>
                      </div>
                    )}

                    {s.tipo === 'creacion' ? (
                      <p className="texto-suave mb-0">
                        Es un registro nuevo, todavía sin validar. Aprobarlo lo incorpora a los
                        reportes; rechazarlo lo deja como borrador, fuera de los totales.
                      </p>
                    ) : (
                      <div className="tabla-scroll">
                        <table className="tabla">
                          <thead>
                            <tr>
                              <th>Campo</th>
                              <th>Valor propuesto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(s.cambios).map(([campo, valor]) => (
                              <tr key={campo}>
                                <td className="celda-principal">
                                  {ETIQUETAS_CAMPO[campo] ?? campo}
                                </td>
                                <td>{valorLegible(valor)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {s.estado !== 'pendiente' && (
                      <div className="texto-sm texto-suave" style={{ marginTop: 14 }}>
                        Revisado por {formatText(s.revisadoPorNombre)} el{' '}
                        {formatDateTime(s.revisadoAt)}
                        {s.comentarioRevision && <> — “{s.comentarioRevision}”</>}
                      </div>
                    )}

                    {puedeAprobar && s.estado === 'pendiente' && (
                      <div className="form-acciones">
                        <button
                          type="button"
                          className="btn btn--peligro"
                          disabled={procesando === s.id}
                          onClick={() => revisar(s.id, 'reject')}
                        >
                          Rechazar
                        </button>
                        <button
                          type="button"
                          className="btn btn--primario"
                          disabled={procesando === s.id}
                          onClick={() => revisar(s.id, 'approve')}
                        >
                          {procesando === s.id ? 'Aplicando…' : 'Aprobar y aplicar'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </Contenido>
    </>
  )
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="dato__etiqueta">{etiqueta}</div>
      <div className="dato__valor">{children}</div>
    </div>
  )
}

function EstadoSolicitudBadge({ estado }: { estado: SolicitudFila['estado'] }) {
  const clase =
    estado === 'aprobada'
      ? 'badge--resuelto'
      : estado === 'rechazada'
        ? 'badge--critico'
        : 'badge--pendiente'
  const texto = estado === 'aprobada' ? 'Aprobada' : estado === 'rechazada' ? 'Rechazada' : 'Pendiente'
  return <span className={`badge ${clase}`}>{texto}</span>
}
