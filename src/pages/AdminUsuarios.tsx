import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useApi } from '../hooks/useApi'
import { useCatalogos } from '../hooks/useCatalogos'
import { Contenido } from '../components/Estados'
import { api, mensajeError } from '../lib/api'
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '../lib/formatters'
import type { RolUsuario } from '../shared/types'

interface FilaUsuario {
  id: number
  nombre: string
  email: string
  rol: RolUsuario
  empresaId: number | null
  empresaNombre: string | null
  organismoId: number | null
  organismoNombre: string | null
  region: string | null
}

const ROLES: RolUsuario[] = ['admin', 'oasi', 'organismo', 'empresa', 'region']

interface FormState {
  nombre: string
  email: string
  rol: RolUsuario
  empresaId: string
  organismoId: string
  region: string
}

const FORM_VACIO: FormState = {
  nombre: '', email: '', rol: 'oasi', empresaId: '', organismoId: '', region: '',
}

/**
 * User administration. Admin only.
 *
 * Creating a user here does both halves in one action: the Cognito account
 * (which emails the person an invite with a temporary password — the login
 * screen already handles the "set your new password" step that forces on
 * first sign-in) and the `usuarios` row with the role and its scope.
 *
 * The one account that still has to be created by hand with the AWS CLI is
 * the very first admin — there is no admin yet to click this button. See
 * proyectos-backend/infra/COGNITO_SETUP.md.
 */
