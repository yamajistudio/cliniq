export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type ClinicRole = "CLINIC_ADMIN" | "MANAGER" | "DOCTOR" | "RECEPTIONIST";
export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST";
export type LeadSource = "WEBSITE" | "INSTAGRAM" | "WHATSAPP" | "INDICACAO" | "GOOGLE" | "OUTRO";
export type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type PatientStatus = "ACTIVE" | "INACTIVE";
export type MembershipStatus = "ACTIVE" | "INACTIVE";

export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string;
          name: string;
          legal_name: string | null;
          tax_id: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          logo_path: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          legal_name?: string | null;
          tax_id?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          logo_path?: string | null;
        };
        Update: {
          name?: string;
          legal_name?: string | null;
          tax_id?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          logo_path?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };

      clinic_memberships: {
        Row: {
          id: string;
          clinic_id: string;
          user_id: string;
          role: ClinicRole;
          status: MembershipStatus;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          user_id: string;
          role: ClinicRole;
          status?: MembershipStatus;
        };
        Update: {
          role?: ClinicRole;
          status?: MembershipStatus;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clinic_memberships_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };

      patients: {
        Row: {
          id: string;
          clinic_id: string;
          full_name: string;
          cpf: string | null;
          email: string | null;
          phone: string | null;
          birth_date: string | null;
          gender: string | null;
          address: string | null;
          notes: string | null;
          source: LeadSource | null;
          status: PatientStatus;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          full_name: string;
          cpf?: string | null;
          email?: string | null;
          phone?: string | null;
          birth_date?: string | null;
          gender?: string | null;
          address?: string | null;
          notes?: string | null;
          source?: LeadSource | null;
          status?: PatientStatus;
          created_by?: string | null;
        };
        Update: {
          full_name?: string;
          cpf?: string | null;
          email?: string | null;
          phone?: string | null;
          birth_date?: string | null;
          gender?: string | null;
          address?: string | null;
          notes?: string | null;
          source?: LeadSource | null;
          status?: PatientStatus;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };

      leads: {
        Row: {
          id: string;
          clinic_id: string;
          full_name: string;
          phone: string | null;
          email: string | null;
          source: LeadSource;
          status: LeadStatus;
          notes: string | null;
          assigned_to: string | null;
          converted_patient_id: string | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          full_name: string;
          phone?: string | null;
          email?: string | null;
          source: LeadSource;
          status?: LeadStatus;
          notes?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
        };
        Update: {
          full_name?: string;
          phone?: string | null;
          email?: string | null;
          source?: LeadSource;
          status?: LeadStatus;
          notes?: string | null;
          assigned_to?: string | null;
          converted_patient_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };

      services_catalog: {
        Row: {
          id: string;
          clinic_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number | null;
          is_active: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          name: string;
          description?: string | null;
          duration_minutes: number;
          price?: number | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          price?: number | null;
          is_active?: boolean;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "services_catalog_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };

      appointments: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string;
          doctor_id: string | null;
          professional_id: string | null;
          service_id: string | null;
          starts_at: string;
          ends_at: string | null;
          status: AppointmentStatus;
          notes: string | null;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id: string;
          doctor_id?: string | null;
          professional_id?: string | null;
          service_id?: string | null;
          starts_at: string;
          ends_at?: string | null;
          status?: AppointmentStatus;
          notes?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_by?: string | null;
        };
        Update: {
          patient_id?: string;
          doctor_id?: string | null;
          professional_id?: string | null;
          service_id?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          status?: AppointmentStatus;
          notes?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services_catalog";
            referencedColumns: ["id"];
          },
        ];
      };

      appointment_status_history: {
        Row: {
          id: string;
          appointment_id: string;
          clinic_id: string;
          from_status: string | null;
          to_status: string;
          changed_by: string;
          reason: string | null;
          created_at: string | null;
        };
        Insert: {
          appointment_id: string;
          clinic_id: string;
          from_status?: string | null;
          to_status: string;
          changed_by: string;
          reason?: string | null;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "appointment_status_history_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointment_status_history_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };

      medical_notes: {
        Row: {
          id: string;
          appointment_id: string | null;
          clinic_id: string;
          patient_id: string;
          doctor_id: string;
          content: Json;
          // Added in migration 009 (unification with medical_records)
          diagnosis: string | null;
          prescription: string | null;
          professional_id: string | null;
          updated_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          appointment_id?: string | null;
          clinic_id: string;
          patient_id: string;
          doctor_id: string;
          content: Json;
          diagnosis?: string | null;
          prescription?: string | null;
          professional_id?: string | null;
        };
        Update: {
          content?: Json;
          diagnosis?: string | null;
          prescription?: string | null;
          professional_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "medical_notes_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_notes_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };

      follow_ups: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string;
          appointment_id: string | null;
          scheduled_for: string;
          status: "PENDING" | "DONE" | "CANCELLED";
          notes: string | null;
          created_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id: string;
          appointment_id?: string | null;
          scheduled_for: string;
          status?: "PENDING" | "DONE" | "CANCELLED";
          notes?: string | null;
          created_by?: string | null;
        };
        Update: {
          scheduled_for?: string;
          status?: "PENDING" | "DONE" | "CANCELLED";
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "follow_ups_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follow_ups_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };

      attachments: {
        Row: {
          id: string;
          clinic_id: string;
          entity_type: string;
          entity_id: string;
          file_name: string;
          mime_type: string | null;
          size_bytes: number | null;
          storage_path: string;
          uploaded_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          entity_type: string;
          entity_id: string;
          file_name: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          storage_path: string;
          uploaded_by?: string | null;
        };
        Update: {
          file_name?: string;
          mime_type?: string | null;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attachments_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };

      professionals: {
        Row: {
          id: string;
          clinic_id: string;
          user_id: string | null;
          full_name: string;
          specialty: string;
          license_number: string | null;
          phone: string | null;
          email: string | null;
          color: string;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          user_id?: string | null;
          full_name: string;
          specialty: string;
          license_number?: string | null;
          phone?: string | null;
          email?: string | null;
          color?: string;
          avatar_url?: string | null;
          is_active?: boolean;
        };
        Update: {
          full_name?: string;
          specialty?: string;
          license_number?: string | null;
          phone?: string | null;
          email?: string | null;
          color?: string;
          avatar_url?: string | null;
          is_active?: boolean;
          user_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "professionals_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };

      professional_schedules: {
        Row: {
          id: string;
          professional_id: string;
          clinic_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          slot_duration_minutes: number;
          is_active: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          professional_id: string;
          clinic_id: string;
          day_of_week: number;
          start_time?: string;
          end_time?: string;
          slot_duration_minutes?: number;
          is_active?: boolean;
        };
        Update: {
          start_time?: string;
          end_time?: string;
          slot_duration_minutes?: number;
          is_active?: boolean;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "professional_schedules_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "professional_schedules_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };

      clinic_settings: {
        Row: {
          id: string;
          clinic_id: string;
          opening_time: string;
          closing_time: string;
          slot_duration_minutes: number;
          days_open: number[];
          lunch_start: string | null;
          lunch_end: string | null;
          allow_online_booking: boolean;
          timezone: string;
          appointment_buffer_minutes: number;
          updated_at: string | null;
        };
        Insert: {
          clinic_id: string;
          opening_time?: string;
          closing_time?: string;
          slot_duration_minutes?: number;
          days_open?: number[];
          lunch_start?: string | null;
          lunch_end?: string | null;
          allow_online_booking?: boolean;
          timezone?: string;
          appointment_buffer_minutes?: number;
        };
        Update: {
          opening_time?: string;
          closing_time?: string;
          slot_duration_minutes?: number;
          days_open?: number[];
          lunch_start?: string | null;
          lunch_end?: string | null;
          allow_online_booking?: boolean;
          timezone?: string;
          appointment_buffer_minutes?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clinic_settings_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: true;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };

      notification_settings: {
        Row: {
          id: string;
          clinic_id: string;
          confirm_enabled: boolean;
          confirm_hours_before: number;
          confirm_channel: string;
          reminder_enabled: boolean;
          reminder_hours_before: number;
          reminder_channel: string;
          followup_enabled: boolean;
          followup_days_after: number;
          followup_channel: string;
          birthday_enabled: boolean;
          updated_at: string | null;
        };
        Insert: {
          clinic_id: string;
          confirm_enabled?: boolean;
          confirm_hours_before?: number;
          confirm_channel?: string;
          reminder_enabled?: boolean;
          reminder_hours_before?: number;
          reminder_channel?: string;
          followup_enabled?: boolean;
          followup_days_after?: number;
          followup_channel?: string;
          birthday_enabled?: boolean;
        };
        Update: {
          confirm_enabled?: boolean;
          confirm_hours_before?: number;
          confirm_channel?: string;
          reminder_enabled?: boolean;
          reminder_hours_before?: number;
          reminder_channel?: string;
          followup_enabled?: boolean;
          followup_days_after?: number;
          followup_channel?: string;
          birthday_enabled?: boolean;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notification_settings_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: true;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };

      staff_invites: {
        Row: {
          id: string;
          clinic_id: string;
          email: string;
          role: ClinicRole;
          token: string;
          status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
          expires_at: string;
          accepted_at: string | null;
          invited_by: string;
          created_at: string | null;
        };
        Insert: {
          clinic_id: string;
          email: string;
          role: ClinicRole;
          token?: string;
          status?: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
          expires_at: string;
          invited_by: string;
        };
        Update: {
          status?: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
          accepted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "staff_invites_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };

      onboarding_progress: {
        Row: {
          id: string;
          clinic_id: string;
          step: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          step: string;
          completed?: boolean;
          completed_at?: string | null;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };

      payments: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string;
          appointment_id: string | null;
          amount: number;
          status: "PENDING" | "PAID" | "REFUNDED";
          payment_method: string | null;
          paid_at: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id: string;
          appointment_id?: string | null;
          amount: number;
          status?: "PENDING" | "PAID" | "REFUNDED";
          payment_method?: string | null;
          paid_at?: string | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: {
          amount?: number;
          status?: "PENDING" | "PAID" | "REFUNDED";
          payment_method?: string | null;
          paid_at?: string | null;
          notes?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };

      medical_records: {
        Row: {
          id: string;
          clinic_id: string;
          appointment_id: string;
          patient_id: string;
          professional_id: string | null;
          notes: string | null;
          diagnosis: string | null;
          prescription: string | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          appointment_id: string;
          patient_id: string;
          professional_id?: string | null;
          notes?: string | null;
          diagnosis?: string | null;
          prescription?: string | null;
          created_by?: string | null;
        };
        Update: {
          notes?: string | null;
          diagnosis?: string | null;
          prescription?: string | null;
          professional_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "medical_records_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_records_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_records_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["id"];
          },
        ];
      };

      plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          price: number;
          max_professionals: number;
          max_patients: number;
          max_appointments_month: number;
          features: Json;
          is_active: boolean;
          sort_order: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          price?: number;
          max_professionals?: number;
          max_patients?: number;
          max_appointments_month?: number;
          features?: Json;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          name?: string;
          slug?: string;
          price?: number;
          max_professionals?: number;
          max_patients?: number;
          max_appointments_month?: number;
          features?: Json;
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };

      subscriptions: {
        Row: {
          id: string;
          clinic_id: string;
          plan_id: string;
          status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
          started_at: string;
          expires_at: string | null;
          trial_end: string | null;
          cancelled_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          plan_id: string;
          status?: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
          started_at?: string;
          expires_at?: string | null;
          trial_end?: string | null;
          cancelled_at?: string | null;
        };
        Update: {
          plan_id?: string;
          status?: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
          expires_at?: string | null;
          trial_end?: string | null;
          cancelled_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: true;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };

      audit_logs: {
        Row: {
          id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata: Json;
          actor_user_id: string;
          clinic_id: string | null;
          created_at: string | null;
        };
        Insert: {
          action: string;
          entity_type: string;
          entity_id: string;
          metadata?: Json;
          actor_user_id: string;
          clinic_id?: string | null;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      crm_user_clinic_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };
    Enums: {
      clinic_role: ClinicRole;
      lead_status: LeadStatus;
      lead_source: LeadSource;
      appointment_status: AppointmentStatus;
      patient_status: PatientStatus;
      membership_status: MembershipStatus;
    };
  };
}
