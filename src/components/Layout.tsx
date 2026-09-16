import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { ROLE_LABELS } from '../lib/formatters'
import type { RolUsuario } from '../shared/types'
import {
  IconoDashboard, IconoProyectos, IconoPermisos, IconoComites,
  IconoOrganismos, IconoUsuarios, IconoMenu, IconoAprobaciones,
} from './Iconos'

/**
 * Selector de rol. Es una herramienta de DESARROLLO: mientras el backend
 * corre con AUTH_MODE=dev, permite ver la app tal como la ve cada rol.
 * Cuando entre Cognito, este control se saca y el rol sale del JWT.
 */
function SelectorRolDev() {
  const { rolDev, cambiarRolDev } = useAuth()

  function alCambiar(rol: RolUsuario) {
    // Example scope so the filtering is visible while testing: company 1
    // (BHP), agency 5 (DGA), region Antofagasta. With Cognito this comes from
    // the usuarios table instead.
    cambiarRolDev({
      rol,
      empresaId: rol === 'empresa' ? 1 : null,
      organismoId: rol === 'organismo' ? 5 : null,
      region: rol === 'region' ? 'Antofagasta' : null,
    })
  }

  return (
    <div className="rol-dev" title="Simulación de rol (solo en desarrollo)">
      <span className="rol-dev__etiqueta">Rol · dev</span>
      <select
        value={rolDev.rol}
        onChange={(e) => alCambiar(e.target.value as RolUsuario)}
        aria-label="Simular rol de usuario"
      >
        <option value="admin">Administrador</option>
        <option value="oasi">Equipo OASI</option>
        <option value="organismo">Organismo (DGA)</option>
        <option value="empresa">Empresa titular (BHP)</option>
        <option value="region">Región (Antofagasta)</option>
      </select>
    </div>
  )
}

/** Pending-approvals count for the nav badge. */
function useContadorAprobaciones() {
  const [pendientes, setPendientes] = useState(0)

  useEffect(() => {
    let cancelado = false
    api
      .get<{ pendientes: number }>('/approvals/count')
      .then((r) => {
        if (!cancelado) setPendientes(r.data.pendientes)
      })
      .catch(() => {
        if (!cancelado) setPendientes(0)
      })
    return () => {
      cancelado = true
    }
  }, [])

  return pendientes
}

export function Layout() {
  const { usuario, veComites, esAdmin, esRegion } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)
  // 'region' is read-only, so it never has anything to approve or follow up on.
  const pendientes = useContadorAprobaciones()

  const cerrarMenu = () => setMenuAbierto(false)

  return (
    <div className="app">
      <header className="topbar">
        <button
          type="button"
          className="topbar__menu-btn"
          onClick={() => setMenuAbierto((v) => !v)}
          aria-label="Abrir menú"
        >
          <IconoMenu />
        </button>

        <img
          src="/logo-ministerio.png"
          alt=""
          className="topbar__logo-ministerio"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />

        <div className="topbar__marca">
          <Link to="/" className="topbar__logo">OASI</Link>
          <span className="topbar__sub">Catastro seguimiento permisos sectoriales</span>
        </div>

        <div className="topbar__spacer" />

        <span className="topbar__gob">Gobierno de Chile</span>
        <SelectorRolDev />
      </header>

      <div className="cuerpo">
        <nav className={`menu ${menuAbierto ? 'abierto' : ''}`} aria-label="Navegación principal">
          <div className="menu__grupo">
            <div className="menu__titulo">Seguimiento</div>
            <NavLink to="/" end className={({ isActive }) => `menu__item ${isActive ? 'activo' : ''}`} onClick={cerrarMenu}>
              <IconoDashboard /> Dashboard
            </NavLink>
            <NavLink to="/permisos" className={({ isActive }) => `menu__item ${isActive ? 'activo' : ''}`} onClick={cerrarMenu}>
              <IconoPermisos /> Permisos
            </NavLink>
            <NavLink to="/proyectos" className={({ isActive }) => `menu__item ${isActive ? 'activo' : ''}`} onClick={cerrarMenu}>
              <IconoProyectos /> Proyectos
            </NavLink>
          </div>

          <div className="menu__grupo">
            <div className="menu__titulo">Análisis</div>
            <NavLink to="/organismos" className={({ isActive }) => `menu__item ${isActive ? 'activo' : ''}`} onClick={cerrarMenu}>
              <IconoOrganismos /> Organismos
            </NavLink>
            {veComites && (
              <NavLink to="/comites" className={({ isActive }) => `menu__item ${isActive ? 'activo' : ''}`} onClick={cerrarMenu}>
                <IconoComites /> Comités
              </NavLink>
            )}
          </div>

          {!esRegion && (
            <div className="menu__grupo">
              <div className="menu__titulo">Revisión</div>
              <NavLink
                to="/aprobaciones"
                className={({ isActive }) => `menu__item ${isActive ? 'activo' : ''}`}
                onClick={cerrarMenu}
              >
                <IconoAprobaciones /> Aprobaciones
                {pendientes > 0 && <span className="menu__badge">{pendientes}</span>}
              </NavLink>
            </div>
          )}

          {esAdmin && (
            <div className="menu__grupo">
              <div className="menu__titulo">Administración</div>
              <NavLink to="/admin/usuarios" className={({ isActive }) => `menu__item ${isActive ? 'activo' : ''}`} onClick={cerrarMenu}>
                <IconoUsuarios /> Usuarios
              </NavLink>
            </div>
          )}

          {usuario && (
            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--borde)' }}>
              <div className="texto-sm" style={{ padding: '0 10px' }}>
                <div style={{ fontWeight: 600, color: 'var(--azul-oscuro)' }}>{usuario.nombre}</div>
                <div className="texto-tenue">{ROLE_LABELS[usuario.rol] ?? usuario.rol}</div>
              </div>
            </div>
          )}
        </nav>

        <main className="contenido">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
