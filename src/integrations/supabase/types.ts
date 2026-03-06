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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      areas: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          district_id: string | null
          id: string
          is_active: boolean
          name: string
          police_station_id: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          district_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          police_station_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          district_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          police_station_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_police_station_id_fkey"
            columns: ["police_station_id"]
            isOneToOne: false
            referencedRelation: "police_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      bandwidth_history: {
        Row: {
          bytes_in: number | null
          bytes_out: number | null
          created_at: string
          download_bytes: number | null
          download_rate_bps: number | null
          id: string
          radius_user_id: string | null
          recorded_at: string
          session_uptime: string | null
          upload_bytes: number | null
          upload_rate_bps: number | null
        }
        Insert: {
          bytes_in?: number | null
          bytes_out?: number | null
          created_at?: string
          download_bytes?: number | null
          download_rate_bps?: number | null
          id?: string
          radius_user_id?: string | null
          recorded_at?: string
          session_uptime?: string | null
          upload_bytes?: number | null
          upload_rate_bps?: number | null
        }
        Update: {
          bytes_in?: number | null
          bytes_out?: number | null
          created_at?: string
          download_bytes?: number | null
          download_rate_bps?: number | null
          id?: string
          radius_user_id?: string | null
          recorded_at?: string
          session_uptime?: string | null
          upload_bytes?: number | null
          upload_rate_bps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bandwidth_history_radius_user_id_fkey"
            columns: ["radius_user_id"]
            isOneToOne: false
            referencedRelation: "radius_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bandwidth_history_radius_user_id_fkey"
            columns: ["radius_user_id"]
            isOneToOne: false
            referencedRelation: "radius_users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_plans: {
        Row: {
          created_at: string
          data_limit_mb: number | null
          description: string | null
          download_speed_kbps: number | null
          duration_days: number | null
          id: string
          is_active: boolean
          name: string
          price: number
          service_type: string
          speed: string | null
          type: string | null
          updated_at: string
          upload_speed_kbps: number | null
        }
        Insert: {
          created_at?: string
          data_limit_mb?: number | null
          description?: string | null
          download_speed_kbps?: number | null
          duration_days?: number | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          service_type?: string
          speed?: string | null
          type?: string | null
          updated_at?: string
          upload_speed_kbps?: number | null
        }
        Update: {
          created_at?: string
          data_limit_mb?: number | null
          description?: string | null
          download_speed_kbps?: number | null
          duration_days?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          service_type?: string
          speed?: string | null
          type?: string | null
          updated_at?: string
          upload_speed_kbps?: number | null
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          manager_name: string | null
          name: string
          phone: string | null
          reseller_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          manager_name?: string | null
          name: string
          phone?: string | null
          reseller_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          manager_name?: string | null
          name?: string
          phone?: string | null
          reseller_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      connectivity_types: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      device_change_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          new_connectivity_type: string | null
          new_device: string | null
          new_mac_serial: string | null
          old_connectivity_type: string | null
          old_device: string | null
          old_mac_serial: string | null
          radius_user_id: string
          reason: string | null
          rejection_reason: string | null
          requested_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          new_connectivity_type?: string | null
          new_device?: string | null
          new_mac_serial?: string | null
          old_connectivity_type?: string | null
          old_device?: string | null
          old_mac_serial?: string | null
          radius_user_id: string
          reason?: string | null
          rejection_reason?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          new_connectivity_type?: string | null
          new_device?: string | null
          new_mac_serial?: string | null
          old_connectivity_type?: string | null
          old_device?: string | null
          old_mac_serial?: string | null
          radius_user_id?: string
          reason?: string | null
          rejection_reason?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_change_requests_radius_user_id_fkey"
            columns: ["radius_user_id"]
            isOneToOne: false
            referencedRelation: "radius_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_change_requests_radius_user_id_fkey"
            columns: ["radius_user_id"]
            isOneToOne: false
            referencedRelation: "radius_users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          address: string | null
          created_at: string
          department: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          employee_id: string
          full_name: string
          hire_date: string | null
          id: string
          phone: string | null
          photo_url: string | null
          position: string | null
          salary: number
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          employee_id: string
          full_name: string
          hire_date?: string | null
          id?: string
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          salary?: number
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          employee_id?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          salary?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          added_by: string | null
          amount: number
          category: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      income: {
        Row: {
          added_by: string | null
          amount: number
          category: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      income_categories: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      login_activity: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          login_method: string | null
          success: boolean
          user_agent: string | null
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          login_method?: string | null
          success?: boolean
          user_agent?: string | null
          user_email: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          login_method?: string | null
          success?: boolean
          user_agent?: string | null
          user_email?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      mikrotik_routers: {
        Row: {
          connection_mode: string
          created_at: string
          description: string | null
          host: string
          id: string
          is_active: boolean
          name: string
          password: string
          port: number
          updated_at: string
          use_ssl: boolean
          username: string
        }
        Insert: {
          connection_mode?: string
          created_at?: string
          description?: string | null
          host: string
          id?: string
          is_active?: boolean
          name: string
          password: string
          port?: number
          updated_at?: string
          use_ssl?: boolean
          username: string
        }
        Update: {
          connection_mode?: string
          created_at?: string
          description?: string | null
          host?: string
          id?: string
          is_active?: boolean
          name?: string
          password?: string
          port?: number
          updated_at?: string
          use_ssl?: boolean
          username?: string
        }
        Relationships: []
      }
      mikrotik_sync_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          error_message: string | null
          id: string
          radius_user_id: string | null
          request_data: Json | null
          response_data: Json | null
          status: string
          success: boolean | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          radius_user_id?: string | null
          request_data?: Json | null
          response_data?: Json | null
          status?: string
          success?: boolean | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          radius_user_id?: string | null
          request_data?: Json | null
          response_data?: Json | null
          status?: string
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "mikrotik_sync_log_radius_user_id_fkey"
            columns: ["radius_user_id"]
            isOneToOne: false
            referencedRelation: "radius_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mikrotik_sync_log_radius_user_id_fkey"
            columns: ["radius_user_id"]
            isOneToOne: false
            referencedRelation: "radius_users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      police_stations: {
        Row: {
          address: string | null
          code: string | null
          created_at: string
          district_id: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string
          district_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string
          district_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "police_stations_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          code: string | null
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      radius_users: {
        Row: {
          address_details: string | null
          area_id: string | null
          auto_renew: boolean | null
          billing_cycle: string | null
          billing_type: string | null
          connection_date: string | null
          connection_fee: number | null
          connectivity_type: string | null
          created_at: string
          created_by: string | null
          customer_type: string | null
          data_used_mb: number | null
          device: string | null
          district_id: string | null
          email: string | null
          expires_at: string | null
          father_name: string | null
          full_name: string | null
          gender: string | null
          grace_days_used: number | null
          id: string
          ip_address: string | null
          last_login_at: string | null
          mac_address: string | null
          mac_locked: boolean | null
          mac_serial: string | null
          mikrotik_router_id: string | null
          mikrotik_synced: boolean
          monthly_bill: number | null
          nid_number: string | null
          password_hash: string
          phone: string | null
          plan_id: string | null
          police_station_id: string | null
          reseller_id: string | null
          reseller_office: string | null
          service_type: string
          status: string
          updated_at: string
          username: string
        }
        Insert: {
          address_details?: string | null
          area_id?: string | null
          auto_renew?: boolean | null
          billing_cycle?: string | null
          billing_type?: string | null
          connection_date?: string | null
          connection_fee?: number | null
          connectivity_type?: string | null
          created_at?: string
          created_by?: string | null
          customer_type?: string | null
          data_used_mb?: number | null
          device?: string | null
          district_id?: string | null
          email?: string | null
          expires_at?: string | null
          father_name?: string | null
          full_name?: string | null
          gender?: string | null
          grace_days_used?: number | null
          id?: string
          ip_address?: string | null
          last_login_at?: string | null
          mac_address?: string | null
          mac_locked?: boolean | null
          mac_serial?: string | null
          mikrotik_router_id?: string | null
          mikrotik_synced?: boolean
          monthly_bill?: number | null
          nid_number?: string | null
          password_hash: string
          phone?: string | null
          plan_id?: string | null
          police_station_id?: string | null
          reseller_id?: string | null
          reseller_office?: string | null
          service_type?: string
          status?: string
          updated_at?: string
          username: string
        }
        Update: {
          address_details?: string | null
          area_id?: string | null
          auto_renew?: boolean | null
          billing_cycle?: string | null
          billing_type?: string | null
          connection_date?: string | null
          connection_fee?: number | null
          connectivity_type?: string | null
          created_at?: string
          created_by?: string | null
          customer_type?: string | null
          data_used_mb?: number | null
          device?: string | null
          district_id?: string | null
          email?: string | null
          expires_at?: string | null
          father_name?: string | null
          full_name?: string | null
          gender?: string | null
          grace_days_used?: number | null
          id?: string
          ip_address?: string | null
          last_login_at?: string | null
          mac_address?: string | null
          mac_locked?: boolean | null
          mac_serial?: string | null
          mikrotik_router_id?: string | null
          mikrotik_synced?: boolean
          monthly_bill?: number | null
          nid_number?: string | null
          password_hash?: string
          phone?: string | null
          plan_id?: string | null
          police_station_id?: string | null
          reseller_id?: string | null
          reseller_office?: string | null
          service_type?: string
          status?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "radius_users_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radius_users_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radius_users_mikrotik_router_id_fkey"
            columns: ["mikrotik_router_id"]
            isOneToOne: false
            referencedRelation: "mikrotik_routers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radius_users_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radius_users_police_station_id_fkey"
            columns: ["police_station_id"]
            isOneToOne: false
            referencedRelation: "police_stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radius_users_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_credits: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          description: string | null
          id: string
          payment_method: string | null
          reseller_id: string
          type: string
        }
        Insert: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          reseller_id: string
          type?: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          reseller_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reseller_credits_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_plan_commissions: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          is_active: boolean
          plan_id: string
          reseller_id: string
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          plan_id: string
          reseller_id: string
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          plan_id?: string
          reseller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reseller_plan_commissions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseller_plan_commissions_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_user_recharges: {
        Row: {
          amount: number
          commission_amount: number
          commission_rate: number
          created_at: string
          description: string | null
          id: string
          plan_id: string | null
          radius_user_id: string
          reseller_id: string
          status: string
        }
        Insert: {
          amount?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          description?: string | null
          id?: string
          plan_id?: string | null
          radius_user_id: string
          reseller_id: string
          status?: string
        }
        Update: {
          amount?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          description?: string | null
          id?: string
          plan_id?: string | null
          radius_user_id?: string
          reseller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reseller_user_recharges_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseller_user_recharges_radius_user_id_fkey"
            columns: ["radius_user_id"]
            isOneToOne: false
            referencedRelation: "radius_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseller_user_recharges_radius_user_id_fkey"
            columns: ["radius_user_id"]
            isOneToOne: false
            referencedRelation: "radius_users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseller_user_recharges_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          login_password: string | null
          login_user_id: string | null
          phone: string | null
          reseller_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          login_password?: string | null
          login_user_id?: string | null
          phone?: string | null
          reseller_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          login_password?: string | null
          login_user_id?: string | null
          phone?: string | null
          reseller_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reseller_users_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      resellers: {
        Row: {
          address: string | null
          balance: number
          code: string | null
          commission_rate: number | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          login_password: string | null
          login_user_id: string | null
          name: string
          phone: string | null
          role_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          balance?: number
          code?: string | null
          commission_rate?: number | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          login_password?: string | null
          login_user_id?: string | null
          name: string
          phone?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          balance?: number
          code?: string | null
          commission_rate?: number | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          login_password?: string | null
          login_user_id?: string | null
          name?: string
          phone?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_definitions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          permissions: Json
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          permissions?: Json
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          permissions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      salary_payments: {
        Row: {
          base_salary: number
          bonus: number | null
          created_at: string
          deductions: number | null
          employee_id: string
          id: string
          net_salary: number
          notes: string | null
          payment_date: string
          payment_method: string | null
          status: string
          updated_at: string
        }
        Insert: {
          base_salary?: number
          bonus?: number | null
          created_at?: string
          deductions?: number | null
          employee_id: string
          id?: string
          net_salary?: number
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          base_salary?: number
          bonus?: number | null
          created_at?: string
          deductions?: number | null
          employee_id?: string
          id?: string
          net_salary?: number
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_payments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      shareholders: {
        Row: {
          business_percent: number
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          business_percent?: number
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          business_percent?: number
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sms_history: {
        Row: {
          api_response: Json | null
          created_at: string
          id: string
          message: string
          radius_user_id: string | null
          recipient_name: string | null
          recipient_phone: string
          sent_by: string | null
          sms_type: string
          status: string
        }
        Insert: {
          api_response?: Json | null
          created_at?: string
          id?: string
          message: string
          radius_user_id?: string | null
          recipient_name?: string | null
          recipient_phone: string
          sent_by?: string | null
          sms_type?: string
          status?: string
        }
        Update: {
          api_response?: Json | null
          created_at?: string
          id?: string
          message?: string
          radius_user_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string
          sent_by?: string | null
          sms_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_history_radius_user_id_fkey"
            columns: ["radius_user_id"]
            isOneToOne: false
            referencedRelation: "radius_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_history_radius_user_id_fkey"
            columns: ["radius_user_id"]
            isOneToOne: false
            referencedRelation: "radius_users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      software_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          login_user_id: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          login_user_id?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          login_user_id?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_activity: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          user_email: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          user_email?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          collected_by: string | null
          created_at: string
          description: string | null
          id: string
          is_auto_generated: boolean | null
          payment_method: string | null
          radius_user_id: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          collected_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_auto_generated?: boolean | null
          payment_method?: string | null
          radius_user_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          collected_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_auto_generated?: boolean | null
          payment_method?: string | null
          radius_user_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_radius_user_id_fkey"
            columns: ["radius_user_id"]
            isOneToOne: false
            referencedRelation: "radius_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_radius_user_id_fkey"
            columns: ["radius_user_id"]
            isOneToOne: false
            referencedRelation: "radius_users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      user_requests: {
        Row: {
          address_details: string | null
          area_id: string | null
          connection_fee: number | null
          created_at: string
          customer_type: string | null
          district_id: string | null
          father_name: string | null
          full_name: string
          gender: string | null
          id: string
          mikrotik_router_id: string | null
          mikrotik_username: string
          monthly_bill: number | null
          nid_number: string | null
          phone: string
          plan_id: string | null
          police_station_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address_details?: string | null
          area_id?: string | null
          connection_fee?: number | null
          created_at?: string
          customer_type?: string | null
          district_id?: string | null
          father_name?: string | null
          full_name: string
          gender?: string | null
          id?: string
          mikrotik_router_id?: string | null
          mikrotik_username: string
          monthly_bill?: number | null
          nid_number?: string | null
          phone: string
          plan_id?: string | null
          police_station_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address_details?: string | null
          area_id?: string | null
          connection_fee?: number | null
          created_at?: string
          customer_type?: string | null
          district_id?: string | null
          father_name?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          mikrotik_router_id?: string | null
          mikrotik_username?: string
          monthly_bill?: number | null
          nid_number?: string | null
          phone?: string
          plan_id?: string | null
          police_station_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_requests_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_requests_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_requests_mikrotik_router_id_fkey"
            columns: ["mikrotik_router_id"]
            isOneToOne: false
            referencedRelation: "mikrotik_routers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_requests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_requests_police_station_id_fkey"
            columns: ["police_station_id"]
            isOneToOne: false
            referencedRelation: "police_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          activated_at: string | null
          code: string
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string | null
          status: string
          used_by: string | null
        }
        Insert: {
          activated_at?: string | null
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          status?: string
          used_by?: string | null
        }
        Update: {
          activated_at?: string | null
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          status?: string
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      radius_users_safe: {
        Row: {
          address_details: string | null
          area_id: string | null
          auto_renew: boolean | null
          billing_cycle: string | null
          billing_type: string | null
          connection_date: string | null
          connection_fee: number | null
          connectivity_type: string | null
          created_at: string | null
          created_by: string | null
          customer_type: string | null
          data_used_mb: number | null
          device: string | null
          district_id: string | null
          email: string | null
          expires_at: string | null
          father_name: string | null
          full_name: string | null
          gender: string | null
          grace_days_used: number | null
          id: string | null
          ip_address: string | null
          last_login_at: string | null
          mac_address: string | null
          mac_locked: boolean | null
          mac_serial: string | null
          mikrotik_router_id: string | null
          mikrotik_synced: boolean | null
          monthly_bill: number | null
          nid_number: string | null
          phone: string | null
          plan_id: string | null
          police_station_id: string | null
          reseller_id: string | null
          reseller_office: string | null
          service_type: string | null
          status: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          address_details?: string | null
          area_id?: string | null
          auto_renew?: boolean | null
          billing_cycle?: string | null
          billing_type?: string | null
          connection_date?: string | null
          connection_fee?: number | null
          connectivity_type?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_type?: string | null
          data_used_mb?: number | null
          device?: string | null
          district_id?: string | null
          email?: string | null
          expires_at?: string | null
          father_name?: string | null
          full_name?: string | null
          gender?: string | null
          grace_days_used?: number | null
          id?: string | null
          ip_address?: string | null
          last_login_at?: string | null
          mac_address?: string | null
          mac_locked?: boolean | null
          mac_serial?: string | null
          mikrotik_router_id?: string | null
          mikrotik_synced?: boolean | null
          monthly_bill?: number | null
          nid_number?: string | null
          phone?: string | null
          plan_id?: string | null
          police_station_id?: string | null
          reseller_id?: string | null
          reseller_office?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          address_details?: string | null
          area_id?: string | null
          auto_renew?: boolean | null
          billing_cycle?: string | null
          billing_type?: string | null
          connection_date?: string | null
          connection_fee?: number | null
          connectivity_type?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_type?: string | null
          data_used_mb?: number | null
          device?: string | null
          district_id?: string | null
          email?: string | null
          expires_at?: string | null
          father_name?: string | null
          full_name?: string | null
          gender?: string | null
          grace_days_used?: number | null
          id?: string | null
          ip_address?: string | null
          last_login_at?: string | null
          mac_address?: string | null
          mac_locked?: boolean | null
          mac_serial?: string | null
          mikrotik_router_id?: string | null
          mikrotik_synced?: boolean | null
          monthly_bill?: number | null
          nid_number?: string | null
          phone?: string | null
          plan_id?: string | null
          police_station_id?: string | null
          reseller_id?: string | null
          reseller_office?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "radius_users_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radius_users_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radius_users_mikrotik_router_id_fkey"
            columns: ["mikrotik_router_id"]
            isOneToOne: false
            referencedRelation: "mikrotik_routers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radius_users_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radius_users_police_station_id_fkey"
            columns: ["police_station_id"]
            isOneToOne: false
            referencedRelation: "police_stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radius_users_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
