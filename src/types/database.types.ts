// Hand-written to match supabase/migrations/*.sql. Once the Supabase project is
// linked, regenerate with `supabase gen types typescript --linked` and this
// file becomes redundant.

export type PrimaryGoal =
  | "gain_muscle"
  | "lose_fat"
  | "gain_strength"
  | "maintain"
  | "improve_performance"
  | "body_recomposition";

export type VisibilityLevel = "public" | "friends" | "private";
export type PrivateVisibilityLevel = "friends" | "private";
export type FriendRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type ExerciseDifficulty = "beginner" | "intermediate" | "advanced";
export type MovementType = "compound" | "isolation" | "cardio" | "mobility";
export type SetType = "warmup" | "working" | "drop_set" | "rest_pause" | "amrap";
export type PhotoAngle = "front" | "side" | "back";
export type GoalType = "weight" | "strength" | "reps" | "frequency" | "volume" | "custom";
export type GoalStatus = "active" | "completed" | "paused" | "cancelled";
export type PrType = "max_weight" | "max_reps_at_weight" | "max_volume" | "best_1rm";
export type ChallengeMetric =
  | "workouts"
  | "consistency"
  | "volume"
  | "prs"
  | "exercise"
  | "distance"
  | "custom";
export type ChallengeStatus = "upcoming" | "active" | "completed" | "cancelled";
export type ActivityType =
  | "workout_completed"
  | "new_pr"
  | "achievement_unlocked"
  | "goal_completed"
  | "challenge_won"
  | "level_up";
