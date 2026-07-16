// Gerado a partir do schema do Supabase via `supabase gen types typescript`.
// Regenerar após cada migration (mcp Supabase generate_typescript_types ou
// `supabase gen types typescript --project-id mgkqfzkqsrmfjpxepane`).
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
      comandas: {
        Row: {
          aberta_em: string
          fechada_em: string | null
          garcom_id: string
          id: string
          mesa_id: string | null
          participante_sessao_id: string | null
          status: Database["public"]["Enums"]["comanda_status"]
        }
        Insert: {
          aberta_em?: string
          fechada_em?: string | null
          garcom_id: string
          id?: string
          mesa_id?: string | null
          participante_sessao_id?: string | null
          status?: Database["public"]["Enums"]["comanda_status"]
        }
        Update: {
          aberta_em?: string
          fechada_em?: string | null
          garcom_id?: string
          id?: string
          mesa_id?: string | null
          participante_sessao_id?: string | null
          status?: Database["public"]["Enums"]["comanda_status"]
        }
        Relationships: [
          {
            foreignKeyName: "comandas_garcom_id_fkey"
            columns: ["garcom_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_participante_sessao_id_fkey"
            columns: ["participante_sessao_id"]
            isOneToOne: false
            referencedRelation: "participantes_sessao"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_comanda: {
        Row: {
          cancelado: boolean
          comanda_id: string
          id: string
          lancado_em: string
          lancado_por: string
          motivo_cancelamento: string | null
          pedido_id: string
          preco_unitario_no_momento: number
          produto_id: string
          quantidade: number
        }
        Insert: {
          cancelado?: boolean
          comanda_id: string
          id?: string
          lancado_em?: string
          lancado_por: string
          motivo_cancelamento?: string | null
          pedido_id: string
          preco_unitario_no_momento: number
          produto_id: string
          quantidade: number
        }
        Update: {
          cancelado?: boolean
          comanda_id?: string
          id?: string
          lancado_em?: string
          lancado_por?: string
          motivo_cancelamento?: string | null
          pedido_id?: string
          preco_unitario_no_momento?: number
          produto_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_comanda_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_comanda_lancado_por_fkey"
            columns: ["lancado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_comanda_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_comanda_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      mesas: {
        Row: {
          criado_em: string
          id: string
          numero: number
          status: Database["public"]["Enums"]["mesa_status"]
        }
        Insert: {
          criado_em?: string
          id?: string
          numero: number
          status?: Database["public"]["Enums"]["mesa_status"]
        }
        Update: {
          criado_em?: string
          id?: string
          numero?: number
          status?: Database["public"]["Enums"]["mesa_status"]
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          comanda_id: string
          confirmado_em: string | null
          criado_em: string
          id: string
          metodo: Database["public"]["Enums"]["pagamento_metodo"]
          mp_payment_id: string | null
          qr_code_base64: string | null
          status: Database["public"]["Enums"]["pagamento_status"]
          taxa_servico_valor: number
          valor: number
        }
        Insert: {
          comanda_id: string
          confirmado_em?: string | null
          criado_em?: string
          id?: string
          metodo: Database["public"]["Enums"]["pagamento_metodo"]
          mp_payment_id?: string | null
          qr_code_base64?: string | null
          status?: Database["public"]["Enums"]["pagamento_status"]
          taxa_servico_valor?: number
          valor: number
        }
        Update: {
          comanda_id?: string
          confirmado_em?: string | null
          criado_em?: string
          id?: string
          metodo?: Database["public"]["Enums"]["pagamento_metodo"]
          mp_payment_id?: string | null
          qr_code_base64?: string | null
          status?: Database["public"]["Enums"]["pagamento_status"]
          taxa_servico_valor?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
        ]
      }
      participantes_sessao: {
        Row: {
          buy_in_inicial: number
          criado_em: string
          id: string
          nome_jogador: string
          sessao_id: string
          status: Database["public"]["Enums"]["participante_status"]
          valor_cashout: number | null
        }
        Insert: {
          buy_in_inicial: number
          criado_em?: string
          id?: string
          nome_jogador: string
          sessao_id: string
          status?: Database["public"]["Enums"]["participante_status"]
          valor_cashout?: number | null
        }
        Update: {
          buy_in_inicial?: number
          criado_em?: string
          id?: string
          nome_jogador?: string
          sessao_id?: string
          status?: Database["public"]["Enums"]["participante_status"]
          valor_cashout?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "participantes_sessao_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes_poker"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          comanda_id: string
          enviado_em: string
          id: string
          setor_destino: Database["public"]["Enums"]["produto_setor"]
          status: Database["public"]["Enums"]["pedido_status"]
        }
        Insert: {
          comanda_id: string
          enviado_em?: string
          id?: string
          setor_destino: Database["public"]["Enums"]["produto_setor"]
          status?: Database["public"]["Enums"]["pedido_status"]
        }
        Update: {
          comanda_id?: string
          enviado_em?: string
          id?: string
          setor_destino?: Database["public"]["Enums"]["produto_setor"]
          status?: Database["public"]["Enums"]["pedido_status"]
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria: string
          disponivel: boolean
          id: string
          nome: string
          preco: number
          setor_destino: Database["public"]["Enums"]["produto_setor"]
        }
        Insert: {
          categoria: string
          disponivel?: boolean
          id?: string
          nome: string
          preco: number
          setor_destino: Database["public"]["Enums"]["produto_setor"]
        }
        Update: {
          categoria?: string
          disponivel?: boolean
          id?: string
          nome?: string
          preco?: number
          setor_destino?: Database["public"]["Enums"]["produto_setor"]
        }
        Relationships: []
      }
      rebuys: {
        Row: {
          criado_em: string
          id: string
          participante_sessao_id: string
          registrado_por: string
          valor: number
        }
        Insert: {
          criado_em?: string
          id?: string
          participante_sessao_id: string
          registrado_por: string
          valor: number
        }
        Update: {
          criado_em?: string
          id?: string
          participante_sessao_id?: string
          registrado_por?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "rebuys_participante_sessao_id_fkey"
            columns: ["participante_sessao_id"]
            isOneToOne: false
            referencedRelation: "participantes_sessao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rebuys_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes_poker: {
        Row: {
          buy_in_valor: number
          criado_em: string
          data_fim: string | null
          data_inicio: string
          id: string
          nome: string
          rake_total: number | null
          status: Database["public"]["Enums"]["sessao_status"]
          taxa_casa_percentual: number
          taxa_casa_por_hora: number | null
          tipo: Database["public"]["Enums"]["sessao_tipo"]
        }
        Insert: {
          buy_in_valor: number
          criado_em?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          nome: string
          rake_total?: number | null
          status?: Database["public"]["Enums"]["sessao_status"]
          taxa_casa_percentual?: number
          taxa_casa_por_hora?: number | null
          tipo: Database["public"]["Enums"]["sessao_tipo"]
        }
        Update: {
          buy_in_valor?: number
          criado_em?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          nome?: string
          rake_total?: number | null
          status?: Database["public"]["Enums"]["sessao_status"]
          taxa_casa_percentual?: number
          taxa_casa_por_hora?: number | null
          tipo?: Database["public"]["Enums"]["sessao_tipo"]
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          ativo: boolean
          criado_em: string
          email: string
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          email: string
          id: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          email?: string
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      enviar_pedido: {
        Args: { p_comanda_id: string; p_itens: Json }
        Returns: undefined
      }
    }
    Enums: {
      comanda_status: "aberta" | "aguardando_pagamento" | "fechada"
      mesa_status: "livre" | "ocupada" | "aguardando_pagamento"
      pagamento_metodo: "pix" | "cartao" | "dinheiro"
      pagamento_status: "pendente" | "pago" | "expirado"
      participante_status: "ativo" | "eliminado" | "cashout"
      pedido_status: "enviado" | "em_preparo" | "pronto"
      produto_setor: "bar" | "cozinha" | "churrasqueira"
      sessao_status: "aberta" | "encerrada"
      sessao_tipo: "torneio" | "cash_game"
      user_role: "garcom" | "admin" | "operador_poker"
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
      comanda_status: ["aberta", "aguardando_pagamento", "fechada"],
      mesa_status: ["livre", "ocupada", "aguardando_pagamento"],
      pagamento_metodo: ["pix", "cartao", "dinheiro"],
      pagamento_status: ["pendente", "pago", "expirado"],
      participante_status: ["ativo", "eliminado", "cashout"],
      pedido_status: ["enviado", "em_preparo", "pronto"],
      produto_setor: ["bar", "cozinha", "churrasqueira"],
      sessao_status: ["aberta", "encerrada"],
      sessao_tipo: ["torneio", "cash_game"],
      user_role: ["garcom", "admin", "operador_poker"],
    },
  },
} as const
