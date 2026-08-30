insert into public.muscle_groups (name, slug) values
  ('Pecho', 'chest'),
  ('Espalda', 'back'),
  ('Piernas', 'legs'),
  ('Hombros', 'shoulders'),
  ('Bíceps', 'biceps'),
  ('Tríceps', 'triceps'),
  ('Core', 'core'),
  ('Glúteos', 'glutes'),
  ('Gemelos', 'calves'),
  ('Antebrazos', 'forearms');

insert into public.equipment (name, slug) values
  ('Barra', 'barbell'),
  ('Mancuernas', 'dumbbell'),
  ('Máquina', 'machine'),
  ('Polea', 'cable'),
  ('Peso corporal', 'bodyweight'),
  ('Kettlebell', 'kettlebell'),
  ('Banda elástica', 'band');

insert into public.exercises (name, slug, primary_muscle_group_id, equipment_id, difficulty, movement_type, description)
select v.name, v.slug,
  (select id from public.muscle_groups where slug = v.muscle_slug),
  (select id from public.equipment where slug = v.equipment_slug),
  v.difficulty::public.exercise_difficulty,
  v.movement_type::public.movement_type,
  v.description
from (values
  ('Press banca', 'bench-press', 'chest', 'barbell', 'intermediate', 'compound', 'Press horizontal con barra sobre banco plano.'),
  ('Press banca inclinado con mancuernas', 'incline-db-press', 'chest', 'dumbbell', 'intermediate', 'compound', 'Press inclinado con mancuernas, énfasis en pecho superior.'),
  ('Aperturas con mancuernas', 'db-fly', 'chest', 'dumbbell', 'beginner', 'isolation', 'Aislamiento de pecho en banco plano.'),
  ('Fondos en paralelas', 'dips', 'chest', 'bodyweight', 'intermediate', 'compound', 'Fondos con peso corporal, énfasis en pecho/tríceps.'),
  ('Dominadas', 'pull-up', 'back', 'bodyweight', 'intermediate', 'compound', 'Dominadas con agarre prono.'),
  ('Remo con barra', 'barbell-row', 'back', 'barbell', 'intermediate', 'compound', 'Remo horizontal con barra.'),
  ('Jalón al pecho', 'lat-pulldown', 'back', 'cable', 'beginner', 'compound', 'Jalón en polea alta.'),
  ('Remo en polea baja', 'seated-cable-row', 'back', 'cable', 'beginner', 'compound', 'Remo sentado en polea baja.'),
  ('Peso muerto', 'deadlift', 'back', 'barbell', 'advanced', 'compound', 'Peso muerto convencional con barra.'),
  ('Sentadilla', 'squat', 'legs', 'barbell', 'intermediate', 'compound', 'Sentadilla trasera con barra.'),
  ('Prensa de piernas', 'leg-press', 'legs', 'machine', 'beginner', 'compound', 'Prensa inclinada de piernas.'),
  ('Zancadas con mancuernas', 'db-lunge', 'legs', 'dumbbell', 'intermediate', 'compound', 'Zancadas alternas con mancuernas.'),
  ('Extensión de cuádriceps', 'leg-extension', 'legs', 'machine', 'beginner', 'isolation', 'Aislamiento de cuádriceps en máquina.'),
  ('Curl femoral', 'leg-curl', 'legs', 'machine', 'beginner', 'isolation', 'Aislamiento de isquiotibiales en máquina.'),
  ('Elevación de talones', 'calf-raise', 'calves', 'machine', 'beginner', 'isolation', 'Aislamiento de gemelos de pie.'),
  ('Press militar', 'overhead-press', 'shoulders', 'barbell', 'intermediate', 'compound', 'Press de hombro de pie con barra.'),
  ('Elevaciones laterales', 'lateral-raise', 'shoulders', 'dumbbell', 'beginner', 'isolation', 'Aislamiento de deltoide lateral.'),
  ('Curl de bíceps con barra', 'barbell-curl', 'biceps', 'barbell', 'beginner', 'isolation', 'Curl de bíceps con barra recta.'),
  ('Curl martillo', 'hammer-curl', 'biceps', 'dumbbell', 'beginner', 'isolation', 'Curl con agarre neutro.'),
  ('Extensión de tríceps en polea', 'triceps-pushdown', 'triceps', 'cable', 'beginner', 'isolation', 'Extensión de tríceps en polea alta.'),
  ('Press francés', 'skull-crusher', 'triceps', 'barbell', 'intermediate', 'isolation', 'Extensión de tríceps tumbado.'),
  ('Plancha', 'plank', 'core', 'bodyweight', 'beginner', 'isolation', 'Isométrico de core.'),
  ('Elevación de piernas colgado', 'hanging-leg-raise', 'core', 'bodyweight', 'intermediate', 'isolation', 'Aislamiento de abdomen inferior.'),
  ('Hip thrust', 'hip-thrust', 'glutes', 'barbell', 'intermediate', 'compound', 'Extensión de cadera con barra.'),
  ('Carrera', 'running', 'legs', 'bodyweight', 'beginner', 'cardio', 'Cardio de resistencia.')
) as v(name, slug, muscle_slug, equipment_slug, difficulty, movement_type, description);

insert into public.achievements (code, name, description, icon, category, criteria) values
  ('first_workout', 'Primer entrenamiento', 'Completa tu primer entrenamiento.', '🏆', 'consistency', '{"type": "workout_count", "threshold": 1}'),
  ('streak_7', '7 días entrenando', 'Mantén una racha de 7 días.', '🔥', 'consistency', '{"type": "streak_days", "threshold": 7}'),
  ('workouts_30', '30 entrenamientos', 'Completa 30 entrenamientos.', '🔥', 'consistency', '{"type": "workout_count", "threshold": 30}'),
  ('first_pr', 'Primer PR', 'Consigue tu primer récord personal.', '💪', 'strength', '{"type": "pr_count", "threshold": 1}'),
  ('prs_10', '10 PRs', 'Consigue 10 récords personales.', '💪', 'strength', '{"type": "pr_count", "threshold": 10}'),
  ('volume_10000', '10.000 kg de volumen', 'Acumula 10.000 kg de volumen total.', '🏋️', 'volume', '{"type": "total_volume_kg", "threshold": 10000}'),
  ('volume_100000', '100.000 kg de volumen', 'Acumula 100.000 kg de volumen total.', '🏋️', 'volume', '{"type": "total_volume_kg", "threshold": 100000}'),
  ('first_goal', 'Primer objetivo completado', 'Completa tu primer objetivo.', '🎯', 'goals', '{"type": "goals_completed", "threshold": 1}'),
  ('weeks_10', '10 semanas consecutivas', 'Entrena de forma consistente durante 10 semanas.', '📅', 'consistency', '{"type": "consistent_weeks", "threshold": 10}');
