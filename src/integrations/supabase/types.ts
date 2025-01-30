export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          id: string
          landlord_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          landlord_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string
          id: string
          name: string
          property_id: string | null
          tenant_id: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_path: string
          id?: string
          name: string
          property_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_path?: string
          id?: string
          name?: string
          property_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          due_date: string
          id: string
          landlord_id: string
          paid_at: string | null
          property_id: string
          status: Database["public"]["Enums"]["invoice_status"] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          due_date: string
          id?: string
          landlord_id: string
          paid_at?: string | null
          property_id: string
          status?: Database["public"]["Enums"]["invoice_status"] | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          landlord_id?: string
          paid_at?: string | null
          property_id?: string
          status?: Database["public"]["Enums"]["invoice_status"] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_request_history: {
        Row: {
          description: string
          edited_at: string
          edited_by: string
          id: string
          images: string[] | null
          issue_type: string | null
          maintenance_request_id: string
          notes: string | null
          priority: string | null
          title: string
        }
        Insert: {
          description: string
          edited_at?: string
          edited_by: string
          id?: string
          images?: string[] | null
          issue_type?: string | null
          maintenance_request_id: string
          notes?: string | null
          priority?: string | null
          title: string
        }
        Update: {
          description?: string
          edited_at?: string
          edited_by?: string
          id?: string
          images?: string[] | null
          issue_type?: string | null
          maintenance_request_id?: string
          notes?: string | null
          priority?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_request_history_maintenance_request_id_fkey"
            columns: ["maintenance_request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          id: string
          images: string[] | null
          issue_type: string | null
          notes: string | null
          priority: string | null
          property_id: string
          read_by_landlord: boolean | null
          read_by_tenant: boolean | null
          service_provider_notes: string | null
          status: Database["public"]["Enums"]["maintenance_request_status"]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          id?: string
          images?: string[] | null
          issue_type?: string | null
          notes?: string | null
          priority?: string | null
          property_id: string
          read_by_landlord?: boolean | null
          read_by_tenant?: boolean | null
          service_provider_notes?: string | null
          status?: Database["public"]["Enums"]["maintenance_request_status"]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          id?: string
          images?: string[] | null
          issue_type?: string | null
          notes?: string | null
          priority?: string | null
          property_id?: string
          read_by_landlord?: boolean | null
          read_by_tenant?: boolean | null
          service_provider_notes?: string | null
          status?: Database["public"]["Enums"]["maintenance_request_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          profile_id: string
          read: boolean | null
          receiver_id: string | null
          room_id: string | null
          sender_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          profile_id: string
          read?: boolean | null
          receiver_id?: string | null
          room_id?: string | null
          sender_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          read?: boolean | null
          receiver_id?: string | null
          room_id?: string | null
          sender_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      meter_readings: {
        Row: {
          created_at: string
          created_by: string
          id: string
          notes: string | null
          property_id: string
          reading_date: string
          reading_type: Database["public"]["Enums"]["meter_type"]
          reading_value: number
          tenant_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          property_id: string
          reading_date?: string
          reading_type: Database["public"]["Enums"]["meter_type"]
          reading_value: number
          tenant_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          property_id?: string
          reading_date?: string
          reading_type?: Database["public"]["Enums"]["meter_type"]
          reading_value?: number
          tenant_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          due_date: string
          id: string
          paid_date: string | null
          read_by_landlord: boolean | null
          read_by_tenant: boolean | null
          status: string
          tenancy_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          due_date: string
          id?: string
          paid_date?: string | null
          read_by_landlord?: boolean | null
          read_by_tenant?: boolean | null
          status?: string
          tenancy_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          paid_date?: string | null
          read_by_landlord?: boolean | null
          read_by_tenant?: boolean | null
          status?: string
          tenancy_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_tenancy_id_fkey"
            columns: ["tenancy_id"]
            isOneToOne: false
            referencedRelation: "tenancies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          currency_preference: string | null
          email: string | null
          first_name: string | null
          id: string
          invoice_info: Json | null
          last_name: string | null
          phone: string | null
          role: string
          settings: Json | null
          stripe_account_id: string | null
          subscription_end_date: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          subscription_start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_preference?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          invoice_info?: Json | null
          last_name?: string | null
          phone?: string | null
          role?: string
          settings?: Json | null
          stripe_account_id?: string | null
          subscription_end_date?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          subscription_start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_preference?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          invoice_info?: Json | null
          last_name?: string | null
          phone?: string | null
          role?: string
          settings?: Json | null
          stripe_account_id?: string | null
          subscription_end_date?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          subscription_start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          available_from: string | null
          created_at: string
          description: string | null
          id: string
          landlord_id: string
          monthly_rent: number
          name: string
          type: Database["public"]["Enums"]["property_type"]
          updated_at: string
        }
        Insert: {
          address: string
          available_from?: string | null
          created_at?: string
          description?: string | null
          id?: string
          landlord_id: string
          monthly_rent: number
          name: string
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
        }
        Update: {
          address?: string
          available_from?: string | null
          created_at?: string
          description?: string | null
          id?: string
          landlord_id?: string
          monthly_rent?: number
          name?: string
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
        }
        Relationships: []
      }
      scraping_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_run_at: string | null
          status: Database["public"]["Enums"]["scraping_status"]
          updated_at: string
          utility_provider_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_run_at?: string | null
          status?: Database["public"]["Enums"]["scraping_status"]
          updated_at?: string
          utility_provider_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_run_at?: string | null
          status?: Database["public"]["Enums"]["scraping_status"]
          updated_at?: string
          utility_provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scraping_jobs_utility_provider_id_fkey"
            columns: ["utility_provider_id"]
            isOneToOne: false
            referencedRelation: "utility_provider_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          id: string
          name: Database["public"]["Enums"]["subscription_plan"]
          price: number
          tenant_limit: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: Database["public"]["Enums"]["subscription_plan"]
          price: number
          tenant_limit: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: Database["public"]["Enums"]["subscription_plan"]
          price?: number
          tenant_limit?: number
          updated_at?: string
        }
        Relationships: []
      }
      tenancies: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          monthly_pay_day: number | null
          property_id: string
          start_date: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          monthly_pay_day?: number | null
          property_id: string
          start_date: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          monthly_pay_day?: number | null
          property_id?: string
          start_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenancies_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenancies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_audit_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["tenant_action_type"]
          created_at: string
          id: string
          landlord_id: string
          metadata: Json | null
          property_ids: string[]
          tenant_email: string | null
          tenant_id: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["tenant_action_type"]
          created_at?: string
          id?: string
          landlord_id: string
          metadata?: Json | null
          property_ids: string[]
          tenant_email?: string | null
          tenant_id?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["tenant_action_type"]
          created_at?: string
          id?: string
          landlord_id?: string
          metadata?: Json | null
          property_ids?: string[]
          tenant_email?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_audit_logs_landlord_fk"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_audit_logs_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_interactions: {
        Row: {
          created_at: string
          description: string
          id: string
          interaction_type: string
          landlord_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          interaction_type: string
          landlord_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          interaction_type?: string
          landlord_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_interactions_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_interactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_invitation_properties: {
        Row: {
          invitation_id: string
          property_id: string
        }
        Insert: {
          invitation_id: string
          property_id: string
        }
        Update: {
          invitation_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_invitation_properties_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "tenant_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitation_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_invitations: {
        Row: {
          created_at: string
          email: string
          end_date: string | null
          expiration_date: string
          first_name: string | null
          id: string
          last_name: string | null
          start_date: string
          status: string
          token: string
          updated_at: string
          used: boolean
        }
        Insert: {
          created_at?: string
          email: string
          end_date?: string | null
          expiration_date?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          start_date: string
          status?: string
          token: string
          updated_at?: string
          used?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          end_date?: string | null
          expiration_date?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          start_date?: string
          status?: string
          token?: string
          updated_at?: string
          used?: boolean
        }
        Relationships: []
      }
      tenant_observations: {
        Row: {
          created_at: string
          id: string
          landlord_id: string
          observation: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_id: string
          observation: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          landlord_id?: string
          observation?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_observations_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_observations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      utilities: {
        Row: {
          amount: number
          created_at: string
          currency: string
          due_date: string
          id: string
          property_id: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          due_date: string
          id?: string
          property_id: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          property_id?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "utilities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_invoices: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          invoice_number: string | null
          pdf_path: string | null
          status: string
          updated_at: string
          utility_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          invoice_number?: string | null
          pdf_path?: string | null
          status?: string
          updated_at?: string
          utility_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string | null
          pdf_path?: string | null
          status?: string
          updated_at?: string
          utility_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "utility_invoices_utility_id_fkey"
            columns: ["utility_id"]
            isOneToOne: false
            referencedRelation: "utilities"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_provider_credentials: {
        Row: {
          created_at: string
          encrypted_password: string
          end_day: number | null
          id: string
          landlord_id: string
          location_name: string | null
          property_id: string | null
          provider_name: string
          start_day: number | null
          updated_at: string
          username: string
          utility_type:
            | Database["public"]["Enums"]["utility_reading_type"]
            | null
        }
        Insert: {
          created_at?: string
          encrypted_password: string
          end_day?: number | null
          id?: string
          landlord_id: string
          location_name?: string | null
          property_id?: string | null
          provider_name: string
          start_day?: number | null
          updated_at?: string
          username: string
          utility_type?:
            | Database["public"]["Enums"]["utility_reading_type"]
            | null
        }
        Update: {
          created_at?: string
          encrypted_password?: string
          end_day?: number | null
          id?: string
          landlord_id?: string
          location_name?: string | null
          property_id?: string | null
          provider_name?: string
          start_day?: number | null
          updated_at?: string
          username?: string
          utility_type?:
            | Database["public"]["Enums"]["utility_reading_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "utility_provider_credentials_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_reading_periods: {
        Row: {
          created_at: string
          end_day: number
          id: string
          landlord_id: string
          property_id: string
          start_day: number
          updated_at: string
          utility_type: Database["public"]["Enums"]["utility_reading_type"]
        }
        Insert: {
          created_at?: string
          end_day: number
          id?: string
          landlord_id: string
          property_id: string
          start_day: number
          updated_at?: string
          utility_type: Database["public"]["Enums"]["utility_reading_type"]
        }
        Update: {
          created_at?: string
          end_day?: number
          id?: string
          landlord_id?: string
          property_id?: string
          start_day?: number
          updated_at?: string
          utility_type?: Database["public"]["Enums"]["utility_reading_type"]
        }
        Relationships: [
          {
            foreignKeyName: "utility_reading_periods_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_reading_periods_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_tenant_invitation: {
        Args: {
          invitation_id: string
        }
        Returns: undefined
      }
      generate_monthly_invoices: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_property_utility_stats: {
        Args: {
          property_id: string
        }
        Returns: Json
      }
      set_claim: {
        Args: {
          params: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      document_type: "lease_agreement" | "invoice" | "receipt" | "other"
      invoice_status: "pending" | "paid" | "overdue"
      maintenance_request_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
      meter_type: "electricity" | "water" | "gas"
      property_type: "Apartment" | "House" | "Condo" | "Commercial"
      scraping_status: "pending" | "in_progress" | "completed" | "failed"
      subscription_plan: "free" | "basic" | "premium" | "gold"
      tenant_action_type:
        | "invitation_sent"
        | "invitation_resent"
        | "invitation_accepted"
        | "tenant_assigned"
        | "tenancy_ended"
      utility_reading_type: "electricity" | "water" | "gas"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
