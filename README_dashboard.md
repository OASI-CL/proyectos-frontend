Sí, ahora entendí mejor la lógica. El punto clave es que **Ministerio y Organismo son filtros independientes**, y que la sección de permisos debe tener prácticamente la misma lógica de filtrado que proyectos. Además, corrijo lo de RCA: **el estado es Estado RCA, no estado de la inversión**.

Te lo dejaría así para pegarlo directamente en una IA que vaya a desarrollar el dashboard:

---

## Prompt — Dashboard de monitoreo de proyectos y permisos

Quiero desarrollar un **dashboard interactivo para monitoreo de proyectos de inversión y sus permisos asociados**.

La plataforma ya cuenta con una identidad visual definida, por lo que **no es necesario definir colores ni crear una nueva paleta**. El foco debe estar en la estructura, funcionalidad, interacción entre filtros y visualizaciones.

### 1. Filtros globales

En la parte superior del dashboard debe existir una barra de filtros que afecte **todo el contenido de la plataforma**.

Los filtros deben ser:

* **Ministerio**
* **Organismo**
* **Sector**
* **Estado del proyecto**
* **Estado del permiso**
* **Empresa**
* **Proyecto**

Los filtros deben ser **dependientes entre sí**.

Por ejemplo:

* Si selecciono un **Sector**, el filtro de Proyecto debe mostrar únicamente los proyectos pertenecientes a ese sector.
* Si selecciono un **Ministerio**, el filtro de Organismo debe mostrar los organismos correspondientes.
* Si selecciono una **Empresa**, el filtro de Proyecto debe mostrar solamente los proyectos de esa empresa.
* Si selecciono un proyecto, todos los indicadores y gráficos deben actualizarse para ese proyecto.
* Los filtros deben poder combinarse.

Por ejemplo:

> Ministerio X + Organismo Y + Sector Energía + Empresa Z

debe mostrar únicamente la información que cumpla simultáneamente con esos criterios.

Debe existir una opción para **limpiar todos los filtros**.

---

# 2. Resumen superior

Debajo de los filtros debe existir una barra de indicadores generales que se actualice dinámicamente según los filtros seleccionados.

Mostrar:

* **Inversión total asociada**
* **Empleo asociado**
* **Número de proyectos**
* **Número de permisos**
* **Número de permisos atrasados**

Estos indicadores deben funcionar como un resumen ejecutivo del universo filtrado.

---

# 3. SECCIÓN PROYECTOS

Crear una sección claramente diferenciada denominada:

## PROYECTOS

Esta sección debe permitir analizar la distribución, estado y avance temporal de los proyectos.

### 3.1 Proyectos por región

Mostrar un **gráfico de barras** con la cantidad de proyectos por región.

Las barras deben actualizarse según los filtros seleccionados.

Al hacer hover sobre una barra debería poder visualizarse información adicional, como:

* Región
* Número de proyectos
* Inversión asociada
* Empleo asociado

---

### 3.2 Proyectos por sector

Mostrar un **gráfico de barras** con la cantidad de proyectos por sector.

Debe ser interactivo.

Al seleccionar un sector en el gráfico, debe funcionar como filtro y actualizar el resto del dashboard.

Además, los filtros deben funcionar de manera bidireccional:

Si el usuario selecciona primero un sector mediante el filtro superior, el gráfico debe mostrar solamente ese universo.

Si selecciona un sector desde el gráfico, debe filtrarse el resto del dashboard.

---

### 3.3 Estado RCA

Crear una visualización del **Estado RCA** de los proyectos.

Los estados deben permitir distinguir, al menos:

* En trámite
* Aprobada
* Suspendida

**Importante: esta visualización corresponde al Estado RCA del proyecto, no al estado de la inversión.**

La visualización debe ser interactiva y responder a los filtros globales.

---

# 4. Línea de tiempo de proyectos

Crear un panel de monitoreo temporal que permita visualizar los proyectos según su **fecha de inicio de construcción**.

La visualización debe ser una línea de tiempo.

Cada proyecto debe representarse mediante un **punto** ubicado según su fecha correspondiente.

Al hacer **hover sobre cada punto**, mostrar:

* Nombre del proyecto
* Empresa
* Sector
* Región
* Inversión
* Estado del proyecto
* Estado RCA
* Fecha estimada de inicio de construcción

El punto debe ser **clickeable**.

Al hacer clic sobre un proyecto, el usuario debe poder acceder directamente a la **ficha individual del proyecto**.

La ficha del proyecto será una vista independiente donde se podrá consultar el detalle completo del proyecto.

---

# 5. Banner "Monitorear proyectos"

Crear un banner o módulo destacado llamado:

## Monitorear proyectos

Este módulo debe identificar proyectos que requieren seguimiento.

Separar los proyectos en categorías según su fecha de inicio de construcción:

### Próximos a iniciar

Proyectos que:

* todavía no han iniciado construcción
* tienen fecha estimada de inicio dentro de los próximos **3 meses**

### Más de 3 meses

Proyectos que:

* todavía no han iniciado construcción
* tienen fecha estimada de inicio en más de **3 meses**

El banner debe mostrar al menos:

* Número de proyectos
* Inversión asociada
* Empleo asociado

Los proyectos mostrados deben ser clickeables y permitir acceder a su ficha.

---

# 6. SECCIÓN PERMISOS

