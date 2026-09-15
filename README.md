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

## Dashboard: endpoints y supuestos por gráfico

El dashboard (`src/features/dashboard/`) hace solo dos llamadas a la API — no
hay un endpoint por gráfico, todos los datos vienen juntos:

- **`GET /catalog`** — una sola vez, al entrar a la página. Llena los 7
  dropdowns del filtro (ministerio, organismo, sector, estado de proyecto,
  estado de permiso, empresa, proyecto) y los hace dependientes entre sí
  (`useFilterOptions` en `useDashboardData.ts`, todo en el navegador).
- **`GET /dashboard?<filtros>`** — se repite cada vez que cambia un filtro
  (cualquiera: un dropdown, un clic en una barra, un clic en el donut). Los
  filtros van como query params: `ministryId`, `agencyId`, `sector`,
  `region`, `projectStatus`, `permitStatus`, `companyId`, `projectId`,
  `rcaStatus`. La lógica de qué filtro aplica a qué tabla está en
  `proyectos-backend/src/routes/dashboard.ts`, función `buildScope()`.

Cada gráfico lee una llave distinta de esa única respuesta:

| Gráfico | Llave de la respuesta | Supuesto que hace (y dónde cambiarlo) |
|---|---|---|
| KPIs (inversión, empleo, proyectos, permisos, atrasados) | `kpis` | Ver fila "Pendiente / Pendiente atrasado" abajo — los KPIs usan la misma clasificación. |
| Proyectos por región | `projectsByRegion` | Ninguno — cuenta directo `proyectos.region`. Los `NULL` se agrupan como "Sin región". |
| Proyectos por sector | `projectsBySector` | Ídem, agrupa `NULL` como "Sin sector". Con datos reales, ~1/3 de los proyectos no tiene sector (dato sucio del Excel, no del código). |
| Estado RCA | `rcaStatus` | **El más frágil.** `proyectos.estado_ambiental` es texto libre, casi siempre vacío (314/317 en los datos actuales). Se clasifica con `ILIKE` sobre ese texto en `src/db/sql.ts` → `rcaStatusSql()`: contiene "aprob" → aprobada, "suspend" → suspendida, "trámite"/"evalua" → en trámite, vacío → sin información. Si cargan datos más limpios (o una columna de estado real), este es el lugar para cambiarlo. |
| Línea de tiempo de inicio de construcción | `timeline` | Solo incluye proyectos con `fecha_inicio_construccion` no nula (139 de 317 hoy). El tamaño del punto es `inversion_mmusd`. El eje Y agrupa por sector, no por proyecto individual. |
| Monitorear proyectos — "Próximos a iniciar" | `monitor.upcoming` | `etapa = 'No se ha iniciado'` y `fecha_inicio_construccion` entre hoy y +90 días. |
| Monitorear proyectos — "Menos de 3 permisos" | `monitor.fewPermits` | `etapa = 'No se ha iniciado'` y entre 1 y 2 permisos pendientes (`pending_permit_count > 0 AND < 3`). **No depende de la fecha de inicio** — es una categoría aparte, un proyecto puede aparecer en las dos tarjetas a la vez. Si "menos de 3 permisos" debería contar permisos totales en vez de pendientes, o incluir los que ya no tienen ninguno pendiente, se ajusta en `proyectos-backend/src/routes/dashboard.ts`, sección "Monitor projects banner". |
| Permisos por región / por organismo | `permitsByRegion` / `permitsByAgency` | Mismo cálculo de estado que el donut (ver abajo). |
| Distribución por estado (donut) | `permitStatus` | Ver fila siguiente. |
| Permisos críticos | `criticalPermits` | Son los permisos en estado "atrasado" (ver abajo), ordenados primero por si bloquean el inicio de construcción de su proyecto (`construction_start_on` dentro de 90 días → prioridad "high"), y dentro de cada grupo, por más días de atraso. Muestra los primeros 25. |

### Pendiente / Pendiente atrasado / Resuelto

Esta clasificación (`src/db/sql.ts` → `PERMIT_TRACKING_STATUS_SQL`) la usan
**todos** los gráficos de permisos, el donut y los KPIs. Es el supuesto más
importante de todo el dashboard:

- **Resuelto**: `estado IN ('Resuelto', 'Descartado')`. Un permiso descartado
  cuenta como resuelto porque su trámite terminó, no porque se haya aprobado.
  Si eso no es lo que quieren, es una categoría aparte fácil de separar.
- **Pendiente atrasado**: si el permiso tiene `fecha_resolucion_estimada` y ya
  pasó, está atrasado. **Pero esa fecha solo existe en 27 de los 895 permisos
  pendientes** (dato del Excel origen). Para el resto (la inmensa mayoría) se
  usa un umbral fijo: más de **180 días** desde el ingreso sin resolución — el
  mismo criterio "Supera 6 Meses" que ya usaba el Excel. Ese número
  (`OVERDUE_THRESHOLD_DAYS`) está en `src/db/sql.ts` como constante, cambiarlo
  ahí lo cambia en todo el dashboard a la vez.
- **Pendiente**: todo lo que no cae en las dos anteriores.

### Dónde se aplican los filtros

`buildScope()` en `proyectos-backend/src/routes/dashboard.ts` arma dos
universos por separado en la misma consulta (dos CTEs, `permits` y
`projects`) y los mantiene sincronizados: un filtro de permiso (organismo,
ministerio, estado del permiso) también recorta qué proyectos se cuentan
—solo quedan los que todavía tienen al menos un permiso que matchea—, y un
filtro de proyecto (sector, región, empresa) recorta también los permisos.
Es el mecanismo que hace que todo el dashboard reaccione a un solo filtro
compartido (ver `README_dashboard.md`, sección 12).

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
