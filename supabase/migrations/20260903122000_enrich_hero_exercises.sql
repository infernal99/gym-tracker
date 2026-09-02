-- Full "ficha" detail (instructions/tips/common_mistakes) for the ~25 most
-- commonly programmed compound lifts, as a first pass. The rest of the
-- library still has correct name/muscle/equipment/difficulty/description;
-- filling in the remaining fichas is incremental follow-up work.
update public.exercises set
  instructions = ARRAY[
    'Túmbate en el banco con los ojos bajo la barra.',
    'Agarra la barra algo más ancho que los hombros.',
    'Desbloquea la barra y bájala controlada hasta el pecho.',
    'Empuja hacia arriba hasta extender los brazos.'
  ],
  tips = ARRAY['Mantén los hombros retraídos.', 'Controla la fase negativa.', 'Pies firmes en el suelo.'],
  common_mistakes = ARRAY['Levantar los glúteos del banco.', 'Rebotar la barra en el pecho.', 'Agarre demasiado estrecho o ancho.']
where slug = 'bench-press';

update public.exercises set
  instructions = ARRAY[
    'Ajusta el banco a 30-45 grados.',
    'Sujeta las mancuernas a la altura del pecho.',
    'Empuja hacia arriba hasta casi extender los codos.',
    'Baja controlado hasta sentir el estiramiento en el pecho.'
  ],
  tips = ARRAY['No bloquees los codos del todo arriba.', 'Controla el descenso.'],
  common_mistakes = ARRAY['Inclinación del banco demasiado alta (pasa a hombro).', 'Bajar demasiado rápido.']
where slug = 'incline-db-press';

update public.exercises set
  instructions = ARRAY[
    'Sujétate en las paralelas con los brazos extendidos.',
    'Baja el cuerpo flexionando los codos, inclinado hacia delante.',
    'Baja hasta sentir estiramiento en el pecho.',
    'Empuja hacia arriba hasta extender los brazos.'
  ],
  tips = ARRAY['Inclínate hacia delante para más pecho, más vertical para más tríceps.', 'No bajes en exceso si notas molestia en el hombro.'],
  common_mistakes = ARRAY['Bajar demasiado y forzar el hombro.', 'Balancear las piernas para impulsarse.']
where slug = 'dips';

update public.exercises set
  instructions = ARRAY[
    'Cuélgate de la barra con agarre prono, algo más ancho que los hombros.',
    'Tira llevando el pecho hacia la barra.',
    'Sube hasta que la barbilla pase la barra.',
    'Baja controlado hasta extender los brazos.'
  ],
  tips = ARRAY['Evita balancear el cuerpo (kipping).', 'Piensa en llevar los codos hacia abajo.'],
  common_mistakes = ARRAY['No completar el rango de movimiento.', 'Usar impulso en vez de fuerza de espalda.']
where slug = 'pull-up';

update public.exercises set
  instructions = ARRAY[
    'Flexiona la cadera manteniendo la espalda recta, agarra la barra.',
    'Tira de la barra hacia el abdomen.',
    'Aprieta los omóplatos arriba.',
    'Baja controlado sin perder la posición de la espalda.'
  ],
  tips = ARRAY['Mantén el core apretado durante todo el movimiento.', 'No uses impulso de las piernas.'],
  common_mistakes = ARRAY['Redondear la espalda baja.', 'Usar demasiado peso y perder la técnica.']
where slug = 'barbell-row';

update public.exercises set
  instructions = ARRAY[
    'Siéntate y ajusta el soporte para los muslos.',
    'Agarra la barra más ancho que los hombros.',
    'Tira hacia abajo llevando la barra hacia la parte alta del pecho.',
    'Sube controlado hasta extender los brazos.'
  ],
  tips = ARRAY['Evita echar el torso muy hacia atrás.', 'Piensa en llevar los codos hacia las caderas.'],
  common_mistakes = ARRAY['Usar impulso balanceando el cuerpo.', 'No completar el rango arriba.']
