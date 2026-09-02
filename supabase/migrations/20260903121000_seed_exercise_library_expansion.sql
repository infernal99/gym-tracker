-- Big batch of new exercises covering every muscle group with real
-- equipment variants (barra / mancuernas / máquina / polea / Smith /
-- peso corporal), each its own row so it gets its own performance history.
-- Idempotent via ON CONFLICT (slug): safe to re-run.
insert into public.exercises (name, slug, primary_muscle_group_id, equipment_id, difficulty, movement_type, description)
select v.name, v.slug,
  (select id from public.muscle_groups where slug = v.muscle_slug),
  (select id from public.equipment where slug = v.equipment_slug),
  v.difficulty::public.exercise_difficulty,
  v.movement_type::public.movement_type,
  v.description
from (values
  -- Pecho
  ('Press banca con mancuernas', 'flat-db-press', 'chest', 'dumbbell', 'intermediate', 'compound', 'Press horizontal con mancuernas en banco plano.'),
  ('Press banca en Smith', 'smith-bench-press', 'chest', 'smith_machine', 'beginner', 'compound', 'Press banca guiado en máquina Smith.'),
  ('Press inclinado con barra', 'incline-barbell-press', 'chest', 'barbell', 'intermediate', 'compound', 'Press inclinado con barra, énfasis en pecho superior.'),
  ('Press inclinado en Smith', 'smith-incline-press', 'chest', 'smith_machine', 'beginner', 'compound', 'Press inclinado guiado en máquina Smith.'),
  ('Press declinado con barra', 'decline-barbell-press', 'chest', 'barbell', 'intermediate', 'compound', 'Press declinado, énfasis en pecho inferior.'),
  ('Press declinado con mancuernas', 'decline-db-press', 'chest', 'dumbbell', 'intermediate', 'compound', 'Press declinado con mancuernas.'),
  ('Press de pecho en máquina', 'chest-press-machine', 'chest', 'machine', 'beginner', 'compound', 'Press de pecho guiado en máquina.'),
  ('Aperturas en máquina', 'pec-deck-fly', 'chest', 'machine', 'beginner', 'isolation', 'Aislamiento de pecho en máquina contractora (pec deck).'),
  ('Cruce de poleas', 'cable-crossover', 'chest', 'cable', 'intermediate', 'isolation', 'Aislamiento de pecho cruzando poleas altas.'),
  ('Cruce de poleas bajo a alto', 'low-to-high-cable-fly', 'chest', 'cable', 'intermediate', 'isolation', 'Cruce de poleas de abajo hacia arriba, énfasis en pecho superior.'),
  ('Flexiones', 'push-up', 'chest', 'bodyweight', 'beginner', 'compound', 'Flexiones de pecho con peso corporal.'),
  ('Flexiones con lastre', 'weighted-push-up', 'chest', 'bodyweight', 'intermediate', 'compound', 'Flexiones con peso añadido.'),
  ('Flexiones declinadas', 'decline-push-up', 'chest', 'bodyweight', 'intermediate', 'compound', 'Flexiones con pies elevados, énfasis en pecho superior.'),
  ('Flexiones diamante', 'diamond-push-up', 'chest', 'bodyweight', 'intermediate', 'compound', 'Flexiones con manos juntas, énfasis en tríceps y pecho interno.'),
  ('Pullover con mancuerna', 'db-pullover', 'chest', 'dumbbell', 'intermediate', 'isolation', 'Pullover con mancuerna, trabaja pecho y dorsal.'),

  -- Espalda
  ('Dominadas asistidas', 'assisted-pull-up', 'back', 'machine', 'beginner', 'compound', 'Dominadas asistidas en máquina.'),
  ('Dominadas supinas', 'chin-up', 'back', 'bodyweight', 'intermediate', 'compound', 'Dominadas con agarre supino, más énfasis en bíceps.'),
  ('Dominadas agarre neutro', 'neutral-grip-pull-up', 'back', 'bodyweight', 'intermediate', 'compound', 'Dominadas con agarre neutro.'),
  ('Jalón agarre estrecho', 'close-grip-lat-pulldown', 'back', 'cable', 'beginner', 'compound', 'Jalón al pecho con agarre estrecho.'),
  ('Jalón agarre neutro', 'neutral-grip-lat-pulldown', 'back', 'cable', 'beginner', 'compound', 'Jalón al pecho con agarre neutro.'),
  ('Remo con mancuerna a una mano', 'one-arm-db-row', 'back', 'dumbbell', 'beginner', 'compound', 'Remo unilateral con mancuerna apoyado en banco.'),
  ('Remo en máquina', 'machine-row', 'back', 'machine', 'beginner', 'compound', 'Remo horizontal guiado en máquina.'),
  ('Remo T-bar', 't-bar-row', 'back', 'barbell', 'intermediate', 'compound', 'Remo con barra en T.'),
  ('Remo Pendlay', 'pendlay-row', 'back', 'barbell', 'advanced', 'compound', 'Remo explosivo desde el suelo con barra.'),
  ('Pullover en polea', 'cable-pullover', 'back', 'cable', 'intermediate', 'isolation', 'Pullover en polea alta, aislamiento de dorsal.'),
  ('Peso muerto sumo', 'sumo-deadlift', 'back', 'barbell', 'advanced', 'compound', 'Peso muerto con postura ancha.'),
  ('Hiperextensión', 'back-extension', 'lower_back', 'machine', 'beginner', 'isolation', 'Extensión de espalda baja en banco romano.'),
  ('Remo invertido', 'inverted-row', 'back', 'bodyweight', 'beginner', 'compound', 'Remo horizontal con peso corporal bajo una barra.'),

  -- Hombros
  ('Press de hombro con mancuernas', 'db-shoulder-press', 'shoulders', 'dumbbell', 'beginner', 'compound', 'Press de hombro sentado con mancuernas.'),
  ('Press Arnold', 'arnold-press', 'shoulders', 'dumbbell', 'intermediate', 'compound', 'Press de hombro con rotación de muñeca.'),
  ('Press de hombro en máquina', 'shoulder-press-machine', 'shoulders', 'machine', 'beginner', 'compound', 'Press de hombro guiado en máquina.'),
  ('Elevaciones laterales en polea', 'cable-lateral-raise', 'shoulders', 'cable', 'beginner', 'isolation', 'Elevación lateral en polea baja.'),
  ('Elevaciones frontales', 'front-raise', 'shoulders', 'dumbbell', 'beginner', 'isolation', 'Aislamiento de deltoide anterior.'),
  ('Elevaciones frontales en polea', 'cable-front-raise', 'shoulders', 'cable', 'beginner', 'isolation', 'Elevación frontal en polea.'),
  ('Pájaros', 'reverse-fly', 'shoulders', 'dumbbell', 'beginner', 'isolation', 'Aislamiento de deltoide posterior inclinado hacia delante.'),
  ('Reverse fly en máquina', 'machine-reverse-fly', 'shoulders', 'machine', 'beginner', 'isolation', 'Aislamiento de deltoide posterior en máquina.'),
  ('Face pull', 'face-pull', 'shoulders', 'cable', 'beginner', 'isolation', 'Tirón facial en polea, deltoide posterior y rotadores.'),
  ('Remo al mentón', 'upright-row', 'shoulders', 'barbell', 'intermediate', 'compound', 'Remo vertical hasta la barbilla.'),
  ('Press militar de pie', 'standing-overhead-press', 'shoulders', 'barbell', 'intermediate', 'compound', 'Press militar de pie con barra.'),

  -- Bíceps
  ('Curl con barra Z', 'ez-bar-curl', 'biceps', 'barbell', 'beginner', 'isolation', 'Curl de bíceps con barra Z, más cómodo para la muñeca.'),
  ('Curl con mancuernas', 'db-curl', 'biceps', 'dumbbell', 'beginner', 'isolation', 'Curl de bíceps con mancuernas.'),
  ('Curl alterno', 'alternating-db-curl', 'biceps', 'dumbbell', 'beginner', 'isolation', 'Curl de bíceps alternando brazos.'),
  ('Curl predicador', 'preacher-curl', 'biceps', 'barbell', 'intermediate', 'isolation', 'Curl en banco predicador, aísla el bíceps.'),
  ('Curl en banco inclinado', 'incline-db-curl', 'biceps', 'dumbbell', 'intermediate', 'isolation', 'Curl con mancuernas en banco inclinado, mayor estiramiento.'),
  ('Curl en polea', 'cable-curl', 'biceps', 'cable', 'beginner', 'isolation', 'Curl de bíceps en polea baja.'),
  ('Curl concentrado', 'concentration-curl', 'biceps', 'dumbbell', 'beginner', 'isolation', 'Curl unilateral apoyando el codo en el muslo.'),
  ('Curl araña', 'spider-curl', 'biceps', 'barbell', 'intermediate', 'isolation', 'Curl apoyado boca abajo en banco inclinado.'),

  -- Tríceps
  ('Press cerrado', 'close-grip-bench-press', 'triceps', 'barbell', 'intermediate', 'compound', 'Press banca con agarre estrecho, énfasis en tríceps.'),
  ('Extensión de tríceps por encima de la cabeza', 'overhead-db-triceps-extension', 'triceps', 'dumbbell', 'intermediate', 'isolation', 'Extensión de tríceps por encima de la cabeza con mancuerna.'),
  ('Extensión de tríceps en polea por encima de la cabeza', 'overhead-cable-triceps-extension', 'triceps', 'cable', 'intermediate', 'isolation', 'Extensión de tríceps por encima de la cabeza en polea.'),
  ('Fondos en banco', 'bench-dips', 'triceps', 'bodyweight', 'beginner', 'compound', 'Fondos de tríceps apoyado en banco.'),
  ('Fondos en máquina', 'machine-dips', 'triceps', 'machine', 'beginner', 'compound', 'Fondos de tríceps guiados en máquina.'),
  ('Patada de tríceps', 'triceps-kickback', 'triceps', 'dumbbell', 'beginner', 'isolation', 'Extensión de tríceps con mancuerna inclinado hacia delante.'),
  ('Extensión con cuerda', 'rope-pushdown', 'triceps', 'cable', 'beginner', 'isolation', 'Extensión de tríceps en polea con cuerda.'),
  ('Kickback en polea', 'cable-kickback', 'triceps', 'cable', 'beginner', 'isolation', 'Patada de tríceps en polea baja.'),
  ('Press francés con mancuernas', 'db-skull-crusher', 'triceps', 'dumbbell', 'intermediate', 'isolation', 'Extensión de tríceps tumbado con mancuernas.'),

  -- Cuádriceps
  ('Sentadilla frontal', 'front-squat', 'quads', 'barbell', 'advanced', 'compound', 'Sentadilla con la barra al frente, más énfasis en cuádriceps.'),
  ('Sentadilla goblet', 'goblet-squat', 'quads', 'kettlebell', 'beginner', 'compound', 'Sentadilla sujetando una pesa contra el pecho.'),
  ('Hack squat', 'hack-squat', 'quads', 'machine', 'intermediate', 'compound', 'Sentadilla guiada en máquina hack.'),
  ('Sentadilla búlgara', 'bulgarian-split-squat', 'quads', 'dumbbell', 'intermediate', 'compound', 'Sentadilla unilateral con pie trasero elevado.'),
  ('Zancadas caminando', 'walking-lunge', 'quads', 'dumbbell', 'intermediate', 'compound', 'Zancadas alternas avanzando.'),
  ('Step-up', 'step-up', 'quads', 'dumbbell', 'beginner', 'compound', 'Subida a un cajón o banco con peso.'),
  ('Sentadilla en Smith', 'smith-squat', 'quads', 'smith_machine', 'beginner', 'compound', 'Sentadilla guiada en máquina Smith.'),
  ('Sentadilla sissy', 'sissy-squat', 'quads', 'bodyweight', 'advanced', 'isolation', 'Sentadilla con énfasis extremo en cuádriceps, rodillas hacia delante.'),

  -- Femoral
  ('Curl femoral sentado', 'seated-leg-curl', 'hamstrings', 'machine', 'beginner', 'isolation', 'Curl femoral sentado en máquina.'),
  ('Curl femoral de pie', 'standing-leg-curl', 'hamstrings', 'machine', 'beginner', 'isolation', 'Curl femoral de pie, unilateral.'),
  ('Peso muerto rumano', 'romanian-deadlift', 'hamstrings', 'barbell', 'intermediate', 'compound', 'Peso muerto con piernas semi-rígidas, énfasis en femoral y glúteo.'),
  ('Buenos días', 'good-morning', 'hamstrings', 'barbell', 'advanced', 'compound', 'Flexión de cadera con barra en la espalda, femoral y lumbar.'),
  ('Peso muerto rumano con mancuernas', 'db-romanian-deadlift', 'hamstrings', 'dumbbell', 'beginner', 'compound', 'Peso muerto rumano con mancuernas.'),

  -- Glúteos
  ('Hip thrust en máquina', 'machine-hip-thrust', 'glutes', 'machine', 'beginner', 'compound', 'Hip thrust guiado en máquina.'),
  ('Puente de glúteo', 'glute-bridge', 'glutes', 'bodyweight', 'beginner', 'isolation', 'Puente de glúteo en el suelo.'),
  ('Patada de glúteo en polea', 'cable-glute-kickback', 'glutes', 'cable', 'beginner', 'isolation', 'Patada de glúteo en polea baja.'),
  ('Patada de glúteo en máquina', 'glute-kickback-machine', 'glutes', 'machine', 'beginner', 'isolation', 'Patada de glúteo guiada en máquina.'),

  -- Gemelos
  ('Elevación de gemelos sentado', 'seated-calf-raise', 'calves', 'machine', 'beginner', 'isolation', 'Elevación de gemelos sentado, énfasis en sóleo.'),
  ('Gemelo en prensa', 'leg-press-calf-raise', 'calves', 'machine', 'beginner', 'isolation', 'Elevación de gemelos en la máquina de prensa.'),
  ('Elevación de gemelos en Smith', 'smith-calf-raise', 'calves', 'smith_machine', 'beginner', 'isolation', 'Elevación de gemelos de pie con barra en Smith.'),
  ('Burro (donkey calf raise)', 'donkey-calf-raise', 'calves', 'machine', 'intermediate', 'isolation', 'Elevación de gemelos inclinado hacia delante.'),

  -- Core
  ('Crunch', 'crunch', 'core', 'bodyweight', 'beginner', 'isolation', 'Crunch abdominal básico en el suelo.'),
  ('Crunch en polea', 'cable-crunch', 'core', 'cable', 'intermediate', 'isolation', 'Crunch arrodillado en polea alta.'),
  ('Crunch en máquina', 'ab-machine-crunch', 'core', 'machine', 'beginner', 'isolation', 'Crunch guiado en máquina de abdominales.'),
  ('Elevación de rodillas colgado', 'hanging-knee-raise', 'core', 'bodyweight', 'intermediate', 'isolation', 'Elevación de rodillas colgado de la barra.'),
  ('Rueda abdominal', 'ab-wheel-rollout', 'core', 'bodyweight', 'advanced', 'isolation', 'Rodillo abdominal desde rodillas.'),
  ('Plancha lateral', 'side-plank', 'core', 'bodyweight', 'beginner', 'isolation', 'Isométrico lateral de core y oblicuos.'),
  ('Russian twist', 'russian-twist', 'core', 'bodyweight', 'beginner', 'isolation', 'Rotación de tronco sentado.'),
  ('Pallof press', 'pallof-press', 'core', 'cable', 'intermediate', 'isolation', 'Anti-rotación de core en polea.'),
  ('Elevación de piernas tumbado', 'lying-leg-raise', 'core', 'bodyweight', 'beginner', 'isolation', 'Elevación de piernas tumbado boca arriba.'),
  ('Bicicleta', 'bicycle-crunch', 'core', 'bodyweight', 'beginner', 'isolation', 'Crunch alterno tipo bicicleta.'),
  ('Sit-up', 'sit-up', 'core', 'bodyweight', 'beginner', 'isolation', 'Abdominal completo hasta sentarse.'),
  ('Dead bug', 'dead-bug', 'core', 'bodyweight', 'beginner', 'mobility', 'Ejercicio de estabilidad de core, brazo y pierna opuestos.'),

  -- Antebrazos
  ('Curl de muñeca', 'wrist-curl', 'forearms', 'barbell', 'beginner', 'isolation', 'Curl de muñeca sentado, flexores del antebrazo.'),
  ('Curl de muñeca inverso', 'reverse-wrist-curl', 'forearms', 'barbell', 'beginner', 'isolation', 'Curl de muñeca inverso, extensores del antebrazo.'),
  ('Farmer walk', 'farmers-walk', 'forearms', 'dumbbell', 'beginner', 'compound', 'Caminar cargando peso a los lados, agarre y core.'),
  ('Curl de antebrazo con barra Z', 'ez-bar-wrist-curl', 'forearms', 'barbell', 'beginner', 'isolation', 'Curl de muñeca con barra Z.'),
  ('Dead hang', 'dead-hang', 'forearms', 'bodyweight', 'beginner', 'isolation', 'Colgarse de la barra, fuerza de agarre.'),

  -- Trapecio
  ('Encogimientos con barra', 'barbell-shrug', 'traps', 'barbell', 'beginner', 'isolation', 'Encogimiento de hombros con barra.'),
  ('Encogimientos con mancuernas', 'db-shrug', 'traps', 'dumbbell', 'beginner', 'isolation', 'Encogimiento de hombros con mancuernas.'),
  ('Encogimientos en máquina', 'machine-shrug', 'traps', 'machine', 'beginner', 'isolation', 'Encogimiento de hombros guiado en máquina.'),

  -- Aductores
  ('Máquina de aductores', 'adductor-machine', 'adductors', 'machine', 'beginner', 'isolation', 'Aducción de cadera sentado en máquina.'),
  ('Aducción de cadera en polea', 'cable-hip-adduction', 'adductors', 'cable', 'beginner', 'isolation', 'Aducción de cadera en polea baja.'),

  -- Abductores
  ('Máquina de abductores', 'abductor-machine', 'abductors', 'machine', 'beginner', 'isolation', 'Abducción de cadera sentado en máquina.'),
  ('Abducción de cadera en polea', 'cable-hip-abduction', 'abductors', 'cable', 'beginner', 'isolation', 'Abducción de cadera en polea baja.'),

  -- Lumbar
  ('Superman', 'superman', 'lower_back', 'bodyweight', 'beginner', 'isolation', 'Extensión de espalda baja tumbado boca abajo.'),
  ('Bird dog', 'bird-dog', 'lower_back', 'bodyweight', 'beginner', 'mobility', 'Estabilidad de core y espalda baja a cuatro patas.')
) as v(name, slug, muscle_slug, equipment_slug, difficulty, movement_type, description)
on conflict (slug) do nothing;
