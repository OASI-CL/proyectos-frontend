import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCatalogos } from '../hooks/useCatalogos'
import { IconoVolver, IconoGuardar } from '../components/Iconos'
import { api, mensajeError } from '../lib/api'

export function ProyectoNuevo() {
  const navigate = useNavigate()
  const { esEmpresa, puedeEditar } = useAuth()
  const { datos: catalogos } = useCatalogos()

  const [form, setForm] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function cambiar(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      // region/sector/etapa se mandan como id de catálogo: en la base son
      // FKs (proyectos.region_id, ...), no texto. Los <select> de abajo ya
      // llevan el id en el value.
      const { data } = await api.post('/proyectos', {
        ...form,
        empresa_id: form.empresa_id ? Number(form.empresa_id) : undefined,
        region_id: form.region_id ? Number(form.region_id) : null,
        sector_id: form.sector_id ? Number(form.sector_id) : null,
        etapa_id: form.etapa_id ? Number(form.etapa_id) : null,
        inversion_mmusd: form.inversion_mmusd ? Number(form.inversion_mmusd) : null,
        empleo_construccion: form.empleo_construccion ? Number(form.empleo_construccion) : null,
        empleo_operacion: form.empleo_operacion ? Number(form.empleo_operacion) : null,
      })
      navigate(`/proyectos/${data.id}`)
    } catch (err) {
      setError(mensajeError(err))
      setGuardando(false)
    }
  }

  if (!puedeEditar) {
    return (
      <div className="alerta alerta--aviso">
        Tu rol es de solo lectura, no podés crear proyectos.
      </div>
    )
  }

  return (
    <>
      <div className="migas">
        <Link to="/proyectos">Proyectos</Link>
        <span>/</span>
        Nuevo
      </div>

      <div className="pagina-header">
        <div className="pagina-header__texto">
          <h1>Nuevo proyecto</h1>
          <p className="pagina-header__descripcion">
            Los proyectos creados desde la app no tienen ID del Excel: se identifican por su
            nombre y el ID que asigna el sistema.
          </p>
        </div>
        <div className="pagina-header__acciones">
          <Link to="/proyectos" className="btn btn--secundario">
            <IconoVolver /> Cancelar
          </Link>
        </div>
      </div>

      {esEmpresa && (
        <div className="alerta alerta--info">
          El proyecto va a quedar <strong>en revisión</strong> hasta que el equipo OASI lo valide.
        </div>
      )}

      {error && <div className="alerta alerta--error">{error}</div>}

      <form className="panel" onSubmit={guardar}>
        <div className="panel__header">
          <h2>Datos del proyecto</h2>
        </div>
        <div className="panel__cuerpo">
          <div className="form-grid">
            <div className="campo ancho-completo">
              <label className="campo__label" htmlFor="n-nombre">Nombre del proyecto *</label>
              <input
                id="n-nombre"
                className="input"
                required
                value={form.nombre ?? ''}
                onChange={(e) => cambiar('nombre', e.target.value)}
              />
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="n-titular">Titular</label>
              <input
                id="n-titular"
                className="input"
                placeholder="Razón social del titular"
                value={form.titular ?? ''}
                onChange={(e) => cambiar('titular', e.target.value)}
              />
            </div>

            {!esEmpresa && (
              <div className="campo">
                <label className="campo__label" htmlFor="n-empresa">Empresa *</label>
                <select
                  id="n-empresa"
                  className="select"
                  required
                  value={form.empresa_id ?? ''}
                  onChange={(e) => cambiar('empresa_id', e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {catalogos?.empresas.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="campo">
              <label className="campo__label" htmlFor="n-sector">Sector</label>
              <select
                id="n-sector"
                className="select"
                value={form.sector_id ?? ''}
                onChange={(e) => cambiar('sector_id', e.target.value)}
              >
                <option value="">Sin definir</option>
                {catalogos?.sectores.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="n-region">Región</label>
              <select
                id="n-region"
                className="select"
                value={form.region_id ?? ''}
                onChange={(e) => cambiar('region_id', e.target.value)}
              >
                <option value="">Sin definir</option>
                {catalogos?.regiones.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="n-etapa">Etapa</label>
              <select
                id="n-etapa"
                className="select"
                value={form.etapa_id ?? ''}
                onChange={(e) => cambiar('etapa_id', e.target.value)}
              >
                <option value="">Sin definir</option>
                {catalogos?.etapas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="n-inversion">Inversión (MMUSD)</label>
              <input
                id="n-inversion"
                className="input"
                type="number"
                min="0"
                step="0.1"
                value={form.inversion_mmusd ?? ''}
                onChange={(e) => cambiar('inversion_mmusd', e.target.value)}
              />
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="n-empleo-c">Empleo en construcción</label>
              <input
                id="n-empleo-c"
                className="input"
                type="number"
                min="0"
                value={form.empleo_construccion ?? ''}
                onChange={(e) => cambiar('empleo_construccion', e.target.value)}
              />
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="n-empleo-o">Empleo en operación</label>
              <input
                id="n-empleo-o"
                className="input"
                type="number"
                min="0"
                value={form.empleo_operacion ?? ''}
                onChange={(e) => cambiar('empleo_operacion', e.target.value)}
              />
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="n-inicio-c">Inicio de construcción</label>
              <input
                id="n-inicio-c"
                className="input"
                type="date"
                value={form.fecha_inicio_construccion ?? ''}
                onChange={(e) => cambiar('fecha_inicio_construccion', e.target.value)}
              />
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="n-inicio-o">Inicio de operación</label>
              <input
                id="n-inicio-o"
                className="input"
                type="date"
                value={form.fecha_inicio_operacion ?? ''}
                onChange={(e) => cambiar('fecha_inicio_operacion', e.target.value)}
              />
            </div>
          </div>

          <div className="form-acciones">
            <Link to="/proyectos" className="btn btn--secundario">Cancelar</Link>
            <button type="submit" className="btn btn--primario" disabled={guardando}>
              <IconoGuardar /> {guardando ? 'Creando…' : 'Crear proyecto'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