where slug = 'lat-pulldown';

update public.exercises set
  instructions = ARRAY[
    'Colócate con los pies bajo la barra, separación de caderas.',
    'Agarra la barra fuera de las rodillas, espalda recta.',
    'Empuja el suelo con las piernas mientras subes la barra pegada al cuerpo.',
    'Extiende cadera y rodillas a la vez hasta quedar de pie.',
    'Baja controlado invirtiendo el movimiento.'
  ],
  tips = ARRAY['Mantén la barra siempre pegada a las piernas.', 'Respira y mantén el core rígido antes de tirar.', 'La cadera y los hombros deben subir a la vez.'],
  common_mistakes = ARRAY['Redondear la espalda baja.', 'Que la cadera suba antes que los hombros.', 'Alejar la barra del cuerpo.']
where slug = 'deadlift';

update public.exercises set
  instructions = ARRAY[
    'Coloca la barra sobre los trapecios, pies a la anchura de hombros.',
    'Baja flexionando cadera y rodillas, manteniendo el pecho arriba.',
    'Baja hasta que los muslos superen la horizontal.',
    'Empuja el suelo para volver a la posición inicial.'
  ],
  tips = ARRAY['Mantén las rodillas alineadas con los pies.', 'Controla la bajada.', 'Mira al frente, no hacia abajo.'],
  common_mistakes = ARRAY['Que las rodillas se vayan hacia dentro.', 'Levantar los talones del suelo.', 'No bajar lo suficiente.']
where slug = 'squat';

update public.exercises set
  instructions = ARRAY[
    'Siéntate en la máquina con los pies en la plataforma, anchura de hombros.',
    'Desbloquea los seguros.',
    'Baja controlado flexionando las rodillas hacia el pecho.',
    'Empuja la plataforma hasta casi extender las piernas.'
  ],
  tips = ARRAY['No bloquees las rodillas del todo arriba.', 'Mantén la espalda baja pegada al respaldo.'],
  common_mistakes = ARRAY['Bajar demasiado y despegar la espalda baja.', 'Colocar los pies demasiado abajo en la plataforma.']
where slug = 'leg-press';

update public.exercises set
  instructions = ARRAY[
    'De pie o sentado, agarra la barra a la altura de los hombros.',
    'Empuja la barra por encima de la cabeza hasta extender los brazos.',
    'Baja controlado hasta la posición inicial.'
  ],
  tips = ARRAY['Aprieta los glúteos y el core para proteger la espalda baja.', 'La barra debe pasar cerca de la cara.'],
  common_mistakes = ARRAY['Arquear demasiado la espalda baja.', 'Empujar la barra hacia delante en vez de recta arriba.']
where slug = 'overhead-press';

update public.exercises set
  instructions = ARRAY[
    'De pie con una mancuerna en cada mano, brazos a los lados.',
    'Eleva los brazos hacia los lados hasta la altura de los hombros.',
    'Baja controlado.'
  ],
  tips = ARRAY['Codos ligeramente flexionados durante todo el movimiento.', 'Sube liderando con los codos, no con las manos.'],
  common_mistakes = ARRAY['Usar impulso balanceando el cuerpo.', 'Subir por encima de la altura del hombro.']
where slug = 'lateral-raise';

update public.exercises set
  instructions = ARRAY[
    'De pie, agarra la barra con las palmas hacia arriba.',
    'Flexiona los codos llevando la barra hacia los hombros.',
    'Baja controlado hasta extender los brazos.'
  ],
  tips = ARRAY['Mantén los codos pegados al cuerpo.', 'No balancees el torso.'],
  common_mistakes = ARRAY['Usar impulso de cadera.', 'No extender completamente abajo.']
where slug = 'barbell-curl';

