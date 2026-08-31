# SPEC 02 — Pantalla Home (landing)

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-08-30
> **Objective:** Portar la pantalla Home de `references/resources/home-about/home.jsx` a la ruta raíz `/`, mover la Biblioteca actual a `/biblioteca` y agregar el enlace "Inicio" al nav, sin implementar la pantalla "Acerca de".

---

## Scope

**In:**

- Nueva pantalla Home en la ruta `/`: hero con siluetas flotantes decorativas, sección "¿Por qué Arcade Vault?", riel de vista previa de 6 juegos, sección de estadísticas, "Actividad en vivo" (ticker de puntuaciones + top jugadores, con datos fijos igual que la plantilla), sección de precios con FAQ, y CTA final.
- Animación de aparición al hacer scroll (`useReveal`, `IntersectionObserver` sobre `.reveal`), portada tal cual de la plantilla.
- Mover la pantalla Biblioteca actual (contenido íntegro de `app/page.tsx`) a la nueva ruta `/biblioteca`, sin cambios de lógica.
- Nuevo enlace "Inicio" en el nav (escritorio + panel móvil), ubicado **antes** de "Biblioteca", apuntando a `/`.
- Actualizar el nav para que "Biblioteca" se marque activo en `/biblioteca` y `/juegos/*` (ya no en `/`), y que "Inicio" se marque activo solo en `/` exacto.
- Actualizar las 3 referencias existentes a `router.push("/")` / `href="/"` que asumían que la raíz era la Biblioteca, para que apunten a `/biblioteca`:
  - `app/auth/page.tsx` (redirect tras iniciar sesión y tras crear cuenta).
  - `app/juegos/[id]/page.tsx` (botón "VOLVER AL VAULT").
  - `components/game-player.tsx` (botón "VOLVER AL VAULT" del modal de fin de partida).
- Ampliación de `app/globals.css` con las clases nuevas que usa Home (`.home`, `.home-hero`, `.home-silos`/`.silo`, `.hero-eyebrow`, `.home-title`, `.home-sub`, `.home-ctas`, `.hero-scroll`, `.home-section`, `.section-head/.kicker/.section-title/.section-rule`, `.feature-grid/.feature-card/.ft-*`, `.mini-rail/.mini-card/.mini-*`, `.home-stats/.stats-inner/.stat-*`, `.activity-grid/.activity-card/.ac-*/.ticker/.tick-*/.top-*/.tp-*`, `.pricing-grid/.price-card/.pc-*/.pricing-faq/.faq-*`, `.home-final/.final-*`, `.reveal`/`.reveal.in`), portadas de `references/resources/home-about/styles.css`.

**Out of scope (for future specs):**

- Pantalla "Acerca de" (`about.jsx`) y su formulario de contacto — explícitamente excluida por el usuario.
- Enlace "Acerca de" en el nav.
- Datos reales o dinámicos para "Actividad en vivo" (se mantienen hardcodeados, igual que la plantilla).
- Sistema de créditos/monedas funcional (sigue igual que en SPEC 01).
- Cualquier lógica de juego real.

---

## Data model

Esta spec no introduce estructuras de datos nuevas. Reutiliza `GAMES` de `lib/data.ts` (para el riel de 6 juegos de vista previa) y las interfaces existentes de `lib/types.ts`. Los arreglos de "últimas puntuaciones" y "top jugadores · hoy" de la sección Actividad en Vivo se portan como constantes locales dentro del componente Home, igual que en `home.jsx` — no se derivan de `seededScores()` ni de `PLAYERS`.

---

## Implementation plan

