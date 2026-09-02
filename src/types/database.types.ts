export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          code: string
          created_at: string
          criteria: Json
          description: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          criteria: Json
          description: string
          icon: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      activity_feed: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          related_id: string | null
          related_type: string | null
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          related_id?: string | null
          related_type?: string | null
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          related_id?: string | null
          related_type?: string | null
          type?: Database["public"]["Enums"]["activity_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      body_measurements: {
        Row: {
          arm_cm: number | null
          calf_cm: number | null
          chest_cm: number | null
          created_at: string
          forearm_cm: number | null
          hip_cm: number | null
          id: string
          recorded_at: string
          thigh_cm: number | null
          user_id: string
          waist_cm: number | null
        }
        Insert: {
          arm_cm?: number | null
          calf_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          forearm_cm?: number | null
          hip_cm?: number | null
          id?: string
          recorded_at?: string
          thigh_cm?: number | null
          user_id: string
          waist_cm?: number | null
        }
        Update: {
          arm_cm?: number | null
          calf_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          forearm_cm?: number | null
          hip_cm?: number | null
          id?: string
          recorded_at?: string
          thigh_cm?: number | null
          user_id?: string
          waist_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      body_weight_entries: {
        Row: {
          created_at: string
          id: string
          note: string | null
          recorded_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          recorded_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          recorded_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "body_weight_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          current_value: number
          id: string
          joined_at: string
          rank: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          current_value?: number
          id?: string
          joined_at?: string
          rank?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          current_value?: number
          id?: string
          joined_at?: string
          rank?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_results: {
        Row: {
          challenge_id: string
          completed_at: string
          final_rank: number
          final_value: number
          id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          final_rank: number
          final_value: number
          id?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          final_rank?: number
          final_value?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_results_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          end_date: string
          exercise_id: string | null
          id: string
          is_duel: boolean
          metric: Database["public"]["Enums"]["challenge_metric"]
          name: string
          start_date: string
          status: Database["public"]["Enums"]["challenge_status"]
          target_value: number | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          end_date: string
          exercise_id?: string | null
          id?: string
          is_duel?: boolean
          metric: Database["public"]["Enums"]["challenge_metric"]
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["challenge_status"]
          target_value?: number | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          end_date?: string
          exercise_id?: string | null
          id?: string
          is_duel?: boolean
          metric?: Database["public"]["Enums"]["challenge_metric"]
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["challenge_status"]
          target_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          common_mistakes: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["exercise_difficulty"]
          equipment_id: string | null
          id: string
          image_url: string | null
          is_custom: boolean
          movement_type: Database["public"]["Enums"]["movement_type"]
          name: string
          primary_muscle_group_id: string
          secondary_muscle_group_ids: string[]
          slug: string
          technique_notes: string | null
          tips: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          common_mistakes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["exercise_difficulty"]
          equipment_id?: string | null
          id?: string
          image_url?: string | null
          is_custom?: boolean
          movement_type?: Database["public"]["Enums"]["movement_type"]
          name: string
          primary_muscle_group_id: string
          secondary_muscle_group_ids?: string[]
          slug: string
          technique_notes?: string | null
          tips?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          common_mistakes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["exercise_difficulty"]
          equipment_id?: string | null
          id?: string
          image_url?: string | null
          is_custom?: boolean
          movement_type?: Database["public"]["Enums"]["movement_type"]
          name?: string
          primary_muscle_group_id?: string
          secondary_muscle_group_ids?: string[]
          slug?: string
          technique_notes?: string | null
          tips?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_primary_muscle_group_id_fkey"
            columns: ["primary_muscle_group_id"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          responded_at: string | null
          sender_id: string
          status: Database["public"]["Enums"]["friend_request_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          responded_at?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["friend_request_status"]
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["friend_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          user_id_a: string
          user_id_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id_a: string
          user_id_b: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id_a?: string
          user_id_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_user_id_a_fkey"
            columns: ["user_id_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_b_fkey"
            columns: ["user_id_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          completed_at: string | null
          created_at: string
          current_value: number | null
          exercise_id: string | null
          id: string
          initial_value: number | null
          start_date: string
          status: Database["public"]["Enums"]["goal_status"]
          target_date: string | null
          target_value: number
          title: string
          type: Database["public"]["Enums"]["goal_type"]
          unit: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          exercise_id?: string | null
          id?: string
          initial_value?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_date?: string | null
          target_value: number
          title: string
          type: Database["public"]["Enums"]["goal_type"]
          unit: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          exercise_id?: string | null
          id?: string
          initial_value?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_date?: string | null
          target_value?: number
          title?: string
          type?: Database["public"]["Enums"]["goal_type"]
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      muscle_groups: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          related_id: string | null
          related_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          related_id?: string | null
          related_type?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_records: {
        Row: {
          achieved_at: string
          created_at: string
          exercise_id: string
          id: string
          record_type: Database["public"]["Enums"]["pr_type"]
          reps: number | null
          session_set_id: string | null
          user_id: string
          value: number
          weight_kg: number | null
        }
        Insert: {
          achieved_at?: string
          created_at?: string
          exercise_id: string
          id?: string
          record_type: Database["public"]["Enums"]["pr_type"]
          reps?: number | null
          session_set_id?: string | null
          user_id: string
          value: number
          weight_kg?: number | null
        }
        Update: {
          achieved_at?: string
          created_at?: string
          exercise_id?: string
          id?: string
          record_type?: Database["public"]["Enums"]["pr_type"]
          reps?: number | null
          session_set_id?: string | null
          user_id?: string
          value?: number
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_session_set_id_fkey"
            columns: ["session_set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_template_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string
          height_cm: number | null
          id: string
          initial_weight_kg: number | null
          level: number
          onboarding_completed: boolean
          primary_goal: Database["public"]["Enums"]["primary_goal"]
          profile_visibility: Database["public"]["Enums"]["visibility_level"]
          prs_visibility: Database["public"]["Enums"]["private_visibility_level"]
          sex: Database["public"]["Enums"]["biological_sex"] | null
          updated_at: string
          username: string
          weight_visibility: Database["public"]["Enums"]["private_visibility_level"]
          workouts_visibility: Database["public"]["Enums"]["private_visibility_level"]
          xp: number
        }
        Insert: {
          active_template_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name: string
          height_cm?: number | null
          id: string
          initial_weight_kg?: number | null
          level?: number
          onboarding_completed?: boolean
          primary_goal?: Database["public"]["Enums"]["primary_goal"]
          profile_visibility?: Database["public"]["Enums"]["visibility_level"]
          prs_visibility?: Database["public"]["Enums"]["private_visibility_level"]
          sex?: Database["public"]["Enums"]["biological_sex"] | null
          updated_at?: string
          username: string
          weight_visibility?: Database["public"]["Enums"]["private_visibility_level"]
          workouts_visibility?: Database["public"]["Enums"]["private_visibility_level"]
          xp?: number
        }
        Update: {
          active_template_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string
          height_cm?: number | null
          id?: string
          initial_weight_kg?: number | null
          level?: number
          onboarding_completed?: boolean
          primary_goal?: Database["public"]["Enums"]["primary_goal"]
          profile_visibility?: Database["public"]["Enums"]["visibility_level"]
          prs_visibility?: Database["public"]["Enums"]["private_visibility_level"]
          sex?: Database["public"]["Enums"]["biological_sex"] | null
          updated_at?: string
          username?: string
          weight_visibility?: Database["public"]["Enums"]["private_visibility_level"]
          workouts_visibility?: Database["public"]["Enums"]["private_visibility_level"]
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_template_id_fkey"
            columns: ["active_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_photos: {
        Row: {
          angle: Database["public"]["Enums"]["photo_angle"]
          created_at: string
          id: string
          storage_path: string
          taken_at: string
          user_id: string
        }
        Insert: {
          angle: Database["public"]["Enums"]["photo_angle"]
          created_at?: string
          id?: string
          storage_path: string
          taken_at?: string
          user_id: string
        }
        Update: {
          angle?: Database["public"]["Enums"]["photo_angle"]
          created_at?: string
          id?: string
          storage_path?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          activity_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sets: {
        Row: {
          completed_at: string
          id: string
          notes: string | null
          reps: number | null
          rest_seconds: number | null
          rir: number | null
          rpe: number | null
          session_exercise_id: string
          set_number: number
          set_type: Database["public"]["Enums"]["set_type"]
          weight_kg: number | null
        }
        Insert: {
          completed_at?: string
          id?: string
          notes?: string | null
          reps?: number | null
          rest_seconds?: number | null
          rir?: number | null
          rpe?: number | null
          session_exercise_id: string
          set_number: number
          set_type?: Database["public"]["Enums"]["set_type"]
          weight_kg?: number | null
        }
        Update: {
          completed_at?: string
          id?: string
          notes?: string | null
          reps?: number | null
          rest_seconds?: number | null
          rir?: number | null
          rpe?: number | null
          session_exercise_id?: string
          set_number?: number
          set_type?: Database["public"]["Enums"]["set_type"]
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sets_session_exercise_id_fkey"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_session_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: number
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_session_exercises: {
        Row: {
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          rest_seconds: number | null
          session_id: string
          target_reps_max: number | null
          target_reps_min: number | null
          target_rir: number | null
          target_sets: number | null
          target_weight_kg: number | null
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string | null
          order_index: number
          rest_seconds?: number | null
          session_id: string
          target_reps_max?: number | null
          target_reps_min?: number | null
          target_rir?: number | null
          target_sets?: number | null
          target_weight_kg?: number | null
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          rest_seconds?: number | null
          session_id?: string
          target_reps_max?: number | null
          target_reps_min?: number | null
          target_rir?: number | null
          target_sets?: number | null
          target_weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          name: string
          notes: string | null
          started_at: string
          template_day_id: string | null
          template_id: string | null
          total_volume_kg: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          name: string
          notes?: string | null
          started_at?: string
          template_day_id?: string | null
          template_id?: string | null
          total_volume_kg?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          name?: string
          notes?: string | null
          started_at?: string
          template_day_id?: string | null
          template_id?: string | null
          total_volume_kg?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_template_day_id_fkey"
            columns: ["template_day_id"]
            isOneToOne: false
            referencedRelation: "workout_template_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_template_days: {
        Row: {
          created_at: string
          day_order: number
          id: string
          is_rest_day: boolean
          muscle_group_ids: string[]
          name: string
          template_id: string
        }
        Insert: {
          created_at?: string
          day_order: number
          id?: string
          is_rest_day?: boolean
          muscle_group_ids?: string[]
          name: string
          template_id: string
        }
        Update: {
          created_at?: string
          day_order?: number
          id?: string
          is_rest_day?: boolean
          muscle_group_ids?: string[]
          name?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_days_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_template_exercises: {
        Row: {
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          rest_seconds: number
          target_reps_max: number | null
          target_reps_min: number | null
          target_rir: number | null
          target_rpe: number | null
          target_sets: number
          target_weight_kg: number | null
          template_day_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string | null
          order_index: number
          rest_seconds?: number
          target_reps_max?: number | null
          target_reps_min?: number | null
          target_rir?: number | null
          target_rpe?: number | null
          target_sets?: number
          target_weight_kg?: number | null
          template_day_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          rest_seconds?: number
          target_reps_max?: number | null
          target_reps_min?: number | null
          target_rir?: number | null
          target_rpe?: number | null
          target_sets?: number
          target_weight_kg?: number | null
          template_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_template_exercises_template_day_id_fkey"
            columns: ["template_day_id"]
            isOneToOne: false
            referencedRelation: "workout_template_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_archived: boolean
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          related_id: string | null
          related_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          related_id?: string | null
          related_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          related_id?: string | null
          related_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_friends: { Args: { a: string; b: string }; Returns: boolean }
      calculate_level: { Args: { p_xp: number }; Returns: number }
      can_view_profile: { Args: { target: string }; Returns: boolean }
      can_view_session: { Args: { p_user_id: string }; Returns: boolean }
      is_blocked: { Args: { a: string; b: string }; Returns: boolean }
      is_challenge_participant: {
        Args: { p_challenge_id: string }
        Returns: boolean
      }
      owns_session: { Args: { p_session_id: string }; Returns: boolean }
      owns_session_exercise: {
        Args: { p_session_exercise_id: string }
        Returns: boolean
      }
      owns_template: { Args: { template_id: string }; Returns: boolean }
      owns_template_day: { Args: { day_id: string }; Returns: boolean }
    }
    Enums: {
      activity_type:
        | "workout_completed"
        | "new_pr"
        | "achievement_unlocked"
        | "goal_completed"
        | "challenge_won"
        | "level_up"
      biological_sex: "male" | "female" | "other"
      challenge_metric:
        | "workouts"
        | "consistency"
        | "volume"
        | "prs"
        | "exercise"
        | "distance"
        | "custom"
      challenge_status: "upcoming" | "active" | "completed" | "cancelled"
      exercise_difficulty: "beginner" | "intermediate" | "advanced"
      friend_request_status: "pending" | "accepted" | "rejected" | "cancelled"
      goal_status: "active" | "completed" | "paused" | "cancelled"
      goal_type:
        | "weight"
        | "strength"
        | "reps"
        | "frequency"
        | "volume"
        | "custom"
      movement_type: "compound" | "isolation" | "cardio" | "mobility"
      notification_type:
        | "friend_request"
        | "friend_accepted"
        | "new_pr"
        | "achievement"
        | "challenge"
        | "goal_completed"
        | "workout_reminder"
      photo_angle: "front" | "side" | "back"
      pr_type: "max_weight" | "max_reps_at_weight" | "max_volume" | "best_1rm"
      primary_goal:
        | "gain_muscle"
        | "lose_fat"
        | "gain_strength"
        | "maintain"
        | "improve_performance"
        | "body_recomposition"
      private_visibility_level: "friends" | "private"
      set_type: "warmup" | "working" | "drop_set" | "rest_pause" | "amrap"
      visibility_level: "public" | "friends" | "private"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "workout_completed",
        "new_pr",
        "achievement_unlocked",
        "goal_completed",
        "challenge_won",
        "level_up",
      ],
      biological_sex: ["male", "female", "other"],
      challenge_metric: [
        "workouts",
        "consistency",
        "volume",
        "prs",
        "exercise",
        "distance",
        "custom",
      ],
      challenge_status: ["upcoming", "active", "completed", "cancelled"],
      exercise_difficulty: ["beginner", "intermediate", "advanced"],
      friend_request_status: ["pending", "accepted", "rejected", "cancelled"],
      goal_status: ["active", "completed", "paused", "cancelled"],
      goal_type: [
        "weight",
        "strength",
        "reps",
        "frequency",
        "volume",
        "custom",
      ],
      movement_type: ["compound", "isolation", "cardio", "mobility"],
      notification_type: [
        "friend_request",
        "friend_accepted",
        "new_pr",
        "achievement",
        "challenge",
        "goal_completed",
        "workout_reminder",
      ],
      photo_angle: ["front", "side", "back"],
      pr_type: ["max_weight", "max_reps_at_weight", "max_volume", "best_1rm"],
      primary_goal: [
        "gain_muscle",
        "lose_fat",
        "gain_strength",
        "maintain",
        "improve_performance",
        "body_recomposition",
      ],
      private_visibility_level: ["friends", "private"],
      set_type: ["warmup", "working", "drop_set", "rest_pause", "amrap"],
      visibility_level: ["public", "friends", "private"],
    },
  },
} as const

export type ExerciseDifficulty = Database["public"]["Enums"]["exercise_difficulty"]
