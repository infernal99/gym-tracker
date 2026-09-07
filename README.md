# Gym Tracker — tu ecosistema personal de entrenamiento

Aplicación web (Next.js + TypeScript + Supabase) para registrar entrenamientos,
seguir el progreso y competir con amigos. Instalable como PWA.

Registro de sesiones, biblioteca de ejercicios, rutinas y plantillas,
seguimiento corporal con fotos de progreso, objetivos y récords, logros,
retos y duelos entre amigos, grupos, estadísticas, y un asistente de IA que
lee tus datos de entrenamiento para responder.

## Cómo ejecutar el proyecto

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run lint
```

### Variables de entorno

Mínimo imprescindible para arrancar (proyecto de Supabase):

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # enlaces de los correos de auth
```

Opcionales, solo para el asistente de IA (ver más abajo):

```bash
GEMINI_API_KEY=          # si está definida, se usa Gemini
GEMINI_MODEL=
GROQ_API_KEY=            # si no hay Gemini pero sí Groq, se usa Groq
GROQ_MODEL=
OLLAMA_BASE_URL=         # por defecto, si no hay ninguna de las anteriores
OLLAMA_MODEL=
AI_DAILY_MESSAGE_LIMIT=  # mensajes por usuario y día (30 por defecto)
```

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Supabase** — Postgres, autenticación y RLS (`@supabase/ssr`)
- **Tailwind CSS 4**, shadcn/ui y **Base UI**
- **React Hook Form + Zod** para todos los formularios
- **Recharts** para las gráficas de progreso
- **React Three Fiber + Three.js** para el modelo anatómico 3D
- **MediaPipe Tasks Vision** en las fotos de progreso
- PWA con service worker propio (`public/sw.js`)

## Estructura

```
src/
  app/
    (auth)/         login, registro, verificación y recuperación de contraseña
    (app)/          la aplicación con sesión: dashboard, rutinas, ejercicios,
                    entrenamiento, cuerpo, estadísticas, objetivos, logros,
                    retos, amigos, grupos, IA, perfil y ajustes
    onboarding/     alta guiada y resultados
    invite/         invitaciones por nombre de usuario
    legal/          términos y privacidad
  components/       UI por dominio (una carpeta por área de la app)
  lib/
    actions/        server actions
    services/       lógica de negocio contra Supabase, un fichero por dominio
    validation/     esquemas Zod, uno por formulario
    calculations/   fuerza, rangos de ejercicio, Harris-Benedict, discos
    supabase/       clientes de navegador, servidor y middleware
    ai/             el asistente (ver abajo)
    hooks/
  types/database.types.ts   tipos generados del esquema de Supabase
supabase/migrations/        el esquema completo, en orden cronológico
public/exercises/           imágenes de los ejercicios
public/models/              modelo anatómico 3D + su licencia
scripts/gen-icons.mjs       genera los iconos de la PWA
```

## Base de datos

Todo el esquema vive en `supabase/migrations/`, numerado por fecha y aplicado
en orden. Cubre perfiles y amistades, biblioteca de ejercicios, rutinas y
plantillas, sesiones de entrenamiento, seguimiento corporal, objetivos y
récords, gamificación, retos, y actividad y notificaciones.

Las migraciones son la fuente de verdad del esquema: si cambias una tabla,
crea una migración nueva en vez de tocar una ya aplicada. Después regenera
`src/types/database.types.ts` para que TypeScript siga cuadrando con la base
de datos.

## El asistente de IA

La app habla con el modelo a través de una única interfaz, `AIProvider`
([`src/lib/ai/provider.ts`](src/lib/ai/provider.ts)): `chat`, `chatStream` e
`isAvailable`. Nada del resto de la aplicación sabe qué modelo hay detrás.

`selectProvider()` en [`src/lib/ai/service.ts`](src/lib/ai/service.ts) elige por
variables de entorno, en este orden: **Gemini** si hay `GEMINI_API_KEY`,
**Groq** si hay `GROQ_API_KEY`, y **Ollama** en local como opción por defecto.
Añadir un proveedor nuevo es implementar esa interfaz y añadir una línea ahí.

El asistente usa llamadas a herramientas ([`src/lib/ai/tools/`](src/lib/ai/tools)),
separadas entre las que solo leen datos y las que escriben. `limits.ts` aplica
el tope diario de mensajes por usuario.

## Contenido de terceros — atribución obligatoria

Dos activos de la app no son propios y **su licencia exige atribución**:

- **Biblioteca de ejercicios e imágenes** — importada de
  [RepDB](https://github.com/RepDB/exercise-dataset) (free tier): uso personal
  y comercial dentro de la app con atribución. Cada ejercicio guarda su
  procedencia en las columnas `image_source` e `image_license`.
- **`public/models/anatomy-body.glb`** — derivado de
  [Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy) y de
  BodyParts3D, bajo **CC BY-SA 4.0**. Los detalles y el listado de cambios
  están en [`public/models/LICENSE.md`](public/models/LICENSE.md). Si
  redistribuyes el modelo (no el código de la app), tiene que seguir bajo la
  misma licencia.

No quites esas atribuciones de la interfaz ni de la base de datos.

## Detalles que conviene conocer antes de tocar nada

- **El matcher de [`src/proxy.ts`](src/proxy.ts) excluye `manifest.webmanifest`,
  `sw.js` e `icons/` a propósito.** El navegador los pide desde un contexto sin
  la sesión de la página; cuando estaban detrás del login, Chrome recibía el
  HTML de login en vez del manifest, la comprobación de instalación fallaba en
  silencio y `beforeinstallprompt` no se disparaba nunca. Si vuelves a tocar
  ese matcher, comprueba que la app sigue siendo instalable.
- **Las migraciones de importación de ejercicios son idempotentes**
  (`ON CONFLICT (slug)` y `coalesce`): se pueden volver a aplicar sin duplicar
  ni pisar datos ya presentes.
- **Los iconos de la PWA se generan**, no se editan a mano:
  `node scripts/gen-icons.mjs` los reconstruye en `public/icons/`.