1. Crear `app/biblioteca/page.tsx` con el contenido íntegro y sin cambios del actual `app/page.tsx` (mismo `"use client"`, mismos imports de `GameCard`, `CATS`, `GAMES`). Verificable: `npm run dev` en `/biblioteca` muestra exactamente la misma pantalla que hoy muestra `/`.
2. Reescribir `app/page.tsx` como la pantalla Home (`"use client"`), portando `home.jsx`: `FloatingSilhouettes`, `MiniCard` y `FeatureIcon` como funciones locales no exportadas dentro del mismo archivo (igual patrón que `nav.tsx`/`game-player.tsx`, componentes de un solo uso no se separan en archivos propios salvo que ya existiera esa convención, como `GameCard`). Los `navigate({name:...})` de la plantilla se traducen a `next/link`/`useRouter`: `biblioteca` → `/biblioteca`, `auth` → `/auth`, `detalle` → `/juegos/[id]`, `salon` → `/salon`. Verificable: `npm run dev` en `/` muestra hero, features, riel de juegos, stats, actividad, precios y CTA final.
3. Actualizar `components/nav.tsx`: agregar el enlace "Inicio" (href `/`) antes de "Biblioteca" en el bloque de escritorio y en el panel móvil; cambiar el `href` de "Biblioteca" a `/biblioteca`; actualizar `isActive` para que `"inicio"` sea `pathname === "/"` y `"biblioteca"` sea `pathname === "/biblioteca" || pathname.startsWith("/juegos")`. El logo sigue apuntando a `/`. Verificable: en `/`, "Inicio" aparece activo; en `/biblioteca` y en `/juegos/[id]`, "Biblioteca" aparece activo.
4. Actualizar los 3 puntos que navegaban a `/` asumiendo que era la Biblioteca (`app/auth/page.tsx` × 2, `app/juegos/[id]/page.tsx` × 1, `components/game-player.tsx` × 1) para que apunten a `/biblioteca`. Verificable: iniciar sesión, crear cuenta, "VOLVER AL VAULT" desde el detalle de un juego y desde el modal de fin de partida llevan todos a `/biblioteca`.
5. Portar a `app/globals.css` las clases de Home listadas en el Scope, tomadas de `references/resources/home-about/styles.css`, sin modificar las ya existentes. Verificable: comparación manual de `/` contra `references/resources/home-about/arcade-vault-standalone.html` (sección Home) abierto en el navegador.
6. Ejecutar `npm run lint` y `npm run build`, corrigiendo cualquier error antes de cerrar la implementación.
7. Probar con Playwright, contra el servidor de desarrollo ya activo (`http://localhost:3000`, sin volver a levantarlo), que nada quedó roto: navegar a `/`, `/biblioteca`, `/juegos/[id]` (con un id real del catálogo), `/juegos/[id]/jugar`, `/auth` y `/salon` y confirmar que cada una responde 200 y renderiza sin errores de consola; hacer clic en "Inicio" y "Biblioteca" desde el nav y confirmar que el estado activo cambia según lo descrito en el paso 3; y recorrer el flujo Home → "EXPLORAR JUEGOS" → detalle de un juego → "VOLVER AL VAULT" → confirmar que se cae en `/biblioteca`.

---

## Acceptance criteria

