# proyectos-frontend

Frontend de OASI: seguimiento de permisos sectoriales de proyectos de inversión (Gobierno
de Chile). Reemplaza un Excel de 32 hojas. React + Vite + TypeScript, pensado para AWS
Amplify Hosting, consume la API de [`proyectos-backend`](https://github.com/OASI-CL/proyectos-backend).

El contexto completo del proyecto (reglas de negocio, roles, páginas, dashboard, etc.)
está en `claude_instructions.md`, en la raíz de `oasi/` (un nivel arriba de este repo).

---

## Estado actual

✅ Hecho:
- Estructura del proyecto (Vite + React + TypeScript)
- Dependencias instaladas: `react-router-dom`, `axios`, `aws-amplify`, `recharts`, `date-fns`
- `src/lib/api.ts` — cliente axios con inyección de JWT (placeholder, falta conectar a Cognito de verdad)
- Carpetas `pages/`, `components/`, `hooks/` creadas y listas

🚧 Pendiente — **todavía no hay ninguna página real construida.** Lo que se ve
hoy corriendo `npm run dev` es la pantalla default de Vite/React, no la app.
Falta construir (ver `claude_instructions.md`):
- `useAuth.ts` — login/sesión real contra Cognito (hoy `api.ts` lee un token
  de `localStorage` como placeholder)
- Las 10 páginas: Dashboard, Proyectos, ProyectoDetalle, ProyectoNuevo,
  Permisos, PermisoDetalle, PermisoNuevo, Comites, ComiteDetalle, Organismos,
  Admin/Usuarios
- Componentes: `TablaFiltrable`, `FiltrosPermisos`, `SemaforoBadge`,
  `HistorialLista`, `AdjuntosPanel`
- Hooks de datos: `usePermisos`, `useProyectos`

El backend (`proyectos-backend`) tampoco tiene rutas CRUD implementadas
todavía, así que por ahora este frontend no tiene una API real contra la cual
pegarle (solo existe `GET /health`).

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
    pages/                [pendiente] Dashboard.tsx, Proyectos.tsx, etc. (una por ruta)
    components/           [pendiente] TablaFiltrable, FiltrosPermisos, SemaforoBadge, etc.
    hooks/                [pendiente] usePermisos.ts, useProyectos.ts, useAuth.ts
    lib/
      api.ts              cliente axios, inyecta el JWT en cada request
    shared/
      types.ts            tipos compartidos con el backend (ver nota abajo)
    App.tsx                [placeholder de Vite, hay que reemplazarlo por el router real]
    main.tsx
  public/
  index.html
  vite.config.ts
```

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

## Páginas planeadas (rutas)

Ninguna está implementada todavía — esta es la lista objetivo de
`claude_instructions.md`:

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
