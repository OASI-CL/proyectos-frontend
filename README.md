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

- Login real con Cognito y gestión de usuarios desde Administración → Usuarios
- **Desplegado en AWS** con dos ambientes: `develop` → dev, `main` → prod
  (ver "Deploy" abajo)

### Selector de rol (modo desarrollo)

Cuando las variables `VITE_COGNITO_*` están vacías, la barra superior muestra
un selector para ver la app como cada rol (`admin`, `oasi`, `organismo`,
`empresa`, `region`). Manda headers `x-dev-*` que el backend solo interpreta
en `AUTH_MODE=dev`. Con Cognito configurado (siempre en AWS) el selector no
aparece y los headers se ignoran.

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

Con `VITE_COGNITO_*` vacías no hay login: se usa el selector de rol contra un
backend local en `AUTH_MODE=dev`.

### 4. Levantar el server de desarrollo

Hay dos formas, según contra qué API querés probar:

```bash
npm run dev       # contra tu backend local (lee .env)
npm run dev:aws   # contra la API y el Cognito de DEV ya desplegados (lee .env.aws)
```

Las dos sirven en `http://localhost:5173`.

`npm run dev:aws` sirve para probar un cambio de frontend con los datos y el
login reales de dev **antes** de subirlo. `.env.aws` no se versiona; lleva:

```
VITE_API_URL=https://28kggtg009.execute-api.us-east-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=us-east-1_WDLIW3Jby
VITE_COGNITO_CLIENT_ID=46cb3he4cbplji8chmj066vud6
VITE_COGNITO_REGION=us-east-1
```

(Funciona porque la API de dev acepta `http://localhost:5173`; la de prod no.)

### 5. Antes de subir

```bash
npm run lint && npm run build
```

Es lo mismo que corre el CI en cada pull request.

---

## Scripts de npm

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor de desarrollo de Vite con hot reload, contra la API local |
| `npm run dev:aws` | Lo mismo, pero contra la API y el login de dev en AWS (`.env.aws`) |
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

AWS Amplify Hosting construye y publica directo desde GitHub. No hay que
correr nada a mano:

| Rama | Sitio | API y login |
|---|---|---|
| `develop` | `https://develop.<app-id>.amplifyapp.com` | dev |
| `main` | `https://main.<app-id>.amplifyapp.com` | prod |

**Flujo:** trabajás en `develop` → push → Amplify publica dev → probás ahí →
pull request `develop → main` → merge → Amplify publica prod.

- La configuración del build está en `amplify.yml`: usa la versión de Node de
  `.nvmrc` y **falla a propósito** si la rama no tiene `VITE_API_URL`, para
  no publicar nunca un sitio que llame a localhost.
- Las variables `VITE_*` son **por rama** en Amplify (cada rama apunta a su
  propia API y su propio Cognito). No se cargan a mano: las pone
  `proyectos-backend/scripts/amplify-env.sh` leyendo lo que ya está desplegado.
- Como Vite las incrusta al compilar, cambiar una variable requiere un nuevo
  build.
- `.github/workflows/ci.yml` corre lint + typecheck + build en cada pull
  request, cosa que Amplify no hace.
- La URL de cada rama tiene que estar en `frontendOrigins` del ambiente en
  `proyectos-backend/infra/lib/config.ts`, o la API la rechaza (CORS).

Instrucciones completas (primera configuración, GitHub, costos, operación):
`proyectos-backend/DEPLOYMENT.md`.

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
