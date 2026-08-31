# SPEC 03 — Pantalla Acerca de + envío de correo con Resend

> **Status:** Aprobado
> **Depends on:** SPEC 02
> **Date:** 2026-08-30
> **Objective:** Portar la pantalla "Acerca de" de `references/resources/home-about/about.jsx` a la ruta `/acerca-de`, con su formulario de contacto enviando un correo real vía Resend a través de un endpoint propio.

---

## Scope

**In:**

- Nueva pantalla en la ruta `/acerca-de`: hero con misión ("ACERCA DE ARCADE VAULT"), fila de 3 destacados (`highlight-row` con iconos HEART/BROWSER/PLANT), divisor animado de píxeles, y sección de contacto con formulario (nombre, correo, mensaje).
- Animación de aparición al hacer scroll (`useReveal`, duplicado localmente igual que en `app/page.tsx`), portada tal cual de la plantilla.
- Endpoint propio `POST /api/contacto` (`app/api/contacto/route.ts`) que recibe `{ name, email, message }`, valida los campos y envía el correo real usando el SDK de [Resend](https://resend.com/).
- Remitente: `onboarding@resend.dev` (dirección de pruebas de Resend, sin necesitar dominio propio verificado).
- Destinatario fijo: `mayitolalito@hotmail.com`, hardcodeado como constante en el endpoint.
- `Reply-To` del correo enviado = correo que el visitante escribió en el formulario.
- Estados de UX nuevos en el formulario (no existían en la plantilla original, que era 100% simulada): "enviando" (botón deshabilitado, texto "▶ ENVIANDO…") y "error" (mensaje visible dentro del formulario, sin perder lo escrito, permitiendo reintentar). El estado de éxito (`terminal-success`) se mantiene igual que en la plantilla, pero ahora solo se muestra si el endpoint responde `200`.
- Nuevo enlace "Acerca de" en el nav (escritorio + panel móvil), ubicado **después** de "Salón de la Fama", apuntando a `/acerca-de`. Se marca activo únicamente en `/acerca-de`.
- Nueva dependencia `resend` en `package.json`.
- Nuevo archivo `.env.template` en la raíz documentando `RESEND_API_KEY=` (sin valor real).
- Ampliación de `app/globals.css` con las clases de la sección "ABOUT PAGE" de la plantilla (`.about`, `.about-hero`, `.about-title`, `.about-mission`, `.highlight-row`/`.highlight`/`.hl-icon`/`.hl-text`, `.about-divider`/`.div-bar`/`.div-pixels`, `.about-contact`/`.contact-grid`/`.contact-intro`/`.contact-title`/`.contact-sub`/`.contact-tips`, `.contact-form` y sus reglas de `textarea`/`shake`, `.btn.press`, `.terminal-success`/`.term-*`), más una clase nueva `.form-error` (no existe en la plantilla) para el estado de error.

**Out of scope (for future specs):**

- Protección anti-spam (honeypot, rate limiting, captcha) en el formulario o el endpoint.
- Persistencia del mensaje en base de datos o `localStorage` — el envío de correo es la única acción que ocurre.
- Historial de mensajes enviados o panel de administración para verlos.
- Verificación de un dominio propio en Resend (se usa `onboarding@resend.dev`).
- Internacionalización o soporte de múltiples destinatarios.
- Cualquier cambio a las pantallas Home, Biblioteca, Salón o Auth existentes, más allá de agregar el enlace al nav.

---

## Data model

Esta spec no introduce estructuras de datos persistidas (no hay base de datos ni `localStorage`). Introduce el contrato del endpoint `POST /api/contacto`:

**Request body:**

```ts
{
  name: string;
  email: string;
  message: string;
}
```

**Response (éxito, `200`):**

```ts
{ ok: true }
```

**Response (validación fallida, `400`, o falla al enviar, `500`):**

```ts
{ ok: false; error: string }
```

Validación en el endpoint: `name`, `email` y `message` deben venir no vacíos después de `trim()`; `email` debe cumplir un formato válido básico (regex simple tipo `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`). Si falla, responde `400` sin llamar a Resend.

---

## Implementation plan

1. `npm install resend` — agrega la dependencia al proyecto. Verificable: `resend` aparece en `package.json` y `node_modules/resend` existe.
2. Crear `.env.template` en la raíz con `RESEND_API_KEY=` (sin valor). Verificable: el archivo existe, no contiene ninguna key real, y `.env.local` (donde el usuario debe pegar su key real antes de probar el envío) sigue cubierto por `.gitignore`.
3. Crear `app/api/contacto/route.ts`: handler `POST` que recibe `{ name, email, message }` del body JSON, valida los tres campos según el data model anterior; si falla, responde `400` con `{ ok: false, error }`. Si pasa, instancia `new Resend(process.env.RESEND_API_KEY)` y llama a `resend.emails.send({ from: "onboarding@resend.dev", to: "mayitolalito@hotmail.com", replyTo: email, subject: "Nuevo mensaje de contacto — Arcade Vault", text: ... })` incluyendo `name`, `email` y `message` en el cuerpo del texto. Si Resend devuelve error, responde `500` con `{ ok: false, error }`; si tiene éxito, responde `200` con `{ ok: true }`. Verificable: con `RESEND_API_KEY` configurada, `curl -X POST http://localhost:3000/api/contacto -H "Content-Type: application/json" -d '{"name":"a","email":"a@a.com","message":"hola"}'` devuelve `200 { ok: true }` y el correo llega a `mayitolalito@hotmail.com`.
4. Crear `app/acerca-de/page.tsx` (`"use client"`) portando `about.jsx`: hero con misión, `highlight-row` con `HighlightIcon` local (HEART/BROWSER/PLANT, igual patrón que `FeatureIcon`/`MiniCard` en `app/page.tsx` — función local sin archivo propio), divisor animado, sección de contacto. Reutilizar el patrón `useReveal()` ya existente en `app/page.tsx`, duplicado localmente (misma convención ya usada, sin extraer a un hook compartido). Verificable: `npm run dev` en `/acerca-de` muestra la pantalla completa igual a la plantilla.
5. Implementar el `onSubmit` del formulario de forma asíncrona: primero la validación de campos vacíos igual que la plantilla (dispara `shake` si falta alguno, sin llamar a la API); si pasa, estado `status: "sending"` (botón deshabilitado, texto "▶ ENVIANDO…"), luego `fetch("/api/contacto", { method: "POST", body: JSON.stringify(form) })`. Si la respuesta es `ok`, pasa a `status: "sent"` (muestra el `terminal-success` existente con el nombre ingresado). Si falla (respuesta no-ok o error de red/`fetch` rechazado), pasa a `status: "error"` y muestra el mensaje de error dentro del formulario, sin borrar lo escrito, permitiendo reintentar. Verificable: sin `RESEND_API_KEY` configurada (o con una inválida), el envío muestra el estado de error; con la key válida, muestra el `terminal-success`.
6. Añadir en `app/globals.css` las clases listadas en el Scope, portadas tal cual de `references/resources/home-about/styles.css` (sección "ABOUT PAGE"), más la nueva clase `.form-error` para el estado de error del paso 5. Verificable: comparación visual manual de `/acerca-de` contra `references/resources/home-about/arcade-vault-standalone.html` (sección Acerca de), y el estado de error se ve legible y consistente con el resto de la UI (tipografía pixel, color de acento).
7. Actualizar `components/nav.tsx`: extender el tipo del parámetro `name` de `isActive` para incluir `"acerca-de"` (`pathname === "/acerca-de"`); agregar `<Link href="/acerca-de">Acerca de</Link>` después de "Salón de la Fama" tanto en el bloque de escritorio como en el panel móvil. Verificable: en `/acerca-de`, el enlace "Acerca de" aparece resaltado en escritorio y en el panel móvil; en el resto de rutas no aparece resaltado.
8. Ejecutar `npm run lint` y `npm run build`, corrigiendo cualquier error antes de cerrar la implementación.
9. Probar con Playwright contra el servidor de desarrollo ya activo (`http://localhost:3000`, sin volver a levantarlo): navegar a `/acerca-de` y confirmar que carga sin errores de consola; hacer clic en "Acerca de" desde el nav (escritorio y móvil) y confirmar que resalta correctamente; enviar el formulario con algún campo vacío y confirmar el `shake`; enviar el formulario con datos válidos y confirmar el estado "ENVIANDO…" seguido de éxito o error según si `RESEND_API_KEY` está configurada en el entorno de prueba — si está configurada, confirmar además que el correo real llega a `mayitolalito@hotmail.com` con `Reply-To` igual al correo ingresado en el formulario.

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores.
- [ ] `npm run lint` no reporta errores.
- [ ] `/acerca-de` muestra el hero con misión, la fila de 3 destacados, el divisor animado y el formulario de contacto — igual a la plantilla.
- [ ] Las secciones marcadas `reveal` aparecen con la animación de fade/slide al hacer scroll hasta ellas.
- [ ] El nav muestra "Acerca de" después de "Salón de la Fama", en ese orden, en escritorio y en el panel móvil, apuntando a `/acerca-de`.
- [ ] "Acerca de" está activo únicamente en `/acerca-de`; el resto de enlaces del nav conservan su comportamiento de SPEC 02 sin cambios.
- [ ] Enviar el formulario con algún campo vacío dispara el `shake`, sin llamar a `/api/contacto`.
- [ ] Enviar el formulario con datos válidos muestra "▶ ENVIANDO…" (botón deshabilitado) mientras se espera la respuesta del servidor.
- [ ] Con `RESEND_API_KEY` válida configurada, el envío exitoso muestra el `terminal-success` con el nombre ingresado, y llega un correo real a `mayitolalito@hotmail.com` con `Reply-To` = correo del visitante.
- [ ] Si la llamada a la API falla (por ejemplo `RESEND_API_KEY` ausente o inválida, o error de red), se muestra un mensaje de error dentro del formulario sin perder los datos escritos, y el usuario puede reintentar sin recargar la página.
- [ ] Un `POST /api/contacto` con algún campo vacío o email con formato inválido responde `400` sin intentar enviar el correo.
- [ ] `.env.template` existe en la raíz con `RESEND_API_KEY=` sin valor real; ninguna key real queda commiteada en el repositorio.

---

## Decisions

- **Sí:** ruta `/acerca-de` y endpoint `/api/contacto`, nombres en español, consistentes con el resto de rutas del proyecto (`/biblioteca`, `/salon`, `/auth`). Confirmado por el usuario sobre `/about` / `/api/contact`.
- **Sí:** `onboarding@resend.dev` como remitente. Evita depender de un dominio propio verificado en la cuenta de Resend, que el usuario no tiene configurado todavía. Confirmado por el usuario.
- **Sí:** destinatario fijo `mayitolalito@hotmail.com`, hardcodeado como constante en `app/api/contacto/route.ts`, no como variable de entorno — no es un dato secreto y no cambia entre entornos para este MVP.
- **Sí:** `Reply-To` = correo del visitante, para poder responder directo desde el cliente de correo sin copiar/pegar la dirección manualmente. Confirmado por el usuario.
- **Sí:** loading + manejo de error explícito en el formulario, aunque la plantilla original (`about.jsx`) no lo tenía — necesario porque ahora el envío es real y puede fallar (red, API key ausente/inválida, límite de Resend). Confirmado por el usuario.
- **No:** persistir los mensajes en base de datos o `localStorage`. Coincide con que el resto del proyecto (SPEC 01/02) es 100% mock/decorativo salvo este envío real; el envío de correo es la única acción del lado del servidor. Confirmado por el usuario.
- **No:** protección anti-spam (honeypot, rate limiting, captcha). Fuera de alcance de este MVP; se puede agregar en una spec futura si se vuelve un problema real. Confirmado por el usuario.
- **Sí:** se agrega el enlace "Acerca de" al nav ahora que la pantalla existe. SPEC 02 lo había excluido explícitamente solo porque la pantalla todavía no existía. Confirmado por el usuario.
- **Sí:** `HighlightIcon` se define como función local dentro de `app/acerca-de/page.tsx`, sin archivo propio en `components/`, igual patrón que `FeatureIcon`/`MiniCard` en `app/page.tsx` (Home) — específico de una sola pantalla, no reutilizado en otra ruta.
- **Sí:** `useReveal()` se duplica localmente en `app/acerca-de/page.tsx` en vez de extraerse a un hook compartido en `lib/` — misma convención ya usada entre Home y esta pantalla; el proyecto no tiene una carpeta `hooks/` establecida todavía.
- **No:** commitear `RESEND_API_KEY` en el repositorio. El usuario la agrega manualmente en `.env.local` (no versionado, cubierto explícitamente por `.gitignore`) antes de probar el envío real end-to-end.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El usuario no ha configurado `RESEND_API_KEY` en `.env.local` al momento de correr `/spec-impl`, por lo que el envío real de correo no se puede probar end-to-end durante la implementación. | El paso 2 crea `.env.template` como recordatorio; el paso 9 (Playwright) documenta que el envío real requiere la key configurada — si no está, ese punto específico queda pendiente de verificación manual por el usuario, sin bloquear el resto de la implementación (validación, estados de UX, nav, lint, build). |
| En el plan gratuito de Resend, usando `onboarding@resend.dev` como remitente, solo se puede enviar a la dirección de correo con la que está registrada la cuenta de Resend — el correo podría no llegar a `mayitolalito@hotmail.com` si esa no es la cuenta verificada del usuario en Resend. | Documentado aquí explícitamente; si ocurre, el usuario deberá registrar/verificar `mayitolalito@hotmail.com` en su cuenta de Resend, o verificar un dominio propio y cambiar el remitente en una iteración futura. |

---

## What is **not** in this spec

- Protección anti-spam (honeypot, rate limiting, captcha).
- Persistencia del mensaje enviado (base de datos, `localStorage`, historial).
- Panel de administración para ver mensajes recibidos.
- Verificación de un dominio propio en Resend.
- Cambios a Home, Biblioteca, Salón o Auth más allá del enlace en el nav.

Cada uno de estos, si se implementa, va en su propia spec.
