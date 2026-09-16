import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Login } from './features/auth/Login'
import { Cargando } from './components/Estados'
import { cognitoConfigurado, haySesion } from './lib/auth'
import { Dashboard } from './features/dashboard/Dashboard'
import { Proyectos } from './pages/Proyectos'
import { ProyectoDetalle } from './pages/ProyectoDetalle'
import { ProyectoNuevo } from './pages/ProyectoNuevo'
import { Permisos } from './pages/Permisos'
import { PermisoDetalle } from './pages/PermisoDetalle'
import { PermisoNuevo } from './pages/PermisoNuevo'
import { Comites } from './pages/Comites'
import { ComiteDetalle } from './pages/ComiteDetalle'
import { Organismos } from './pages/Organismos'
import { AdminUsuarios } from './pages/AdminUsuarios'
import { Approvals } from './features/approvals/Approvals'

/**
 * Auth gate.
 *
 * With Cognito configured, nothing renders until there is a session. Without
 * it (local development), it goes straight through — the backend is running
 * AUTH_MODE=dev anyway, so a login screen there would be theatre.
 */
export default function App() {
  const [autenticado, setAutenticado] = useState<boolean | null>(null)

  const revisarSesion = useCallback(() => {
    haySesion().then(setAutenticado)
  }, [])

  useEffect(() => {
    revisarSesion()
  }, [revisarSesion])

  if (autenticado === null) {
    return <Cargando texto="Verificando sesión…" />
  }

  if (cognitoConfigurado && !autenticado) {
    return <Login onLogin={() => setAutenticado(true)} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />

          <Route path="/proyectos" element={<Proyectos />} />
          <Route path="/proyectos/nuevo" element={<ProyectoNuevo />} />
          <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
          <Route path="/proyectos/:id/permisos/nuevo" element={<PermisoNuevo />} />

          <Route path="/permisos" element={<Permisos />} />
          <Route path="/permisos/:id" element={<PermisoDetalle />} />

          <Route path="/comites" element={<Comites />} />
          <Route path="/comites/:numero" element={<ComiteDetalle />} />

          <Route path="/organismos" element={<Organismos />} />
          <Route path="/aprobaciones" element={<Approvals />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
