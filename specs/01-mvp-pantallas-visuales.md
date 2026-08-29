# SPEC 01 — MVP de pantallas visuales de Arcade Vault

> **Status:** Implementado
> **Depends on:** Ninguno
> **Date:** 2026-08-29
> **Objective:** Portar las 5 pantallas de `references/resources/templates/` (biblioteca, detalle, reproductor mock, autenticación falsa y salón de la fama) a rutas reales de Next.js App Router con datos mock tipados, sin implementar ningún juego jugable real.

---

## Scope

**In:**

- 5 rutas reales de App Router: `/` (Biblioteca), `/juegos/[id]` (Detalle), `/juegos/[id]/jugar` (Reproductor mock), `/auth` (Autenticación), `/salon` (Salón de la Fama).
- `Nav` (enlaces de escritorio + panel móvil deslizante con hamburguesa) y el `footer`, ambos en `app/layout.tsx`, presentes en las 5 rutas.
- Módulo de datos mock tipado, portado de `data.jsx`: los 8 juegos, las categorías, la lista de jugadores falsos y el generador de tablas `seededScores`.
- Sesión falsa: iniciar sesión, crear cuenta y modo invitado, sin ninguna validación real, persistida en `localStorage` bajo la clave `av_user`.
- Guardado falso de puntuaciones en `localStorage` bajo la clave `av_scores`, disparado desde el modal de fin de partida del reproductor mock.
- Pantalla de reproductor con mock visual completo: CRT decorativo, nave/enemigos animados con CSS puro, puntuación que sube sola mediante un temporizador falso, pausa/reanudar, y modal de fin de partida — todo decorativo, sin lógica de juego real.
- Comportamiento responsive equivalente al de la plantilla (menú móvil, reflow de la grilla, tablas, etc.).
- Verificación y, si hace falta, ampliación de `app/globals.css` para que coincida con `references/resources/templates/styles.css`.

**Out of scope (for future specs):**

- Lógica de juego real para cualquiera de los 8 juegos del catálogo.
- Backend, base de datos o autenticación real (OAuth, verificación de contraseña, etc.).
- Sistema de multijugador o competencia de puntos en tiempo real descrito en el README.
- Créditos/monedas funcionales (el contador "CRÉDITOS · 03" del nav queda como texto estático).
- Pruebas automatizadas (no hay test runner configurado en el proyecto).
- Internacionalización (la app queda solo en español, igual que la plantilla).

---

## Data model

```ts
// lib/types.ts
export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string; // clase CSS del fondo, ej. "cover-bricks"
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // "DD/MM/YYYY"
}

export interface User {
  name: string;
}
```

`lib/data.ts` porta tal cual, tipado, el contenido de `data.jsx`: `GAMES: Game[]` (8 juegos), `CATS: string[]` (`["TODOS","ARCADE","PUZZLE","SHOOTER","VERSUS"]`), `PLAYERS: string[]` y `seededScores(seed: number, count?: number): ScoreRow[]`.

`lib/storage.ts` encapsula el acceso a `localStorage`:

```ts
const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

export function getStoredUser(): User | null { /* try/catch, igual que la plantilla */ }
export function setStoredUser(user: User | null): void { /* ... */ }
export function saveScore(entry: { game: string; score: number; name: string }): void { /* ... */ }
```

`components/auth-provider.tsx` expone un contexto `AuthContext` y un hook `useAuth()` con `{ user: User | null, login(user: User | null): void, logout(): void }`, respaldado por `lib/storage.ts`. Es necesario porque, al pasar a rutas reales de archivo, ya no existe un único componente `App` que reparta `user` por props como en la plantilla original.

---

## Implementation plan