export function AdminUsuarios() {
  const { esAdmin } = useAuth()
  const { datos: catalogo } = useCatalogos()
  const { datos: usuarios, cargando, error, recargar } = useApi<FilaUsuario[]>('/usuarios')

  const [formAbierto, setFormAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(FORM_VACIO)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  if (!esAdmin) {
    return <div className="alerta alerta--aviso">Esta sección es solo para administradores.</div>
  }

  function abrirAlta() {
    setForm(FORM_VACIO)
    setEditandoId(null)
    setMensaje(null)
    setFormAbierto(true)
  }

  function abrirEdicion(u: FilaUsuario) {
    setForm({
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      empresaId: u.empresaId ? String(u.empresaId) : '',
      organismoId: u.organismoId ? String(u.organismoId) : '',
      region: u.region ?? '',
    })
    setEditandoId(u.id)
    setMensaje(null)
    setFormAbierto(true)
  }

  function cambiarCampo<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setMensaje(null)

    const cuerpo = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      rol: form.rol,
      empresa_id: form.rol === 'empresa' ? Number(form.empresaId) : undefined,
      organismo_id: form.rol === 'organismo' ? Number(form.organismoId) : undefined,
      region: form.rol === 'region' ? form.region : undefined,
    }

    try {
      if (editandoId) {
        await api.patch(`/usuarios/${editandoId}`, cuerpo)
        setMensaje({ tipo: 'ok', texto: 'Usuario actualizado.' })
      } else {
        await api.post('/usuarios', cuerpo)
        setMensaje({
          tipo: 'ok',
          texto: `Cuenta creada. Le llegó un correo a ${cuerpo.email} con una contraseña temporal — se la va a pedir cambiar en su primer ingreso.`,
        })
      }
      setFormAbierto(false)
      recargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) })
    } finally {
      setEnviando(false)
    }
  }

  async function eliminar(u: FilaUsuario) {
    if (!window.confirm(`¿Eliminar a ${u.nombre}? Pierde el acceso al sistema de inmediato.`)) return
    setMensaje(null)
    try {
      await api.delete(`/usuarios/${u.id}`)
      setMensaje({ tipo: 'ok', texto: 'Usuario eliminado.' })
      recargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) })
    }
  }

  return (
    <>
      <div className="pagina-header">
        <div className="pagina-header__texto">
          <h1>Usuarios</h1>
          <p className="pagina-header__descripcion">
            Quién tiene acceso al sistema, con qué rol y qué alcance.
          </p>
        </div>
        <div className="pagina-header__acciones">
          <button type="button" className="btn btn--primario" onClick={abrirAlta}>
            Nuevo usuario
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`alerta alerta--${mensaje.tipo === 'ok' ? 'ok' : 'error'}`}>
          {mensaje.texto}
        </div>
      )}

      {formAbierto && (
        <div className="panel">
          <div className="panel__header">
            <h2>{editandoId ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          </div>
          <form className="panel__cuerpo" onSubmit={guardar}>
            <div className="form-grid">
              <div className="campo">
                <label className="campo__label" htmlFor="u-nombre">Nombre</label>
                <input
                  id="u-nombre"
                  className="input"
                  required
                  value={form.nombre}
                  onChange={(e) => cambiarCampo('nombre', e.target.value)}
                />
              </div>

              <div className="campo">
                <label className="campo__label" htmlFor="u-email">Correo</label>
                <input
                  id="u-email"
                  className="input"
                  type="email"
                  required
                  disabled={Boolean(editandoId)}
                  value={form.email}
                  onChange={(e) => cambiarCampo('email', e.target.value)}
                />
                {editandoId && (
                  <span className="campo__ayuda">El correo no se puede cambiar desde acá.</span>
                )}
              </div>

              <div className="campo">
                <label className="campo__label" htmlFor="u-rol">Rol</label>
                <select
                  id="u-rol"
                  className="select"
                  value={form.rol}
                  onChange={(e) => cambiarCampo('rol', e.target.value as RolUsuario)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                <span className="campo__ayuda">{ROLE_DESCRIPTIONS[form.rol]}</span>
              </div>

              {form.rol === 'empresa' && (
                <div className="campo">
                  <label className="campo__label" htmlFor="u-empresa">Empresa</label>
                  <select
                    id="u-empresa"
                    className="select"
                    required
                    value={form.empresaId}
                    onChange={(e) => cambiarCampo('empresaId', e.target.value)}
                  >
                    <option value="">Seleccionar…</option>
                    {catalogo?.empresas.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.rol === 'organismo' && (
                <div className="campo">
                  <label className="campo__label" htmlFor="u-organismo">Organismo</label>
                  <select
                    id="u-organismo"
                    className="select"
                    required
                    value={form.organismoId}
                    onChange={(e) => cambiarCampo('organismoId', e.target.value)}
                  >
                    <option value="">Seleccionar…</option>
                    {catalogo?.organismos.map((org) => (
                      <option key={org.id} value={org.id}>{org.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.rol === 'region' && (
                <div className="campo">
                  <label className="campo__label" htmlFor="u-region">Región</label>
                  <select
                    id="u-region"
                    className="select"
                    required
                    value={form.region}
                    onChange={(e) => cambiarCampo('region', e.target.value)}
                  >
                    <option value="">Seleccionar…</option>
                    {catalogo?.regiones.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-acciones">
              <button
                type="button"
                className="btn btn--secundario"
                onClick={() => setFormAbierto(false)}
                disabled={enviando}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn--primario" disabled={enviando}>
                {enviando
                  ? 'Guardando…'
                  : editandoId
                    ? 'Guardar cambios'
                    : 'Crear e invitar por correo'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="panel__header">
          <h2>Personas con acceso</h2>
        </div>
        <div className="panel__cuerpo panel__cuerpo--sin-padding">
          <Contenido cargando={cargando} error={error} datos={usuarios} recargar={recargar}>
            {(filas) =>
              filas.length === 0 ? (
                <div className="estado-caja">
                  <div className="estado-caja__titulo">Todavía no hay usuarios</div>
                </div>
              ) : (
                <div className="tabla-scroll">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Alcance</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((u) => (
                        <tr key={u.id}>
                          <td className="celda-principal">{u.nombre}</td>
                          <td className="texto-suave">{u.email}</td>
                          <td><span className="badge badge--info">{ROLE_LABELS[u.rol]}</span></td>
                          <td className="texto-suave">
                            {u.empresaNombre ?? u.organismoNombre ?? u.region ?? '—'}
                          </td>
                          <td className="der">
                            <div className="fila" style={{ justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn btn--sm btn--secundario"
                                onClick={() => abrirEdicion(u)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="btn btn--sm btn--peligro"
                                onClick={() => eliminar(u)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </Contenido>
        </div>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h2>Roles y permisos</h2>
        </div>
        <div className="panel__cuerpo panel__cuerpo--sin-padding">
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th style={{ width: 200 }}>Rol</th>
                  <th>Qué puede hacer</th>
                  <th style={{ width: 160 }}>Grupo en Cognito</th>
                </tr>
              </thead>
              <tbody>
                {ROLES.map((r) => (
                  <tr key={r}>
                    <td className="celda-principal">{ROLE_LABELS[r]}</td>
                    <td>{ROLE_DESCRIPTIONS[r]}</td>
                    <td><code className="badge-id">{r}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