- [x] `npm run build` termina sin errores.
- [x] `npm run lint` no reporta errores.
- [x] `/` muestra la pantalla Home: hero con siluetas flotantes, sección de features, riel de 6 juegos, stats, actividad en vivo, precios/FAQ y CTA final.
- [x] Las secciones marcadas `reveal` aparecen con la animación de fade/slide al hacer scroll hasta ellas.
- [x] `/biblioteca` muestra la pantalla Biblioteca (buscador, chips de categoría, grilla de 8 juegos) — el mismo comportamiento que antes tenía `/`.
- [x] `/` ya no muestra la Biblioteca; la ruta `/biblioteca` es la única que la muestra.
- [x] El nav muestra "Inicio" antes de "Biblioteca", en ese orden, en escritorio y en el panel móvil.
- [x] "Inicio" está activo únicamente en `/`; "Biblioteca" está activo en `/biblioteca` y en `/juegos/[id]` y `/juegos/[id]/jugar`.
- [x] En Home, "EXPLORAR JUEGOS" y "VER TODOS LOS JUEGOS →" llevan a `/biblioteca`; "CREAR CUENTA", "EMPEZAR GRATIS →" e "INSERTAR MONEDA →" llevan a `/auth`; "VER SALÓN →" lleva a `/salon`; cada tarjeta del riel de juegos lleva a `/juegos/[id]` de ese juego.
- [x] Iniciar sesión o crear cuenta en `/auth` redirige a `/biblioteca`.
- [x] "VOLVER AL VAULT" en el detalle de un juego y en el modal de fin de partida del reproductor llevan a `/biblioteca`.
- [x] No existe ningún enlace "Acerca de" en el nav ni ninguna ruta `/acerca-de` o `/about`.
- [x] El menú móvil (hamburguesa) sigue abriendo y cerrando correctamente, ahora con 3 enlaces (Inicio, Biblioteca, Salón de la Fama) más la sesión.
- [x] Recorrido con Playwright sobre el servidor de desarrollo ya activo: `/`, `/biblioteca`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth` y `/salon` cargan sin errores de consola ni de red; la navegación por el nav y el flujo Home → detalle de juego → "VOLVER AL VAULT" → `/biblioteca` funcionan como se describe arriba.

---

## Decisions

- **Sí:** Home toma la ruta raíz `/` y la Biblioteca se mueve a `/biblioteca`. Es el comportamiento esperado de una landing y coincide con cómo `home.jsx` navega hacia "biblioteca" como una pantalla distinta de "home". Decisión confirmada explícitamente por el usuario.
- **No:** dejar Home en una ruta secundaria (p. ej. `/inicio`) y la Biblioteca en `/`. Descartado por el usuario a favor de que `/` sea la landing.
- **Sí:** "Inicio" se ubica antes de "Biblioteca" en el nav, igual que en el orden de la plantilla original (`Inicio, Biblioteca, Salón de la Fama`).
- **Sí:** los datos de "Actividad en Vivo" (últimas puntuaciones y top jugadores) se portan hardcodeados, igual que en `home.jsx`, en vez de generarse con `seededScores()`. Consistente con que el resto del MVP (SPEC 01) es 100% mock/decorativo.
- **No:** conectar "Actividad en Vivo" a `seededScores()`/`PLAYERS`. Se descarta por ser una decisión de diseño no solicitada que además rompería la fidelidad con la plantilla.
- **Sí:** los 3 lugares que hoy navegan a `/` asumiendo que ahí vive la Biblioteca (redirect de `/auth`, botón "volver" del detalle, botón "volver" del modal de fin de partida) se actualizan a `/biblioteca`, para preservar el comportamiento actual (tras loguearte o terminar una partida caes en la Biblioteca).
- **No:** dejar esos 3 lugares apuntando a `/` (ahora Home). Se descarta porque cambiaría el comportamiento existente sin que se haya pedido.
- **No:** implementar `about.jsx` (pantalla "Acerca de" + formulario de contacto). Excluido explícitamente por el usuario; queda para una spec futura si se decide implementarlo.
- **Sí:** `FloatingSilhouettes`, `MiniCard` y `FeatureIcon` se definen como funciones locales dentro de `app/page.tsx`, sin archivo propio en `components/`, ya que son específicas de esta pantalla y no se reutilizan en ninguna otra ruta.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Mover la Biblioteca de `/` a `/biblioteca` puede dejar enlaces rotos si algún archivo navega a `/` esperando ver la Biblioteca sin haber sido detectado en esta spec | El paso 4 del plan lista explícitamente los 3 puntos encontrados (`auth`, detalle de juego, modal de fin de partida); el paso 6 corre `npm run build`/`npm run lint`, y la verificación manual del paso 5 recorre las 6 pantallas para confirmar navegación. |
| La clase `.blink` en la plantilla original está delimitada a `.av-hero .sub .blink` y no aplica realmente dentro de `.hero-eyebrow` de Home (parece una inconsistencia ya presente en la plantilla) | Se porta el CSS tal cual, sin "arreglar" el alcance del selector, para mantener fidelidad exacta con la plantilla de referencia. El cursor `_` del eyebrow queda estático, igual que en la plantilla original. |

---

## What is **not** in this spec

- Pantalla "Acerca de" y su formulario de contacto.
- Enlace "Acerca de" en el nav.
- Datos dinámicos/reales para la sección de Actividad en Vivo.
- Sistema de créditos/monedas funcional.
- Cualquier lógica de juego real.

Cada uno de estos, si se implementa, va en su propia spec.