1. Crear `lib/types.ts` con las interfaces `Game`, `ScoreRow` y `User`.
2. Crear `lib/data.ts` portando `GAMES`, `CATS`, `PLAYERS` y `seededScores()` de `references/resources/templates/data.jsx`, tipados, sin cambiar contenido. Verificable: `npx tsc --noEmit` sin errores.
3. Crear `lib/storage.ts` con `getStoredUser`, `setStoredUser` y `saveScore`, con manejo de errores `try/catch` como en la plantilla.
4. Crear `components/auth-provider.tsx` (`"use client"`) con `AuthContext` y el hook `useAuth()`, inicializado de forma perezosa desde `getStoredUser()`.
5. Crear `components/nav.tsx` (`"use client"`) portando `nav.jsx`: usa `usePathname()` para el estado activo, `next/link` para navegar y `useAuth()` para mostrar sesión/logout, incluyendo el panel móvil deslizante.
6. Actualizar `app/layout.tsx` para envolver `children` con `<AuthProvider>`, renderizar `<Nav />` antes de `<main>` y el `<footer>` de la plantilla después. Verificable: `npm run dev` muestra nav y footer en cualquier ruta.
7. Crear `components/game-card.tsx` portando la tarjeta con efecto tilt 3D de `biblioteca.jsx`.
8. Reemplazar `app/page.tsx` con la pantalla Biblioteca (`"use client"`): hero, buscador, chips de categoría y grilla de `GameCard`, usando `useRouter().push("/juegos/" + id)`. Verificable: `npm run dev` en `/` filtra por texto y categoría correctamente.
9. Crear `app/juegos/[id]/page.tsx` portando `detalle.jsx` (Server Component): `GAMES.find`, `notFound()` si el id no existe, `generateStaticParams` con los 8 ids, y tabla de mejores puntuaciones vía `seededScores`. Verificable: `/juegos/bloque-buster` muestra el detalle; `/juegos/no-existe` da 404.
10. Crear `app/juegos/[id]/jugar/page.tsx` portando `reproductor.jsx` (`"use client"`): HUD, CRT animado, temporizador de puntaje falso, pausa, y modal de fin de partida que llama a `saveScore()` usando `useAuth()` para el nombre por defecto. Verificable: el puntaje sube solo, pausa/reanuda, y al guardar aparece la entrada en `localStorage.av_scores`.
11. Crear `app/auth/page.tsx` portando `auth.jsx` (`"use client"`): tabs de iniciar sesión/crear cuenta, botón de invitado, sin validación, llamando a `login()` de `useAuth()` y navegando a `/`. Verificable: iniciar sesión con cualquier dato regresa a la biblioteca con el nombre visible en el nav; recargar conserva la sesión.
12. Crear `app/salon/page.tsx` portando `salon.jsx` (`"use client"`): tabs por juego, podio top 3, tabla completa vía `seededScores`, y fila "tu mejor marca" cuando hay sesión. Verificable: cambiar de juego actualiza podio y tabla; con sesión iniciada aparece la fila resaltada.
13. Comparar `app/globals.css` contra `references/resources/templates/styles.css` y portar cualquier clase o animación faltante. Verificable: comparación manual de las 5 pantallas contra `references/resources/templates/Arcade Vault.html` abierto en el navegador.
14. Ejecutar `npm run lint` y `npm run build`, corrigiendo cualquier error antes de cerrar la implementación.

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores.
- [ ] `npm run lint` no reporta errores.
- [ ] `/` muestra las 8 tarjetas de juego, y el buscador y los chips de categoría filtran la grilla.
- [ ] `/juegos/[id]` muestra portada, descripción, estadísticas y tabla de mejores puntuaciones para cada uno de los 8 juegos.
- [ ] `/juegos/id-invalido` devuelve la página 404 de Next.js.
- [ ] `/juegos/[id]/jugar` muestra el HUD y la pantalla CRT animada, y el puntaje sube solo mientras no está en pausa.
- [ ] Pulsar "PAUSA" detiene el incremento del puntaje; "REANUDAR" lo reactiva.
- [ ] Pulsar "FIN" abre el modal de fin de partida con el puntaje final.
- [ ] Guardar la puntuación en el modal la persiste en `localStorage` bajo la clave `av_scores`.
- [ ] `/auth` permite iniciar sesión con cualquier usuario/contraseña y redirige a `/`.
- [ ] Tras iniciar sesión, el nav muestra el nombre del usuario y un botón para cerrar sesión.
- [ ] Recargar cualquier página conserva la sesión (persistida en `localStorage` bajo `av_user`).
- [ ] "JUGAR COMO INVITADO" entra sin sesión y el nav muestra "Iniciar Sesión".
- [ ] `/salon` muestra podio (top 3) y tabla completa, y cambia al seleccionar otro juego en las pestañas.
- [ ] Con sesión iniciada, `/salon` muestra la fila "tu mejor marca" resaltada.
- [ ] El menú móvil (hamburguesa) se abre y cierra correctamente en ancho de pantalla angosto (<840px).
- [ ] El enlace "Biblioteca" del nav está activo en `/`, `/juegos/[id]` y `/juegos/[id]/jugar`.
- [ ] El enlace "Salón de la Fama" del nav está activo en `/salon`.
- [ ] Ninguna de las 8 pantallas de juego tiene lógica de juego real jugable; todo el "gameplay" del reproductor es decorativo/simulado.