update public.exercises set
  instructions = ARRAY[
    'De pie, sujeta las mancuernas con agarre neutro (palmas mirándose).',
    'Flexiona los codos manteniendo el agarre neutro.',
    'Baja controlado.'
  ],
  tips = ARRAY['Mantén los codos fijos junto al cuerpo.'],
  common_mistakes = ARRAY['Balancear los brazos con impulso.', 'Mover el hombro hacia delante.']
where slug = 'hammer-curl';

update public.exercises set
  instructions = ARRAY[
    'De pie frente a la polea alta, agarra la barra o cuerda.',
    'Mantén los codos pegados al cuerpo.',
    'Extiende los brazos hacia abajo.',
    'Vuelve controlado a la posición inicial.'
  ],
  tips = ARRAY['No muevas los codos hacia delante ni atrás.', 'Aprieta el tríceps abajo.'],
  common_mistakes = ARRAY['Usar el peso del cuerpo para empujar.', 'Separar los codos del torso.']
where slug = 'triceps-pushdown';

update public.exercises set
  instructions = ARRAY[
    'Túmbate en el banco con una barra o mancuernas extendidas sobre el pecho.',
    'Flexiona los codos bajando el peso hacia la frente.',
    'Extiende de nuevo los brazos.'
  ],
  tips = ARRAY['Mantén los codos apuntando al techo, no hacia fuera.', 'Usa un peso controlable, es fácil pasarse.'],
  common_mistakes = ARRAY['Mover los codos hacia atrás/adelante.', 'Bajar demasiado rápido.']
where slug = 'skull-crusher';

update public.exercises set
  instructions = ARRAY[
    'Apóyate sobre los antebrazos y las puntas de los pies.',
    'Mantén el cuerpo en línea recta de cabeza a talones.',
    'Aprieta el core y aguanta la posición.'
  ],
  tips = ARRAY['No dejes caer la cadera.', 'Respira con normalidad durante el ejercicio.'],
  common_mistakes = ARRAY['Elevar demasiado las caderas.', 'Dejar caer la zona lumbar.']
where slug = 'plank';

update public.exercises set
  instructions = ARRAY[
    'Apoya la parte alta de la espalda en un banco, barra sobre la cadera.',
    'Pies apoyados en el suelo, rodillas a 90 grados.',
    'Empuja la cadera hacia arriba apretando los glúteos.',
    'Baja controlado sin tocar el suelo del todo.'
  ],
  tips = ARRAY['Aprieta fuerte los glúteos arriba.', 'Barbilla metida, no mires al techo.'],
  common_mistakes = ARRAY['Arquear la espalda baja en vez de usar los glúteos.', 'No completar la extensión de cadera arriba.']
where slug = 'hip-thrust';

update public.exercises set
  instructions = ARRAY[
    'De pie sobre una plataforma elevada, con peso si es posible.',
    'Sube los talones lo máximo posible.',
    'Baja controlado hasta sentir el estiramiento en la pantorrilla.'
  ],
  tips = ARRAY['Pausa un momento arriba apretando la pantorrilla.', 'Rango completo, sin cortar el recorrido.'],
  common_mistakes = ARRAY['Rebotar en vez de controlar el movimiento.', 'Rango de movimiento demasiado corto.']
where slug = 'calf-raise';

update public.exercises set
  instructions = ARRAY[
    'Coloca la barra sobre los deltoides anteriores, brazos cruzados o agarre limpio.',
    'Baja en sentadilla manteniendo el torso lo más vertical posible.',
    'Sube empujando el suelo.'
  ],
  tips = ARRAY['Mantén los codos altos.', 'El torso debe quedarse vertical, no inclinarse hacia delante.'],
  common_mistakes = ARRAY['Dejar caer los codos.', 'Inclinar demasiado el torso hacia delante.']
where slug = 'front-squat';

