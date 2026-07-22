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
      branch_dispatch: {
        Row: {
          branch_name: string
          created_at: string | null
          dispatch_date: string | null
          dispatch_no: number
          id: string
          product_id: string | null
          qty: number | null
          updated_at: string | null
        }
        Insert: {
          branch_name: string
          created_at?: string | null
          dispatch_date?: string | null
          dispatch_no: number
          id?: string
          product_id?: string | null
          qty?: number | null
          updated_at?: string | null
        }
        Update: {
          branch_name?: string
          created_at?: string | null
          dispatch_date?: string | null
          dispatch_no?: number
          id?: string
          product_id?: string | null
          qty?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_dispatch_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_dispatch_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          type: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      cutting: {
        Row: {
          color_1_name: string | null
          color_1_qty: number | null
          color_2_name: string | null
          color_2_qty: number | null
          color_3_name: string | null
          color_3_qty: number | null
          color_4_name: string | null
          color_4_qty: number | null
          color_5_name: string | null
          color_5_qty: number | null
          color_6_name: string | null
          color_6_qty: number | null
          created_at: string | null
          id: string
          product_id: string | null
          start_date: string | null
          total_kg: number | null
          total_qty: number | null
          updated_at: string | null
        }
        Insert: {
          color_1_name?: string | null
          color_1_qty?: number | null
          color_2_name?: string | null
          color_2_qty?: number | null
          color_3_name?: string | null
          color_3_qty?: number | null
          color_4_name?: string | null
          color_4_qty?: number | null
          color_5_name?: string | null
          color_5_qty?: number | null
          color_6_name?: string | null
          color_6_qty?: number | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          start_date?: string | null
          total_kg?: number | null
          total_qty?: number | null
          updated_at?: string | null
        }
        Update: {
          color_1_name?: string | null
          color_1_qty?: number | null
          color_2_name?: string | null
          color_2_qty?: number | null
          color_3_name?: string | null
          color_3_qty?: number | null
          color_4_name?: string | null
          color_4_qty?: number | null
          color_5_name?: string | null
          color_5_qty?: number | null
          color_6_name?: string | null
          color_6_qty?: number | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          start_date?: string | null
          total_kg?: number | null
          total_qty?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cutting_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "product_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cutting_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      finishing: {
        Row: {
          completed_date: string | null
          created_at: string | null
          dispatch_ready_qty: number | null
          folding_qty: number | null
          id: string
          in_color_1_qty: number | null
          in_color_2_qty: number | null
          in_color_3_qty: number | null
          in_color_4_qty: number | null
          in_color_5_qty: number | null
          in_color_6_qty: number | null
          ironing_qty: number | null
          notes: string | null
          product_id: string | null
          received_qty: number | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          dispatch_ready_qty?: number | null
          folding_qty?: number | null
          id?: string
          in_color_1_qty?: number | null
          in_color_2_qty?: number | null
          in_color_3_qty?: number | null
          in_color_4_qty?: number | null
          in_color_5_qty?: number | null
          in_color_6_qty?: number | null
          ironing_qty?: number | null
          notes?: string | null
          product_id?: string | null
          received_qty?: number | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          dispatch_ready_qty?: number | null
          folding_qty?: number | null
          id?: string
          in_color_1_qty?: number | null
          in_color_2_qty?: number | null
          in_color_3_qty?: number | null
          in_color_4_qty?: number | null
          in_color_5_qty?: number | null
          in_color_6_qty?: number | null
          ironing_qty?: number | null
          notes?: string | null
          product_id?: string | null
          received_qty?: number | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finishing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "product_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finishing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      printing: {
        Row: {
          created_at: string | null
          id: string
          in_qty: number | null
          notes: string | null
          out_qty: number | null
          product_id: string | null
          recv_color_1_qty: number | null
          recv_color_2_qty: number | null
          recv_color_3_qty: number | null
          recv_color_4_qty: number | null
          recv_color_5_qty: number | null
          recv_color_6_qty: number | null
          recv_date: string | null
          sending_date: string | null
          short_qty: number | null
          status: string | null
          updated_at: string | null
          vendor_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          in_qty?: number | null
          notes?: string | null
          out_qty?: number | null
          product_id?: string | null
          recv_color_1_qty?: number | null
          recv_color_2_qty?: number | null
          recv_color_3_qty?: number | null
          recv_color_4_qty?: number | null
          recv_color_5_qty?: number | null
          recv_color_6_qty?: number | null
          recv_date?: string | null
          sending_date?: string | null
          short_qty?: number | null
          status?: string | null
          updated_at?: string | null
          vendor_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          in_qty?: number | null
          notes?: string | null
          out_qty?: number | null
          product_id?: string | null
          recv_color_1_qty?: number | null
          recv_color_2_qty?: number | null
          recv_color_3_qty?: number | null
          recv_color_4_qty?: number | null
          recv_color_5_qty?: number | null
          recv_color_6_qty?: number | null
          recv_date?: string | null
          sending_date?: string | null
          short_qty?: number | null
          status?: string | null
          updated_at?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "product_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_entries: {
        Row: {
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          cut_color_1: number | null
          cut_color_2: number | null
          cut_color_3: number | null
          cut_color_4: number | null
          cut_color_5: number | null
          design_code: string
          dispatch_retail_qty: number | null
          dispatch_wholesale_qty: number | null
          entry_date: string
          finished_goods_qty: number | null
          id: string
          is_deleted: boolean | null
          pe_received_qty: number | null
          pe_sending_qty: number | null
          pe_vendor_name: string | null
          product_id: string | null
          qc_alter_qty: number | null
          qc_output_qty: number | null
          qc_received_qty: number | null
          qc_reject_qty: number | null
          qc_spot_qty: number | null
          stock_cutting: number | null
          stock_short: number | null
          stock_swingline: number | null
          stock_warehouse: number | null
          swing_in_qty: number | null
          swing_out_qty: number | null
          swing_vendor_name: string | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          cut_color_1?: number | null
          cut_color_2?: number | null
          cut_color_3?: number | null
          cut_color_4?: number | null
          cut_color_5?: number | null
          design_code: string
          dispatch_retail_qty?: number | null
          dispatch_wholesale_qty?: number | null
          entry_date: string
          finished_goods_qty?: number | null
          id?: string
          is_deleted?: boolean | null
          pe_received_qty?: number | null
          pe_sending_qty?: number | null
          pe_vendor_name?: string | null
          product_id?: string | null
          qc_alter_qty?: number | null
          qc_output_qty?: number | null
          qc_received_qty?: number | null
          qc_reject_qty?: number | null
          qc_spot_qty?: number | null
          stock_cutting?: number | null
          stock_short?: number | null
          stock_swingline?: number | null
          stock_warehouse?: number | null
          swing_in_qty?: number | null
          swing_out_qty?: number | null
          swing_vendor_name?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          cut_color_1?: number | null
          cut_color_2?: number | null
          cut_color_3?: number | null
          cut_color_4?: number | null
          cut_color_5?: number | null
          design_code?: string
          dispatch_retail_qty?: number | null
          dispatch_wholesale_qty?: number | null
          entry_date?: string
          finished_goods_qty?: number | null
          id?: string
          is_deleted?: boolean | null
          pe_received_qty?: number | null
          pe_sending_qty?: number | null
          pe_vendor_name?: string | null
          product_id?: string | null
          qc_alter_qty?: number | null
          qc_output_qty?: number | null
          qc_received_qty?: number | null
          qc_reject_qty?: number | null
          qc_spot_qty?: number | null
          stock_cutting?: number | null
          stock_short?: number | null
          stock_swingline?: number | null
          stock_warehouse?: number | null
          swing_in_qty?: number | null
          swing_out_qty?: number | null
          swing_vendor_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_entries_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          complete_date: string | null
          created_at: string | null
          current_stage: string | null
          id: string
          image_url: string | null
          is_deleted: boolean | null
          notes: string | null
          product_code: string
          product_name: string
          production_start_date: string | null
          target_dispatch_date: string | null
          target_qty: number | null
          updated_at: string | null
        }
        Insert: {
          complete_date?: string | null
          created_at?: string | null
          current_stage?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          notes?: string | null
          product_code: string
          product_name: string
          production_start_date?: string | null
          target_dispatch_date?: string | null
          target_qty?: number | null
          updated_at?: string | null
        }
        Update: {
          complete_date?: string | null
          created_at?: string | null
          current_stage?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          notes?: string | null
          product_code?: string
          product_name?: string
          production_start_date?: string | null
          target_dispatch_date?: string | null
          target_qty?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      qc: {
        Row: {
          alter_qty: number | null
          created_at: string | null
          id: string
          in_qty: number | null
          out_qty: number | null
          product_id: string | null
          reject_qty: number | null
          spot_qty: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          alter_qty?: number | null
          created_at?: string | null
          id?: string
          in_qty?: number | null
          out_qty?: number | null
          product_id?: string | null
          reject_qty?: number | null
          spot_qty?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          alter_qty?: number | null
          created_at?: string | null
          id?: string
          in_qty?: number | null
          out_qty?: number | null
          product_id?: string | null
          reject_qty?: number | null
          spot_qty?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qc_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "product_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sewing: {
        Row: {
          created_at: string | null
          id: string
          in_qty: number | null
          out_qty: number | null
          product_id: string | null
          recv_color_1_qty: number | null
          recv_color_2_qty: number | null
          recv_color_3_qty: number | null
          recv_color_4_qty: number | null
          recv_color_5_qty: number | null
          recv_color_6_qty: number | null
          sending_date: string | null
          short_qty: number | null
          status: string | null
          updated_at: string | null
          vendor_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          in_qty?: number | null
          out_qty?: number | null
          product_id?: string | null
          recv_color_1_qty?: number | null
          recv_color_2_qty?: number | null
          recv_color_3_qty?: number | null
          recv_color_4_qty?: number | null
          recv_color_5_qty?: number | null
          recv_color_6_qty?: number | null
          sending_date?: string | null
          short_qty?: number | null
          status?: string | null
          updated_at?: string | null
          vendor_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          in_qty?: number | null
          out_qty?: number | null
          product_id?: string | null
          recv_color_1_qty?: number | null
          recv_color_2_qty?: number | null
          recv_color_3_qty?: number | null
          recv_color_4_qty?: number | null
          recv_color_5_qty?: number | null
          recv_color_6_qty?: number | null
          sending_date?: string | null
          short_qty?: number | null
          status?: string | null
          updated_at?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sewing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "product_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sewing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vendors: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          is_deleted: boolean | null
          name: string
          type: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          name: string
          type?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      warehouse_stock: {
        Row: {
          color_1_name: string | null
          color_1_qty: number | null
          color_2_name: string | null
          color_2_qty: number | null
          color_3_name: string | null
          color_3_qty: number | null
          color_4_name: string | null
          color_4_qty: number | null
          color_5_name: string | null
          color_5_qty: number | null
          color_6_name: string | null
          color_6_qty: number | null
          created_at: string | null
          id: string
          product_id: string | null
          total_qty: number | null
          updated_at: string | null
        }
        Insert: {
          color_1_name?: string | null
          color_1_qty?: number | null
          color_2_name?: string | null
          color_2_qty?: number | null
          color_3_name?: string | null
          color_3_qty?: number | null
          color_4_name?: string | null
          color_4_qty?: number | null
          color_5_name?: string | null
          color_5_qty?: number | null
          color_6_name?: string | null
          color_6_qty?: number | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          total_qty?: number | null
          updated_at?: string | null
        }
        Update: {
          color_1_name?: string | null
          color_1_qty?: number | null
          color_2_name?: string | null
          color_2_qty?: number | null
          color_3_name?: string | null
          color_3_qty?: number | null
          color_4_name?: string | null
          color_4_qty?: number | null
          color_5_name?: string | null
          color_5_qty?: number | null
          color_6_name?: string | null
          color_6_qty?: number | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          total_qty?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "product_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      monthly_summary: {
        Row: {
          branch_id: string | null
          month: string | null
          stock_cutting: number | null
          stock_short: number | null
          stock_swingline: number | null
          stock_warehouse: number | null
          total_alter: number | null
          total_cutting: number | null
          total_finished: number | null
          total_pe_received: number | null
          total_pe_sending: number | null
          total_qc_output: number | null
          total_qc_received: number | null
          total_reject: number | null
          total_retail: number | null
          total_spot: number | null
          total_swing_in: number | null
          total_swing_out: number | null
          total_wholesale: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_entries_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      product_summary: {
        Row: {
          complete_date: string | null
          created_at: string | null
          current_stage: string | null
          cutting_total_kg: number | null
          cutting_total_qty: number | null
          finishing_qty: number | null
          id: string | null
          image_url: string | null
          notes: string | null
          print_status: string | null
          product_code: string | null
          product_name: string | null
          production_start_date: string | null
          qc_out_qty: number | null
          qc_reject_qty: number | null
          qc_status: string | null
          sew_status: string | null
          stock_total: number | null
          total_dispatched: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_role: { Args: never; Returns: string }
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
