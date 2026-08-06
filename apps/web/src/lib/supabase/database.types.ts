export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: "USER" | "DEVELOPER";
          theme: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: "USER" | "DEVELOPER";
          theme?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: "USER" | "DEVELOPER";
          theme?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      devices: {
        Row: {
          id: string;
          name: string;
          device_key: string;
          status: "ONLINE" | "OFFLINE";
          wifi_ssid: string | null;
          ip_address: string | null;
          firmware_version: string | null;
          last_seen: string | null;
          smoke_threshold: number;
          smoke_calibration: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          device_key: string;
          status?: "ONLINE" | "OFFLINE";
          wifi_ssid?: string | null;
          ip_address?: string | null;
          firmware_version?: string | null;
          last_seen?: string | null;
          smoke_threshold?: number;
          smoke_calibration?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          device_key?: string;
          status?: "ONLINE" | "OFFLINE";
          wifi_ssid?: string | null;
          ip_address?: string | null;
          firmware_version?: string | null;
          last_seen?: string | null;
          smoke_threshold?: number;
          smoke_calibration?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sensor_readings: {
        Row: {
          id: string;
          device_id: string;
          smoke_level: number;
          flame_detected: boolean;
          temperature: number | null;
          humidity: number | null;
          buzzer_active: boolean;
          led_status: string;
          alarm_active: boolean;
          lcd_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          smoke_level: number;
          flame_detected?: boolean;
          temperature?: number | null;
          humidity?: number | null;
          buzzer_active?: boolean;
          led_status?: string;
          alarm_active?: boolean;
          lcd_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          smoke_level?: number;
          flame_detected?: boolean;
          temperature?: number | null;
          humidity?: number | null;
          buzzer_active?: boolean;
          led_status?: string;
          alarm_active?: boolean;
          lcd_message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sensor_readings_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
        ];
      };
      alerts: {
        Row: {
          id: string;
          device_id: string;
          type: "FIRE" | "SMOKE" | "SYSTEM" | "SMS";
          severity: "INFO" | "WARNING" | "CRITICAL";
          title: string;
          message: string;
          sms_status: "PENDING" | "SENT" | "FAILED" | "NONE";
          acknowledged: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          type: "FIRE" | "SMOKE" | "SYSTEM" | "SMS";
          severity: "INFO" | "WARNING" | "CRITICAL";
          title: string;
          message: string;
          sms_status?: "PENDING" | "SENT" | "FAILED" | "NONE";
          acknowledged?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          type?: "FIRE" | "SMOKE" | "SYSTEM" | "SMS";
          severity?: "INFO" | "WARNING" | "CRITICAL";
          title?: string;
          message?: string;
          sms_status?: "PENDING" | "SENT" | "FAILED" | "NONE";
          acknowledged?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alerts_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
        ];
      };
      connection_logs: {
        Row: {
          id: string;
          device_id: string;
          event: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          event: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          event?: string;
          message?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "connection_logs_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "USER" | "DEVELOPER";
      device_status: "ONLINE" | "OFFLINE";
      alert_type: "FIRE" | "SMOKE" | "SYSTEM" | "SMS";
      alert_severity: "INFO" | "WARNING" | "CRITICAL";
      sms_status: "PENDING" | "SENT" | "FAILED" | "NONE";
    };
    CompositeTypes: Record<string, never>;
  };
};
