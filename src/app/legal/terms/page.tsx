import type { Metadata } from "next";

export const metadata: Metadata = { title: "Términos de servicio — Gym Tracker" };

const LAST_UPDATED = "5 de septiembre de 2026";
const SUPPORT_EMAIL = "dmonfil@gmail.com";

export default function TermsPage() {
  return (
    <>
      <h1>Términos de servicio</h1>
      <p>Última actualización: {LAST_UPDATED}</p>

      <p>
        Al crear una cuenta o usar Gym Tracker (&ldquo;la app&rdquo;) aceptas estos términos. Si
        no estás de acuerdo, no uses la app.
      </p>

      <h2>1. La cuenta</h2>
      <ul>
        <li>Debes tener al menos 16 años para crear una cuenta.</li>
        <li>Eres responsable de la información que publiques y de mantener tu contraseña segura.</li>
        <li>Cada nombre de usuario es único y no puede duplicarse.</li>
      </ul>

      <h2>2. No es asesoramiento médico</h2>
      <p>
        Gym Tracker es una herramienta de registro y seguimiento de entrenamiento. No sustituye el
        consejo de un médico, fisioterapeuta o entrenador cualificado. Consulta a un profesional
        antes de empezar un programa de ejercicio, especialmente si tienes alguna condición
        médica. Usas la app y sigues cualquier rutina bajo tu propia responsabilidad.
      </p>

      <h2>3. Contenido y uso aceptable</h2>
      <ul>
        <li>No subas contenido ilegal, ofensivo, o que no seas tú mismo (en el caso de fotos de progreso).</li>
        <li>No uses la app para acosar, suplantar o dañar a otros usuarios.</li>
        <li>No intentes acceder a cuentas o datos de otras personas sin autorización.</li>
        <li>Nos reservamos el derecho de suspender cuentas que incumplan estas normas.</li>
      </ul>

      <h2>4. Tu contenido</h2>
      <p>
        Mantienes la propiedad de las fotos, medidas y datos que subas. Nos das permiso para
        almacenarlos y mostrártelos a ti (y a quien decidas compartirlos, como tus amigos en la
        app) con el único fin de operar el servicio.
      </p>
      <p>
        Los datos e imágenes de la biblioteca de ejercicios provienen de{" "}
        <a className="underline" href="https://repdb.co" target="_blank" rel="noopener noreferrer">
          RepDB
        </a>{" "}
        y se usan con atribución.
      </p>

      <h2>5. Eliminación de cuenta</h2>
      <p>
        Puedes eliminar tu cuenta en cualquier momento desde Ajustes → Eliminar cuenta. Esto borra
        de forma permanente e inmediata todos tus datos de nuestros sistemas.
      </p>

      <h2>6. Disponibilidad del servicio</h2>
      <p>
        Hacemos lo posible por mantener la app disponible, pero no garantizamos un servicio
        ininterrumpido ni libre de errores. Podemos modificar o descontinuar funciones con
        antelación razonable cuando sea posible.
      </p>

      <h2>7. Limitación de responsabilidad</h2>
      <p>
        En la medida permitida por la ley, Gym Tracker no se hace responsable de lesiones,
        pérdidas de datos u otros daños derivados del uso de la app, incluyendo el seguimiento de
        rutinas de entrenamiento.
      </p>

      <h2>8. Cambios en estos términos</h2>
      <p>
        Si actualizamos estos términos de forma relevante, lo indicaremos en esta misma página con
        una nueva fecha.
      </p>

      <h2>9. Contacto</h2>
      <p>
        Para cualquier duda, escríbenos a{" "}
        <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </>
  );
}
