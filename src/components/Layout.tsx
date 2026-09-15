import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ETIQUETAS_ROL } from '../lib/format'
import type { RolUsuario } from '../shared/types'
import {
  IconoDashboard, IconoProyectos, IconoPermisos, IconoComites,
  IconoOrganismos, IconoUsuarios, IconoMenu,
} from './Iconos'

/**
 * Selector de rol. Es una herramienta de DESARROLLO: mientras el backend
 * corre con AUTH_MODE=dev, permite ver la app tal como la ve cada rol.
 * Cuando entre Cognito, este control se saca y el rol sale del JWT.
 */
function SelectorRolDev() {
  const { rolDev, cambiarRolDev } = useAuth()

  function alCambiar(rol: RolUsuario) {
    // Scope de ejemplo para poder ver el filtrado funcionando: empresa 1 (BHP)
    // y organismo 1. Con Cognito esto sale de la tabla usuarios.
    cambiarRolDev({
      rol,
      empresaId: rol === 'empresa' ? 1 : null,
      organismoId: rol === 'organismo_lector' ? 1 : null,
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
        <option value="organismo_lector">Organismo (lectura)</option>
        <option value="empresa">Empresa titular</option>
      </select>
    </div>
  )
}

export function Layout() {
  const { usuario, veComites, esAdmin } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)

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
          src="/logo-ministerio.svg"
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
                <div className="texto-tenue">{ETIQUETAS_ROL[usuario.rol] ?? usuario.rol}</div>
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
