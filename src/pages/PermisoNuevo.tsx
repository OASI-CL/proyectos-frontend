import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../hooks/useAuth'
import { useCatalogos } from '../hooks/useCatalogos'
import { IconoVolver, IconoGuardar } from '../components/Iconos'
import { api, mensajeError } from '../lib/api'
import type { VProyecto } from '../shared/types'

export function PermisoNuevo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { esEmpresa, puedeEditar } = useAuth()
  const { datos: catalogos } = useCatalogos()
  const { datos: proyecto } = useApi<VProyecto>(`/proyectos/${id}`)

  // estado_id 1 = 'Pendiente' (id estable del catálogo estados_permiso).
  const [form, setForm] = useState<Record<string, string | boolean>>({ estado_id: '1' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function cambiar(campo: string, valor: string | boolean) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      const { data } = await api.post(`/proyectos/${id}/permisos`, {
        ...form,
        organismo_id: form.organismo_id ? Number(form.organismo_id) : undefined,
        estado_id: form.estado_id ? Number(form.estado_id) : undefined,
      })
      navigate(`/permisos/${data.id}`)
    } catch (err) {
      setError(mensajeError(err))
      setGuardando(false)
    }
  }

  if (!puedeEditar) {
    return <div className="alerta alerta--aviso">Tu rol es de solo lectura, no podés crear permisos.</div>
  }

  return (
    <>
      <div className="migas">
        <Link to="/proyectos">Proyectos</Link>
        <span>/</span>
        <Link to={`/proyectos/${id}`}>{proyecto?.id_excel ?? `#${id}`}</Link>
        <span>/</span>
        Nuevo permiso
      </div>

      <div className="pagina-header">
        <div className="pagina-header__texto">
          <h1>Agregar permiso</h1>
          {proyecto && (
            <p className="pagina-header__descripcion">
              Al proyecto <strong>{proyecto.nombre}</strong>
            </p>
          )}
        </div>
        <div className="pagina-header__acciones">
          <Link to={`/proyectos/${id}`} className="btn btn--secundario">
            <IconoVolver /> Cancelar
          </Link>
        </div>
      </div>

      {esEmpresa && (
        <div className="alerta alerta--info">
          El permiso va a quedar <strong>en revisión</strong> hasta que el equipo OASI lo valide.
        </div>
      )}

      {error && <div className="alerta alerta--error">{error}</div>}

      <form className="panel" onSubmit={guardar}>
        <div className="panel__header">
          <h2>Datos del permiso</h2>
        </div>
        <div className="panel__cuerpo">
          <div className="form-grid">
            <div className="campo ancho-completo">
              <label className="campo__label" htmlFor="np-nombre">Nombre del permiso *</label>
              <input
                id="np-nombre"
                className="input"
                required
                value={String(form.nombre ?? '')}
                onChange={(e) => cambiar('nombre', e.target.value)}
              />
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="np-organismo">Organismo *</label>
              <select
                id="np-organismo"
                className="select"
                required
                value={String(form.organismo_id ?? '')}
                onChange={(e) => cambiar('organismo_id', e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {catalogos?.organismos.map((o) => (
                  <option key={o.id} value={o.id}>{o.nombre} — {o.ministerio_nombre}</option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="np-tipo">Tipo de permiso</label>
              <input
                id="np-tipo"
                className="input"
                value={String(form.tipo_permiso ?? '')}
                onChange={(e) => cambiar('tipo_permiso', e.target.value)}
              />
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="np-expediente">N° de expediente</label>
              <input
                id="np-expediente"
                className="input"
                value={String(form.n_expediente ?? '')}
                onChange={(e) => cambiar('n_expediente', e.target.value)}
              />
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="np-estado">Estado</label>
              <select
                id="np-estado"
                className="select"
                value={String(form.estado_id ?? '1')}
                onChange={(e) => cambiar('estado_id', e.target.value)}
              >
                {catalogos?.estados.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="np-ingreso">Fecha de ingreso</label>
              <input
                id="np-ingreso"
                className="input"
                type="date"
                value={String(form.fecha_ingreso ?? '')}
                onChange={(e) => cambiar('fecha_ingreso', e.target.value)}
              />
              <span className="campo__ayuda">Desde esta fecha se cuentan los días de tramitación.</span>
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="np-estimada">Resolución estimada</label>
              <input
                id="np-estimada"
                className="input"
                type="date"
                value={String(form.fecha_resolucion_estimada ?? '')}
                onChange={(e) => cambiar('fecha_resolucion_estimada', e.target.value)}
              />
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="np-habilita">Qué habilita</label>
              <input
                id="np-habilita"
                className="input"
                placeholder="Construcción, operación, acceso al terreno…"
                value={String(form.que_habilita ?? '')}
                onChange={(e) => cambiar('que_habilita', e.target.value)}
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
              <label className="campo__label" htmlFor="np-obs">Observaciones</label>
              <textarea
                id="np-obs"
                className="textarea"
                value={String(form.observaciones ?? '')}
                onChange={(e) => cambiar('observaciones', e.target.value)}
              />
            </div>
          </div>

          <div className="form-acciones">
            <Link to={`/proyectos/${id}`} className="btn btn--secundario">Cancelar</Link>
            <button type="submit" className="btn btn--primario" disabled={guardando}>
              <IconoGuardar /> {guardando ? 'Creando…' : 'Crear permiso'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
