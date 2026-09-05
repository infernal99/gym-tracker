import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidad — Gym Tracker" };

const LAST_UPDATED = "5 de septiembre de 2026";
const SUPPORT_EMAIL = "velouraianuri@gmail.com";

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1>Política de privacidad</h1>
      <p>Última actualización: {LAST_UPDATED}</p>

      <p>
        Gym Tracker (&ldquo;la app&rdquo;, &ldquo;nosotros&rdquo;) respeta tu privacidad. Esta
        política explica qué datos recogemos, para qué los usamos y qué derechos tienes sobre
        ellos.
      </p>

      <h2>1. Datos que recogemos</h2>
      <ul>
        <li>
          <strong>Cuenta:</strong> email, nombre de usuario, nombre visible y contraseña
          (almacenada de forma cifrada por nuestro proveedor de autenticación).
        </li>
        <li>
          <strong>Perfil:</strong> foto de perfil, biografía, fecha de nacimiento, altura,
          objetivo de entrenamiento — todos opcionales.
        </li>
        <li>
          <strong>Datos de entrenamiento:</strong> rutinas, sesiones, series, repeticiones, peso
          usado, marcas personales y racha de entrenamiento.
        </li>
        <li>
          <strong>Datos corporales:</strong> peso corporal, medidas y fotos de progreso que subas
          o captures desde la app. Las fotos de progreso se guardan en un almacenamiento privado
          que solo tu cuenta puede leer.
        </li>
        <li>
          <strong>Cámara:</strong> si usas la captura guiada de fotos de progreso, la app analiza
          tu postura en tiempo real directamente en tu dispositivo (no se envía vídeo a ningún
          servidor) para ayudarte a alinearte con la silueta antes de disparar.
        </li>
        <li>
          <strong>Actividad social:</strong> si usas amigos, grupos o retos: tu lista de amigos,
          solicitudes, mensajes de reacción y resultados de retos compartidos con esas personas.
        </li>
        <li>
          <strong>Datos técnicos:</strong> información mínima de uso necesaria para que la app
          funcione (por ejemplo, si la app está instalada como PWA).
        </li>
      </ul>

      <h2>2. Para qué usamos tus datos</h2>
      <ul>
        <li>Ofrecer las funciones de la app: registrar entrenamientos, seguir tu progreso, XP y logros.</li>
        <li>Permitirte conectar con amigos y participar en retos, si decides usar esas funciones.</li>
        <li>Mostrarte tu propio progreso a lo largo del tiempo (peso, volumen, fotos).</li>
        <li>Mantener tu cuenta segura y prevenir abuso (por ejemplo, nombres de usuario duplicados).</li>
      </ul>
      <p>No vendemos tus datos ni los usamos con fines publicitarios.</p>

      <h2>3. Con quién compartimos datos</h2>
      <ul>
        <li>
          <strong>Supabase</strong>, nuestro proveedor de base de datos, autenticación y
          almacenamiento (alojado en la UE), que actúa como encargado del tratamiento.
        </li>
        <li>
          <strong>RepDB</strong>, fuente de los datos e imágenes de la biblioteca de ejercicios
          (no recibe tus datos personales).
        </li>
        <li>Otros usuarios de la app, únicamente la información que tú decidas hacer visible a tus amigos o públicamente (según tu configuración de privacidad de perfil).</li>
      </ul>

      <h2>4. Tus derechos</h2>
      <p>
        Puedes acceder, exportar, corregir o eliminar tus datos en cualquier momento:
      </p>
      <ul>
        <li>Editar tu perfil y preferencias de visibilidad desde la app.</li>
        <li>Exportar tu historial de entrenamientos en CSV desde Estadísticas.</li>
        <li>
          Eliminar tu cuenta y todos los datos asociados desde Ajustes → Eliminar cuenta. Esta
          acción es inmediata y no se puede deshacer.
        </li>
      </ul>
      <p>
        Para cualquier otra solicitud relacionada con tus datos, escríbenos a{" "}
        <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
        .
      </p>

      <h2>5. Conservación de datos</h2>
      <p>
        Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, todos tus
        datos personales, de entrenamiento y fotos se borran de forma permanente de nuestros
        sistemas.
      </p>

      <h2>6. Menores</h2>
      <p>Gym Tracker no está dirigida a menores de 16 años.</p>

      <h2>7. Cambios en esta política</h2>
      <p>
        Si actualizamos esta política de forma relevante, lo indicaremos en esta misma página con
        una nueva fecha de actualización.
      </p>

      <h2>8. Contacto</h2>
      <p>
        Para cualquier duda sobre privacidad, escríbenos a{" "}
        <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </>
  );
}
