import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
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

export default function App() {
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