export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "new_pr"
  | "achievement"
  | "challenge"
  | "goal_completed"
  | "workout_reminder";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          date_of_birth: string | null;
          height_cm: number | null;
          initial_weight_kg: number | null;
          primary_goal: PrimaryGoal;
          xp: number;
          level: number;
          profile_visibility: VisibilityLevel;
          workouts_visibility: PrivateVisibilityLevel;
          weight_visibility: PrivateVisibilityLevel;
          prs_visibility: PrivateVisibilityLevel;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          username: string;
          display_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      friendships: {
        Row: { id: string; user_id_a: string; user_id_b: string; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["friendships"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["friendships"]["Row"]>;
        Relationships: [];
      };
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: FriendRequestStatus;
          created_at: string;
          responded_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["friend_requests"]["Row"]> & {
          sender_id: string;
          receiver_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["friend_requests"]["Row"]>;
        Relationships: [];
      };
      blocked_users: {
        Row: { id: string; blocker_id: string; blocked_id: string; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["blocked_users"]["Row"]> & {
          blocker_id: string;
          blocked_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["blocked_users"]["Row"]>;
        Relationships: [];
      };
      muscle_groups: {
        Row: { id: string; name: string; slug: string };
        Insert: Partial<Database["public"]["Tables"]["muscle_groups"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["muscle_groups"]["Row"]>;
        Relationships: [];
      };
      equipment: {
        Row: { id: string; name: string; slug: string };
        Insert: Partial<Database["public"]["Tables"]["equipment"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["equipment"]["Row"]>;
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          slug: string;
          primary_muscle_group_id: string;
          secondary_muscle_group_ids: string[];
          equipment_id: string | null;
          difficulty: ExerciseDifficulty;
          movement_type: MovementType;
          description: string | null;
          technique_notes: string | null;
          common_mistakes: string | null;
          tips: string | null;
          image_url: string | null;
          video_url: string | null;
          is_custom: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["exercises"]["Row"]> & {
          name: string;
          slug: string;
          primary_muscle_group_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["exercises"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "exercises_primary_muscle_group_id_fkey";
            columns: ["primary_muscle_group_id"];
            isOneToOne: false;
            referencedRelation: "muscle_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercises_equipment_id_fkey";
            columns: ["equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_archived: boolean;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_templates"]["Row"]> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_templates"]["Row"]>;
        Relationships: [];
      };
      workout_template_days: {
        Row: {
          id: string;
          template_id: string;
          day_order: number;
          name: string;
          is_rest_day: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_template_days"]["Row"]> & {
          template_id: string;
          day_order: number;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_template_days"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "workout_template_days_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "workout_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_template_exercises: {
        Row: {
          id: string;
          template_day_id: string;
          exercise_id: string;
          order_index: number;
          target_sets: number;
          target_reps_min: number | null;
          target_reps_max: number | null;
          target_weight_kg: number | null;
          target_rir: number | null;
          target_rpe: number | null;
          rest_seconds: number;
          notes: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_template_exercises"]["Row"]> & {
          template_day_id: string;
          exercise_id: string;
          order_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["workout_template_exercises"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "workout_template_exercises_template_day_id_fkey";
            columns: ["template_day_id"];
            isOneToOne: false;
            referencedRelation: "workout_template_days";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_template_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          template_id: string | null;
          template_day_id: string | null;
          name: string;
          started_at: string;
          completed_at: string | null;
          duration_seconds: number | null;
          notes: string | null;
          total_volume_kg: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_sessions"]["Row"]> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_sessions"]["Row"]>;
        Relationships: [];
      };
      workout_session_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          order_index: number;
          notes: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["workout_session_exercises"]["Row"]> & {
          session_id: string;
          exercise_id: string;
          order_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["workout_session_exercises"]["Row"]>;
        Relationships: [];
      };
      sets: {
        Row: {
          id: string;
          session_exercise_id: string;
          set_number: number;
          set_type: SetType;
          weight_kg: number | null;
          reps: number | null;
          rir: number | null;
          rpe: number | null;
          rest_seconds: number | null;
          completed_at: string;
          notes: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["sets"]["Row"]> & {
          session_exercise_id: string;
          set_number: number;
        };
        Update: Partial<Database["public"]["Tables"]["sets"]["Row"]>;
        Relationships: [];
      };
      body_weight_entries: {
        Row: {
          id: string;
          user_id: string;
          weight_kg: number;
          recorded_at: string;
          note: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["body_weight_entries"]["Row"]> & {
          user_id: string;
          weight_kg: number;
        };
        Update: Partial<Database["public"]["Tables"]["body_weight_entries"]["Row"]>;
        Relationships: [];
      };
      body_measurements: {
        Row: {
          id: string;
          user_id: string;
          recorded_at: string;
          waist_cm: number | null;
          chest_cm: number | null;
          arm_cm: number | null;
          forearm_cm: number | null;
          thigh_cm: number | null;
          calf_cm: number | null;
          hip_cm: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["body_measurements"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["body_measurements"]["Row"]>;
        Relationships: [];
      };
      progress_photos: {
        Row: {
          id: string;
          user_id: string;
          angle: PhotoAngle;
          storage_path: string;
          taken_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["progress_photos"]["Row"]> & {
          user_id: string;
          angle: PhotoAngle;
          storage_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["progress_photos"]["Row"]>;
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          type: GoalType;
          title: string;
          exercise_id: string | null;
          initial_value: number | null;
          current_value: number | null;
          target_value: number;
          unit: string;
          start_date: string;
          target_date: string | null;
          status: GoalStatus;
          created_at: string;
          completed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["goals"]["Row"]> & {
          user_id: string;
          type: GoalType;
          title: string;
          target_value: number;
          unit: string;
        };
        Update: Partial<Database["public"]["Tables"]["goals"]["Row"]>;
        Relationships: [];
      };
      personal_records: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          record_type: PrType;
          value: number;
          weight_kg: number | null;
          reps: number | null;
          achieved_at: string;
          session_set_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["personal_records"]["Row"]> & {
          user_id: string;
          exercise_id: string;
          record_type: PrType;
          value: number;
        };
        Update: Partial<Database["public"]["Tables"]["personal_records"]["Row"]>;
        Relationships: [];
      };
      xp_events: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason: string;
          related_type: string | null;
          related_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["xp_events"]["Row"]> & {
          user_id: string;
          amount: number;
          reason: string;
        };
        Update: Partial<Database["public"]["Tables"]["xp_events"]["Row"]>;
        Relationships: [];
      };
      achievements: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string;
          icon: string;
          category: string;
          criteria: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["achievements"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["achievements"]["Row"]>;
        Relationships: [];
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string | null;
          progress: number;
        };
        Insert: Partial<Database["public"]["Tables"]["user_achievements"]["Row"]> & {
          user_id: string;
          achievement_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_achievements"]["Row"]>;
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          creator_id: string;
          name: string;
          description: string | null;
          metric: ChallengeMetric;
          is_duel: boolean;
          target_value: number | null;
          exercise_id: string | null;
          start_date: string;
          end_date: string;
          status: ChallengeStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["challenges"]["Row"]> & {
          creator_id: string;
          name: string;
          metric: ChallengeMetric;
          start_date: string;
          end_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["challenges"]["Row"]>;
        Relationships: [];
      };
      challenge_participants: {
        Row: {
          id: string;
          challenge_id: string;
          user_id: string;
          joined_at: string;
          current_value: number;
          rank: number | null;
        };
        Insert: Partial<Database["public"]["Tables"]["challenge_participants"]["Row"]> & {
          challenge_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["challenge_participants"]["Row"]>;
        Relationships: [];
      };
      challenge_results: {
        Row: {
          id: string;
          challenge_id: string;
          user_id: string;
          final_value: number;
          final_rank: number;
          completed_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["challenge_results"]["Row"]> & {
          challenge_id: string;
          user_id: string;
          final_value: number;
          final_rank: number;
        };
        Update: Partial<Database["public"]["Tables"]["challenge_results"]["Row"]>;
        Relationships: [];
      };
      activity_feed: {
        Row: {
          id: string;
          user_id: string;
          type: ActivityType;
          related_type: string | null;
          related_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["activity_feed"]["Row"]> & {
          user_id: string;
          type: ActivityType;
        };
        Update: Partial<Database["public"]["Tables"]["activity_feed"]["Row"]>;
        Relationships: [];
      };
      reactions: {
        Row: { id: string; activity_id: string; user_id: string; emoji: string; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["reactions"]["Row"]> & {
          activity_id: string;
          user_id: string;
          emoji: string;
        };
        Update: Partial<Database["public"]["Tables"]["reactions"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          related_type: string | null;
          related_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          type: NotificationType;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