Crear una segunda sección claramente diferenciada:

# PERMISOS

La sección de permisos debe tener **los mismos filtros globales que la sección de proyectos**.

Es decir, los permisos deben poder filtrarse por:

* Ministerio
* Organismo
* Sector
* Estado del proyecto
* Estado del permiso
* Empresa
* Proyecto

Los filtros deben estar relacionados con los proyectos.

Por ejemplo:

Si se selecciona:

> Sector: Energía

la sección de permisos debe mostrar únicamente los permisos asociados a proyectos del sector Energía.

Si se selecciona:

> Proyecto: Proyecto A

deben mostrarse solamente los permisos asociados a ese proyecto.

---

# 7. Estados de los permisos

Todos los gráficos y visualizaciones de permisos deben utilizar **tres estados estándar**:

### Pendiente

Permiso que se encuentra en tramitación y cuyo plazo todavía no se encuentra vencido.

### Pendiente atrasado

Permiso que continúa pendiente, pero cuyo plazo esperado de resolución ya fue superado.

### Resuelto

Permiso cuya tramitación ya terminó.

Estos tres estados deben mantenerse consistentes en **todas las visualizaciones de permisos**.

Usar una lógica visual consistente:

* **Pendiente → amarillo pastel**
* **Pendiente atrasado → rojo pastel**
* **Resuelto → verde pastel**

Los colores deben ser suaves/pastel y no saturados.

---

# 8. Permisos por organismo

Crear un **gráfico de barras** que muestre la cantidad de permisos por organismo.

Debe permitir comparar:

* Total de permisos
* Permisos pendientes
* Permisos pendientes atrasados
* Permisos resueltos

El gráfico debe responder a todos los filtros.

Al hacer hover sobre cada organismo, mostrar el desglose de los tres estados.

---

# 9. Permisos por región

Crear un segundo **gráfico de barras** que muestre los permisos por región.

También debe permitir identificar el estado de esos permisos:

* Pendiente
* Pendiente atrasado
* Resuelto

Debe responder a los filtros globales.

---

# 10. Donut de estado de permisos

Crear un **gráfico donut** que muestre la distribución porcentual de los permisos según:

* Pendiente
* Pendiente atrasado
* Resuelto

El donut debe actualizarse dinámicamente según los filtros seleccionados.

Al hacer hover sobre cada segmento mostrar:

* Estado
* Número de permisos
* Porcentaje del total

---

# 11. Banner de permisos críticos

Crear un banner destacado denominado:

## Permisos críticos

El objetivo es identificar rápidamente aquellos permisos que requieren atención prioritaria.

El banner debe destacar principalmente los **permisos pendientes atrasados**, pero la criticidad debe considerar también el contexto del proyecto.

Por ejemplo, un permiso pendiente atrasado asociado a un proyecto cuya construcción está próxima a comenzar debería tener una prioridad mayor.

El banner debería permitir identificar:

* Proyecto
* Permiso
* Organismo responsable
* Estado del permiso
* Días de atraso
* Fecha esperada de resolución
* Fecha estimada de inicio de construcción del proyecto
* Inversión asociada

Los registros deben ser clickeables para acceder al detalle correspondiente.

---

# 12. Regla fundamental de interacción

Todo el dashboard debe funcionar como **un único sistema de filtros interconectado**.

No quiero que cada gráfico funcione como una visualización aislada.

Los filtros y selecciones deben afectar:

**Resumen → Proyectos → Línea de tiempo → Monitoreo → Permisos → Organismos → Regiones → Donut → Permisos críticos.**

Por ejemplo:

Si selecciono:

> Ministerio: X
> Sector: Energía
> Empresa: Y

todo el dashboard debe recalcularse utilizando únicamente ese universo.

Asimismo, si el usuario hace clic sobre una barra, segmento del donut, proyecto o elemento de una visualización, esa selección debería poder utilizarse como filtro para el resto del dashboard.

---

## 13. Experiencia de usuario

La navegación debe ser intuitiva y permitir pasar de una visión general a una visión específica:

**Dashboard general → filtros → indicadores → proyectos/permisos → elemento específico → ficha del proyecto o permiso.**

Los elementos interactivos deben tener estados de hover claros y mostrar tooltips con información relevante.

No saturar las visualizaciones con etiquetas innecesarias. Priorizar la interacción mediante **hover, click y filtros**.

La información más crítica debe poder identificarse rápidamente, especialmente:

* Proyectos próximos a comenzar
* Permisos pendientes atrasados
* Permisos críticos
* Organismos con mayor concentración de atrasos

---

### Estructura visual resumida

**FILTROS GLOBALES**

↓

**KPIs**

> Inversión | Empleo | Proyectos | Permisos | Permisos atrasados

↓

### PROYECTOS

> Proyectos por región | Proyectos por sector | Estado RCA
>
> Línea de tiempo de inicio de construcción
>
> **Monitorear proyectos**

↓

### PERMISOS

> Permisos por organismo | Permisos por región
>
> Donut: Pendiente / Pendiente atrasado / Resuelto
>
> **Permisos críticos**

---

**Y una precisión importante para la IA que lo codee:** la lógica de filtros debe construirse como una **fuente de estado global/centralizada**, no como filtros independientes dentro de cada gráfico. Así, cuando cambie un filtro, todos los componentes reciben el mismo universo filtrado y se actualizan simultáneamente.
