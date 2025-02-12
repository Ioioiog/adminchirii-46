
import { Json } from './json';
import { Property } from './property';
import { Profile } from './profile';
import { Document } from './document';
import { Maintenance } from './maintenance';
import { Payment } from './payment';
import { Tenant } from './tenant';
import { Utility } from './utility';
import { SetClaimParams } from './rpc';

export interface Database {
  public: {
    Tables: {
      documents: Document;
      maintenance_requests: Maintenance;
      payments: Payment;
      profiles: Profile;
      properties: Property;
      tenancies: Tenant;
      tenant_invitations: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          property_id: string;
          token: string;
          status: string;
          start_date: string;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          property_id: string;
          token: string;
          status?: string;
          start_date: string;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          property_id?: string;
          token?: string;
          status?: string;
          start_date?: string;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      utilities: Utility;
      video_signals: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          signal_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          signal_data: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          signal_data?: Json;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      set_claim: {
        Args: SetClaimParams;
        Returns: void;
      };
    };
    Enums: {
      property_type: "Apartment" | "House" | "Condo" | "Commercial";
    };
  };
}