---

## Decisions

- **Sí:** rutas reales de Next.js App Router en vez de router por hash. Es lo idiomático para este proyecto y encaja con las convenciones de `CLAUDE.md` (`PageProps<"...">`, `LayoutProps<"...">`).
- **No:** mantener el enrutador por hash de la plantilla. Se descarta por no encajar con App Router.
- **Sí:** pantalla de reproductor con mock visual completo (animación CSS, puntaje falso con temporizador). Es decorado, no un juego jugable real.
- **No:** placeholder estático sin animación para el reproductor. Descartado por el usuario.
- **Sí:** autenticación completamente falsa, sin validación de formulario, igual que la plantilla.
- **No:** validación de formulario en el login. No aporta valor sin backend real.
- **Sí:** portar el catálogo de 8 juegos, categorías y generador de puntuaciones tal cual, tipados en `lib/data.ts`.
- **No:** cambiar el catálogo de juegos o categorías para este MVP.
- **Sí:** contexto `AuthProvider` en `app/layout.tsx` en vez de prop-drilling manual. Las rutas reales ya no comparten un único árbol de componentes como el SPA original; sin contexto la sesión no se compartiría entre `/auth`, `/salon` y `/juegos/[id]/jugar`.
- **No:** leer `localStorage` de forma independiente en cada página sin contexto compartido. Generaría duplicación y desincronización del estado de sesión con el nav.
- **Sí:** mantener `av_user` y `av_scores` como claves de `localStorage`, iguales a la plantilla.
- **No:** extraer un componente `Leaderboard` compartido entre `detalle.jsx` y `salon.jsx`. Sus presentaciones difieren lo suficiente (fila simple vs. podio + tabla) como para que una abstracción prematura complique más de lo que ayuda.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `localStorage` no disponible (modo privado estricto) | Los accesos van envueltos en `try/catch`, igual que en la plantilla; si falla, la sesión simplemente no persiste pero la app sigue funcionando. |
| Discrepancia de hidratación (SSR sin sesión vs. cliente con sesión de `localStorage`) | `AuthProvider` inicializa `user` en `null` en el primer render y lo actualiza en un `useEffect`, aceptando un parpadeo inicial sin sesión a cambio de evitar el mismatch. |
| `app/globals.css`, migrado parcialmente en una rama previa, podría no cubrir el 100% de `templates/styles.css` | El paso 13 del plan compara explícitamente cada pantalla contra la plantilla antes de cerrar la implementación. |

---

## What is **not** in this spec

- Lógica de juego real para ninguno de los 8 juegos del catálogo.
- Backend, base de datos o autenticación real.
- Sistema de multijugador o competencia de puntos en tiempo real (visión de largo plazo del README).
- Créditos/monedas funcionales.
- Pruebas automatizadas.
- Internacionalización.

Cada uno de estos, si se implementa, va en su propia spec.
