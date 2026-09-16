import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../hooks/useAuth'
import { useCatalogos } from '../hooks/useCatalogos'
import { Contenido } from '../components/Estados'
import { SemaforoBadge, EstadoBadge, IdExcel } from '../components/SemaforoBadge'
import { HistorialLista } from '../components/HistorialLista'
import { AdjuntosPanel } from '../components/AdjuntosPanel'
import { IconoVolver, IconoGuardar } from '../components/Iconos'
import { api, mensajeError } from '../lib/api'
import { fecha, fechaInput, numero, texto, siNo, dias } from '../lib/format'
import type { VPermiso } from '../shared/types'

type Pestania = 'datos' | 'historial' | 'adjuntos'

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="dato__etiqueta">{etiqueta}</div>
      <div className="dato__valor">{children}</div>
    </div>
  )
}

export function PermisoDetalle() {
  const { id } = useParams()
  const { puedeEditar } = useAuth()
  const { datos: permiso, cargando, error, recargar } = useApi<VPermiso>(`/permisos/${id}`)
  const { datos: catalogos } = useCatalogos()

  const [editando, setEditando] = useState(false)
  const [pestania, setPestania] = useState<Pestania>('datos')
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  // Cuando llega el permiso (o se recarga), resetea el formulario.
  useEffect(() => {
    if (permiso) {
      setForm({
        nombre: permiso.nombre,
        // El estado se edita por id: en la base es una FK al catálogo
        // estados_permiso, no texto. La vista igual devuelve el nombre para
        // mostrarlo (permiso.estado).
        estado_id: permiso.estado_id,
        fecha_ingreso: fechaInput(permiso.fecha_ingreso),
        fecha_resolucion_estimada: fechaInput(permiso.fecha_resolucion_estimada),
        fecha_resolucion: fechaInput(permiso.fecha_resolucion),
        tipo_resolucion: permiso.tipo_resolucion ?? '',
        hito_tramitacion: permiso.hito_tramitacion ?? '',
        n_expediente: permiso.n_expediente ?? '',
        critico: permiso.critico,
        habilitante_construccion: permiso.habilitante_construccion,
        observaciones: permiso.observaciones ?? '',
      })
    }
  }, [permiso])

  function cambiar(campo: string, valor: unknown) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function guardar() {
    setGuardando(true)
    setMensaje(null)
    try {
      await api.patch(`/permisos/${id}`, form)
      setMensaje({ tipo: 'ok', texto: 'Cambios guardados. Quedaron registrados en el historial.' })
      setEditando(false)
      recargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Contenido cargando={cargando} error={error} datos={permiso} recargar={recargar}>
      {(p) => (
        <>
          <div className="migas">
            <Link to="/permisos">Permisos</Link>
            <span>/</span>
            {p.id_excel ?? `#${p.id}`}
          </div>

          <div className="pagina-header">
            <div className="pagina-header__texto">
              <h1>{p.nombre}</h1>
              <div className="fila" style={{ marginTop: 8 }}>
                <IdExcel valor={p.id_excel} />
                <EstadoBadge valor={p.estado} />
                <SemaforoBadge valor={p.semaforo} />
                {p.critico && <span className="badge badge--critico-flag">Crítico</span>}
                {p.habilitante_construccion && (
                  <span className="badge badge--info">Habilitante construcción</span>
                )}
              </div>
            </div>
            <div className="pagina-header__acciones">
              <Link to="/permisos" className="btn btn--secundario">
                <IconoVolver /> Volver
              </Link>
              {puedeEditar && !editando && (
                <button type="button" className="btn btn--primario" onClick={() => setEditando(true)}>
                  Editar permiso
                </button>
              )}
            </div>
          </div>

          {mensaje && (
            <div className={`alerta alerta--${mensaje.tipo === 'ok' ? 'ok' : 'error'}`}>
              {mensaje.texto}
            </div>
          )}

          {/* --- Resumen siempre visible --- */}
          <div className="kpis">
            <div className="kpi kpi--neutro">
              <div className="kpi__etiqueta">Días de tramitación</div>
              <div className="kpi__valor">{numero(p.dias_tramitacion)}</div>
              <div className="kpi__detalle">desde {fecha(p.fecha_ingreso)}</div>
            </div>
            <div className="kpi">
              <div className="kpi__etiqueta">Organismo</div>
              <div className="kpi__valor" style={{ fontSize: 20 }}>{p.organismo_nombre}</div>
              <div className="kpi__detalle">{p.ministerio_nombre}</div>
            </div>
            <div className="kpi">
              <div className="kpi__etiqueta">Proyecto</div>
              <div className="kpi__valor" style={{ fontSize: 15, lineHeight: 1.3 }}>
                <Link to={`/proyectos/${p.proyecto_id}`}>{p.proyecto_nombre}</Link>
              </div>
              <div className="kpi__detalle">{texto(p.empresa_nombre)}</div>
            </div>
          </div>

          {/* --- Pestañas --- */}
          <div className="panel">
            <div className="panel__header">
              <div className="fila">
                {(['datos', 'historial', 'adjuntos'] as Pestania[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`btn btn--sm ${pestania === t ? 'btn--primario' : 'btn--texto'}`}
                    onClick={() => setPestania(t)}
                  >
                    {t === 'datos' ? 'Datos del permiso' : t === 'historial' ? 'Historial de cambios' : 'Adjuntos'}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel__cuerpo">
              {pestania === 'datos' && !editando && (
                <div className="datos">
                  <Dato etiqueta="Nombre estándar">{texto(p.nombre_estandar)}</Dato>
                  <Dato etiqueta="Tipo de permiso">{texto(p.tipo_permiso)}</Dato>
                  <Dato etiqueta="N° de expediente">{texto(p.n_expediente)}</Dato>
                  <Dato etiqueta="Estado"><EstadoBadge valor={p.estado} /></Dato>
                  <Dato etiqueta="Fecha de ingreso">{fecha(p.fecha_ingreso)}</Dato>
                  <Dato etiqueta="Resolución estimada">{fecha(p.fecha_resolucion_estimada)}</Dato>
                  <Dato etiqueta="Fecha de resolución">{fecha(p.fecha_resolucion)}</Dato>
                  <Dato etiqueta="Tipo de resolución">{texto(p.tipo_resolucion)}</Dato>
                  <Dato etiqueta="Hito de tramitación">{texto(p.hito_tramitacion)}</Dato>
                  <Dato etiqueta="Días de tramitación">{dias(p.dias_tramitacion)}</Dato>
                  <Dato etiqueta="Crítico">{siNo(p.critico)}</Dato>
                  <Dato etiqueta="Habilitante construcción">{siNo(p.habilitante_construccion)}</Dato>
                  <Dato etiqueta="Qué habilita">{texto(p.que_habilita)}</Dato>
                  <Dato etiqueta="Región">{texto(p.region)}</Dato>
                  <Dato etiqueta="Sector">{texto(p.sector)}</Dato>
                  <Dato etiqueta="N° de catastro">{texto(p.n_catastro)}</Dato>
                  <div className="ancho-completo" style={{ gridColumn: '1 / -1' }}>
                    <div className="dato__etiqueta">Observaciones</div>
                    <div className="dato__valor" style={{ whiteSpace: 'pre-wrap' }}>
                      {texto(p.observaciones)}
                    </div>
                  </div>
                </div>
              )}

              {pestania === 'datos' && editando && (
                <>
                  <div className="form-grid">
                    <div className="campo ancho-completo">
                      <label className="campo__label" htmlFor="e-nombre">Nombre del permiso</label>
                      <input
                        id="e-nombre"
                        className="input"
                        value={String(form.nombre ?? '')}
                        onChange={(e) => cambiar('nombre', e.target.value)}
                      />
                    </div>

                    <div className="campo">
                      <label className="campo__label" htmlFor="e-estado">Estado</label>
                      <select
                        id="e-estado"
                        className="select"
                        value={String(form.estado_id ?? '')}
                        onChange={(e) => cambiar('estado_id', Number(e.target.value))}
                      >
                        {catalogos?.estados.map((e) => (
                          <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="campo">
                      <label className="campo__label" htmlFor="e-expediente">N° de expediente</label>
                      <input
                        id="e-expediente"
                        className="input"
                        value={String(form.n_expediente ?? '')}
                        onChange={(e) => cambiar('n_expediente', e.target.value)}
                      />
                    </div>

                    <div className="campo">
                      <label className="campo__label" htmlFor="e-ingreso">Fecha de ingreso</label>
                      <input
                        id="e-ingreso"
                        className="input"
                        type="date"
                        value={String(form.fecha_ingreso ?? '')}
                        onChange={(e) => cambiar('fecha_ingreso', e.target.value)}
                      />
                    </div>

                    <div className="campo">
                      <label className="campo__label" htmlFor="e-estimada">Resolución estimada</label>
                      <input
                        id="e-estimada"
                        className="input"
                        type="date"
                        value={String(form.fecha_resolucion_estimada ?? '')}
                        onChange={(e) => cambiar('fecha_resolucion_estimada', e.target.value)}
                      />
                    </div>

                    <div className="campo">
                      <label className="campo__label" htmlFor="e-resolucion">Fecha de resolución</label>
                      <input
                        id="e-resolucion"
                        className="input"
                        type="date"
                        value={String(form.fecha_resolucion ?? '')}
                        onChange={(e) => cambiar('fecha_resolucion', e.target.value)}
                      />
                    </div>

                    <div className="campo">
                      <label className="campo__label" htmlFor="e-tipo-res">Tipo de resolución</label>
                      <select
                        id="e-tipo-res"
                        className="select"
                        value={String(form.tipo_resolucion ?? '')}
                        onChange={(e) => cambiar('tipo_resolucion', e.target.value)}
                      >
                        <option value="">Sin definir</option>
                        <option value="Favorable">Favorable</option>
                        <option value="No favorable">No favorable</option>
                      </select>
                    </div>

                    <div className="campo">
                      <label className="campo__label" htmlFor="e-hito">Hito de tramitación</label>
                      <input
                        id="e-hito"
                        className="input"
                        value={String(form.hito_tramitacion ?? '')}
                        onChange={(e) => cambiar('hito_tramitacion', e.target.value)}
                      />
                    </div>

                    <div className="campo">
                      <label className="campo__label">Marcas</label>
                      <div className="columna" style={{ gap: 6 }}>
                        <label className="check">
                          <input
                            type="checkbox"
                            checked={Boolean(form.critico)}
                            onChange={(e) => cambiar('critico', e.target.checked)}
                          />
                          Es un permiso crítico
                        </label>
                        <label className="check">
                          <input
                            type="checkbox"
                            checked={Boolean(form.habilitante_construccion)}
                            onChange={(e) => cambiar('habilitante_construccion', e.target.checked)}
                          />
                          Habilitante para la construcción
                        </label>
                      </div>
                    </div>

                    <div className="campo ancho-completo">
                      <label className="campo__label" htmlFor="e-obs">Observaciones</label>
                      <textarea
                        id="e-obs"
                        className="textarea"
                        value={String(form.observaciones ?? '')}
                        onChange={(e) => cambiar('observaciones', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-acciones">
                    <button
                      type="button"
                      className="btn btn--secundario"
                      onClick={() => { setEditando(false); setMensaje(null) }}
                      disabled={guardando}
                    >
                      Cancelar
                    </button>
                    <button type="button" className="btn btn--primario" onClick={guardar} disabled={guardando}>
                      <IconoGuardar /> {guardando ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                  </div>
                </>
              )}

              {pestania === 'historial' && <HistorialLista permisoId={p.id} />}
              {pestania === 'adjuntos' && <AdjuntosPanel permisoId={p.id} />}
            </div>
          </div>
        </>
      )}
    </Contenido>
  )
}
