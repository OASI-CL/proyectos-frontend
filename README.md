# proyectos-frontend

Frontend de OASI: seguimiento de permisos sectoriales de proyectos de inversión (Gobierno
de Chile). Reemplaza un Excel de 32 hojas. React + Vite + TypeScript, pensado para AWS
Amplify Hosting, consume la API de [`proyectos-backend`](https://github.com/OASI-CL/proyectos-backend).

El contexto completo del proyecto (reglas de negocio, roles, páginas, dashboard, etc.)
está en `claude_instructions.md`, en la raíz de `oasi/` (un nivel arriba de este repo).

---

## Estado actual

✅ Hecho — **la app está funcionando de punta a punta** contra la API y los
datos reales (317 proyectos, 1.552 permisos):
- Sistema de diseño completo con la paleta institucional (`src/index.css`)
- Las 11 páginas: Dashboard, Permisos (lista + detalle + alta), Proyectos
  (lista + detalle + alta), Comités (lista + tabla por sesión), Organismos,
  Admin/Usuarios
- Componentes: `TablaFiltrable`, `FiltrosPermisos`, `SemaforoBadge`,
  `HistorialLista`, `AdjuntosPanel`, `Layout`, `Estados`
- Filtros sincronizados con la URL (la vista filtrada se comparte por link)
- Exportación a Excel (CSV) con los filtros aplicados
- Gráficos del dashboard con Recharts
- Responsive hasta 400px de ancho

🚧 Pendiente:
- **Login real con Cognito.** Hoy el backend corre con `AUTH_MODE=dev` y el
  rol se simula con el selector de la barra superior (ver abajo). Cuando el
  User Pool exista, hay que implementar el login en `src/hooks/useAuth.ts`
  (la interfaz que consumen las páginas no cambia) y sacar ese selector.
- **Adjuntos**: la UI está lista, pero necesita que el backend tenga un bucket
  S3 configurado (`S3_BUCKET_ADJUNTOS`) para funcionar.

### Selector de rol (modo desarrollo)

Mientras no haya Cognito, la barra superior tiene un selector para ver la app
como cada rol (`admin`, `oasi`, `organismo_lector`, `empresa`). Manda headers
`x-dev-*` que el backend interpreta solo en `AUTH_MODE=dev`. **Hay que sacarlo
antes de producción** — está en `src/components/Layout.tsx`.

---

## Stack

| Parte | Tecnología |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Deploy | AWS Amplify Hosting |
| Routing | `react-router-dom` |
| HTTP client | `axios` |
| Auth | AWS Cognito, vía `aws-amplify` |
| Gráficos (dashboard) | `recharts` |
| Fechas | `date-fns` |

---

## Estructura de carpetas

```
proyectos-frontend/
  src/
    pages/
      Dashboard.tsx          KPIs + gráficos + permisos más antiguos
      Permisos.tsx            lista principal, filtros y exportación
      PermisoDetalle.tsx      datos / historial / adjuntos, con edición
      PermisoNuevo.tsx        alta de permiso dentro de un proyecto
      Proyectos.tsx           lista con filtros
      ProyectoDetalle.tsx     datos del proyecto + sus permisos
      ProyectoNuevo.tsx       alta de proyecto
      Comites.tsx             lista de sesiones
      ComiteDetalle.tsx       tabla reconstruida a la fecha de la sesión
      Organismos.tsx          resumen por organismo
      AdminUsuarios.tsx       roles del sistema (solo admin)
    components/
      Layout.tsx              barra superior + menú lateral
      TablaFiltrable.tsx      tabla con orden por columna + paginación
      FiltrosPermisos.tsx     filtros de la página de Permisos
      SemaforoBadge.tsx       insignias de semáforo, estado e ID Excel
      HistorialLista.tsx      línea de tiempo de cambios
      AdjuntosPanel.tsx       subida/descarga a S3 con URL prefirmada
      Estados.tsx             cargando / error / vacío
      Iconos.tsx              iconos SVG inline
    hooks/
      useApi.ts               fetch genérico con loading/error
      useAuth.ts              sesión y permisos por rol
      useCatalogos.ts         listas para los dropdowns
      useFiltrosUrl.ts        filtros sincronizados con la URL
    lib/
      api.ts                  cliente axios, inyecta el JWT
      format.ts               fechas DD-MM-YYYY, números, montos
    shared/
      types.ts                tipos compartidos con el backend (ver nota abajo)
    index.css                 sistema de diseño completo (paleta, componentes)
    App.tsx                    router
    main.tsx
  index.html
  vite.config.ts
```

## Paleta institucional

Todos los colores salen de variables CSS definidas en `:root`
(`src/index.css`). Para cambiar un tono se edita ahí y se propaga a toda la
app.

| Uso | Color |
|---|---|
| Azul oscuro (barra superior, títulos) | `#25306B` |
| Azul (acciones, links) | `#006BB9` |
| Azul pálido (fondos suaves, encabezados de tabla) | `#D3DEF2` |
| Celeste (acento) | `#6BCCD6` |
| Verde / verde pálido (en plazo) | `#009933` / `#CCEBD6` |
| Amarillo / amarillo pálido (en alerta) | `#FFCC00` / `#FFF5CC` |
| Rojo / rojo pálido (crítico) | `#CC0000` / `#F5CCCC` |
| Grises (finalizado, texto suave) | `#646464`, `#7F7F7F`, `#D9D9D9` |

**Sobre `src/shared/types.ts`:** el frontend y el backend son dos repos
separados, así que no hay una carpeta compartida real entre ambos. Este
archivo es una copia manual de los tipos TypeScript del dominio (`Proyecto`,
`Permiso`, etc., y también los DTOs de las vistas como `VPermiso`,
`VProyecto`). Si cambian los tipos, hay que actualizar la copia en los dos
repos a mano.

---

## Cómo correr en local

### 1. Requisitos

- Node.js 24+ y npm
- El backend corriendo en paralelo (ver README de `proyectos-backend`) si
  querés probar contra datos reales — aunque hoy no hay páginas que lo
  consuman todavía.

### 2. Instalar dependencias

```bash
npm install
```

### 3. Variables de entorno

```bash
cp .env.example .env
```

```
VITE_API_URL=http://localhost:3001

VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_COGNITO_REGION=
```

Los valores de `VITE_COGNITO_*` no hacen falta todavía (no hay integración
real de Cognito armada aún).

### 4. Levantar el server de desarrollo

```bash
npm run dev
```

Por defecto Vite sirve en `http://localhost:5173`.

---

## Scripts de npm

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor de desarrollo de Vite con hot reload |
| `npm run build` | Type-checks (`tsc -b`) y genera el build de producción en `dist/` |
| `npm run preview` | Sirve el build de `dist/` localmente, para probar antes de deployar |
| `npm run lint` | Corre `oxlint` |

---

## Rutas

Todas implementadas:

| Ruta | Página | Rol mínimo |
|---|---|---|
| `/` | Dashboard (KPIs + gráficos, respeta el scope del rol) | todos |
| `/proyectos` | Lista de proyectos con filtros (empresa, sector, región, etapa...) | todos |
| `/proyectos/:id` | Detalle de proyecto + sus permisos | todos |
| `/proyectos/nuevo` | Formulario de creación | `empresa`, `oasi`, `admin` |
| `/permisos` | Lista de permisos con filtros (organismo, ministerio, estado, tramo...) | todos |
| `/permisos/:id` | Detalle de permiso + historial + adjuntos | todos |
| `/proyectos/:id/permisos/nuevo` | Agregar permiso a un proyecto | `empresa`, `oasi`, `admin` |
| `/comites` | Lista de sesiones | `oasi`, `admin` |
| `/comites/:numero` | Tabla del comité (usa `v_permisos_comite`, reconstruye esa fecha) | `oasi`, `admin` |
| `/organismos` | Resumen por organismo | `oasi`, `admin`, `organismo_lector` (solo el suyo) |
| `/admin/usuarios` | Gestión de usuarios | `admin` |

Cada rol ve un subconjunto distinto de datos (el filtro real lo aplica el
backend en `scope.ts`, el frontend solo debe ocultar UI que no corresponde,
nunca confiar en eso como control de acceso).

---

## Deploy

Pensado para AWS Amplify Hosting:

- `npm run build` genera `dist/`, que es lo que Amplify sirve
- Las variables `VITE_*` se configuran en la consola de Amplify (Environment
  variables), no en un `.env` commiteado
- El dominio final de Amplify es el que hay que whitelistear en el CORS del
  backend (ver README de `proyectos-backend`)

---

## Convenciones de código

- TypeScript estricto
- JWT en header `Authorization: Bearer <token>` en cada request a la API
  (lo inyecta `src/lib/api.ts`)
- Fechas: se reciben en ISO `YYYY-MM-DD` desde la API, se formatean a
  `DD-MM-YYYY` solo en el render, nunca antes
- Los filtros de las tablas (Proyectos, Permisos) van en query params y se
  sincronizan con la URL, para que la vista filtrada se pueda compartir por
  link