update public.exercises set
  instructions = ARRAY[
    'Sujeta la barra con las piernas casi extendidas, ligera flexión de rodilla.',
    'Empuja la cadera hacia atrás manteniendo la espalda recta.',
    'Baja hasta sentir el estiramiento en los isquiotibiales.',
    'Vuelve empujando la cadera hacia delante.'
  ],
  tips = ARRAY['La barra debe rozar las piernas todo el recorrido.', 'La espalda se mantiene recta, no redondeada.'],
  common_mistakes = ARRAY['Flexionar demasiado las rodillas (se convierte en peso muerto normal).', 'Redondear la espalda baja.']
where slug = 'romanian-deadlift';

update public.exercises set
  instructions = ARRAY[
    'Cuélgate de la barra con agarre supino, manos a la anchura de hombros.',
    'Tira llevando el pecho hacia la barra.',
    'Sube hasta que la barbilla pase la barra.',
    'Baja controlado.'
  ],
  tips = ARRAY['El agarre supino implica más al bíceps que la dominada prona.'],
  common_mistakes = ARRAY['No completar el rango de movimiento.', 'Usar impulso.']
where slug = 'chin-up';

update public.exercises set
  instructions = ARRAY[
    'Túmbate en el banco, agarre a la anchura de los hombros o algo menor.',
    'Baja la barra controlada hasta el pecho, codos cerca del cuerpo.',
    'Empuja hasta extender los brazos.'
  ],
  tips = ARRAY['Mantén los codos más pegados al cuerpo que en un press normal.'],
  common_mistakes = ARRAY['Agarre demasiado estrecho (molestia de muñeca).', 'Separar los codos como en press normal.']
where slug = 'close-grip-bench-press';

update public.exercises set
  instructions = ARRAY[
    'Siéntate con una mancuerna en cada mano a la altura de los hombros.',
    'Empuja hacia arriba hasta casi extender los brazos.',
    'Baja controlado.'
  ],
  tips = ARRAY['No arquees en exceso la espalda baja.'],
  common_mistakes = ARRAY['Chocar las mancuernas arriba con demasiada fuerza.', 'Usar impulso de piernas si estás sentado.']
where slug = 'db-shoulder-press';

update public.exercises set
  instructions = ARRAY[
    'Sujeta una pesa o mancuerna contra el pecho.',
    'Baja en sentadilla manteniendo el torso vertical.',
    'Sube empujando el suelo con los pies.'
  ],
  tips = ARRAY['Buena opción para aprender el patrón de sentadilla.', 'Codos apuntando hacia abajo entre las rodillas.'],
  common_mistakes = ARRAY['Redondear la espalda al bajar.', 'No bajar lo suficiente.']
where slug = 'goblet-squat';

update public.exercises set
  instructions = ARRAY[
    'Túmbate boca arriba con las rodillas flexionadas, pies apoyados.',
    'Empuja la cadera hacia arriba apretando los glúteos.',
    'Baja controlado sin tocar el suelo del todo.'
  ],
  tips = ARRAY['Aprieta arriba 1-2 segundos.'],
  common_mistakes = ARRAY['Usar la espalda baja en vez del glúteo.', 'Rango de movimiento demasiado corto.']
where slug = 'glute-bridge';

update public.exercises set
  instructions = ARRAY[
    'Túmbate boca arriba con las rodillas flexionadas.',
    'Lleva la barbilla al pecho y sube los hombros del suelo.',
    'Baja controlado sin apoyar completamente la cabeza.'
  ],
  tips = ARRAY['No tires del cuello con las manos.', 'Exhala al subir.'],
  common_mistakes = ARRAY['Tirar del cuello con las manos.', 'Usar impulso en vez de contraer el abdomen.']
where slug = 'crunch';

update public.exercises set
  instructions = ARRAY[
    'Sujeta una mancuerna o kettlebell pesada en cada mano.',
    'Camina manteniendo el torso erguido y el core apretado.',
    'Mantén los hombros hacia atrás durante todo el recorrido.'
  ],
  tips = ARRAY['Empieza con menos peso del que crees necesario.'],
  common_mistakes = ARRAY['Encorvar los hombros hacia delante.', 'Dar pasos demasiado largos.']
where slug = 'farmers-walk';
