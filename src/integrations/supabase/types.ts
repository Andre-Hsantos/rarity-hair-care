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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          district: string | null
          id: string
          is_default: boolean
          label: string | null
          number: string | null
          state: string
          street: string
          updated_at: string
          user_id: string
          zip: string | null
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          district?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          number?: string | null
          state: string
          street: string
          updated_at?: string
          user_id: string
          zip?: string | null
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          district?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          number?: string | null
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: never
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: never
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          display_order: number
          ends_at: string | null
          id: string
          image_url: string | null
          link: string | null
          placement: string
          starts_at: string | null
          status: Database["public"]["Enums"]["record_status"]
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          ends_at?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          placement?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          ends_at?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          placement?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          added_at: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          added_at?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          added_at?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          name: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id: string
          image_url?: string | null
          name: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          name?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: []
      }
      coupon_categories: {
        Row: {
          category_id: string
          coupon_id: string
        }
        Insert: {
          category_id: string
          coupon_id: string
        }
        Update: {
          category_id?: string
          coupon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_categories_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_products: {
        Row: {
          coupon_id: string
          product_id: string
        }
        Insert: {
          coupon_id: string
          product_id: string
        }
        Update: {
          coupon_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_products_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          audience: Database["public"]["Enums"]["target_audience"]
          code: string
          created_at: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          ends_at: string | null
          id: string
          max_uses: number | null
          min_order_value: number | null
          starts_at: string | null
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          uses_count: number
        }
        Insert: {
          audience?: Database["public"]["Enums"]["target_audience"]
          code: string
          created_at?: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          ends_at?: string | null
          id?: string
          max_uses?: number | null
          min_order_value?: number | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          uses_count?: number
        }
        Update: {
          audience?: Database["public"]["Enums"]["target_audience"]
          code?: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          ends_at?: string | null
          id?: string
          max_uses?: number | null
          min_order_value?: number | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          uses_count?: number
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      home_section_products: {
        Row: {
          created_at: string
          position: number
          product_id: string
          section: string
        }
        Insert: {
          created_at?: string
          position?: number
          product_id: string
          section: string
        }
        Update: {
          created_at?: string
          position?: number
          product_id?: string
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_section_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      kit_items: {
        Row: {
          kit_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          kit_id: string
          product_id: string
          quantity?: number
        }
        Update: {
          kit_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "kit_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
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
      order_history: {
        Row: {
          change_note: string | null
          changed_by: string | null
          created_at: string
          id: number
          new_status: Database["public"]["Enums"]["order_status"] | null
          old_status: Database["public"]["Enums"]["order_status"] | null
          order_id: number
        }
        Insert: {
          change_note?: string | null
          changed_by?: string | null
          created_at?: string
          id?: never
          new_status?: Database["public"]["Enums"]["order_status"] | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id: number
        }
        Update: {
          change_note?: string | null
          changed_by?: string | null
          created_at?: string
          id?: never
          new_status?: Database["public"]["Enums"]["order_status"] | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          discount: number
          id: number
          item_total: number
          order_id: number
          original_price: number
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          discount?: number
          id?: never
          item_total: number
          order_id: number
          original_price: number
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          discount?: number
          id?: never
          item_total?: number
          order_id?: number
          original_price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string | null
          client_request_id: string | null
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          customer_type: Database["public"]["Enums"]["account_type"]
          delivery_address: Json | null
          delivery_method: Database["public"]["Enums"]["delivery_method"]
          discount: number
          id: number
          note: string | null
          products_total: number
          shipping: number | null
          status: Database["public"]["Enums"]["order_status"]
          tecnobyte_registered: boolean
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address_id?: string | null
          client_request_id?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_type: Database["public"]["Enums"]["account_type"]
          delivery_address?: Json | null
          delivery_method: Database["public"]["Enums"]["delivery_method"]
          discount?: number
          id?: never
          note?: string | null
          products_total?: number
          shipping?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          tecnobyte_registered?: boolean
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address_id?: string | null
          client_request_id?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_type?: Database["public"]["Enums"]["account_type"]
          delivery_address?: Json | null
          delivery_method?: Database["public"]["Enums"]["delivery_method"]
          discount?: number
          id?: never
          note?: string | null
          products_total?: number
          shipping?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          tecnobyte_registered?: boolean
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_requests: {
        Row: {
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          document_path: string
          id: string
          proof_number: string | null
          proof_type: Database["public"]["Enums"]["proof_type"]
          requested_at: string
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Insert: {
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          document_path: string
          id?: string
          proof_number?: string | null
          proof_type: Database["public"]["Enums"]["proof_type"]
          requested_at?: string
          status?: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Update: {
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          document_path?: string
          id?: string
          proof_number?: string | null
          proof_type?: Database["public"]["Enums"]["proof_type"]
          requested_at?: string
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          audience: Database["public"]["Enums"]["product_audience"]
          availability: Database["public"]["Enums"]["availability"]
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_kit: boolean
          name: string
          price: number
          pro_price: number | null
          size_group: string | null
          size_label: string | null
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["product_audience"]
          availability?: Database["public"]["Enums"]["availability"]
          category_id?: string | null
          created_at?: string
          description?: string | null
          id: string
          image_url?: string | null
          is_kit?: boolean
          name: string
          price: number
          pro_price?: number | null
          size_group?: string | null
          size_label?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["product_audience"]
          availability?: Database["public"]["Enums"]["availability"]
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_kit?: boolean
          name?: string
          price?: number
          pro_price?: number | null
          size_group?: string | null
          size_label?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          account_type: Database["public"]["Enums"]["account_type"]
          birth_date: string | null
          cpf: string | null
          created_at: string
          email: string
          id: string
          individual_discount_percent: number
          last_access_at: string | null
          name: string
          phone: string | null
          pro_status: Database["public"]["Enums"]["pro_status"]
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          account_type?: Database["public"]["Enums"]["account_type"]
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          id: string
          individual_discount_percent?: number
          last_access_at?: string | null
          name: string
          phone?: string | null
          pro_status?: Database["public"]["Enums"]["pro_status"]
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          account_type?: Database["public"]["Enums"]["account_type"]
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          individual_discount_percent?: number
          last_access_at?: string | null
          name?: string
          phone?: string | null
          pro_status?: Database["public"]["Enums"]["pro_status"]
          updated_at?: string
        }
        Relationships: []
      }
      promotion_products: {
        Row: {
          product_id: string
          promotion_id: string
        }
        Insert: {
          product_id: string
          promotion_id: string
        }
        Update: {
          product_id?: string
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_products_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          audience: Database["public"]["Enums"]["target_audience"]
          created_at: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          ends_at: string | null
          id: string
          name: string
          starts_at: string | null
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["target_audience"]
          created_at?: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          ends_at?: string | null
          id?: string
          name: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["target_audience"]
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          ends_at?: string | null
          id?: string
          name?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved: boolean
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          approved?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          approved?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_links: {
        Row: {
          display_order: number
          id: string
          network: string
          status: Database["public"]["Enums"]["record_status"]
          url: string
        }
        Insert: {
          display_order?: number
          id?: string
          network: string
          status?: Database["public"]["Enums"]["record_status"]
          url: string
        }
        Update: {
          display_order?: number
          id?: string
          network?: string
          status?: Database["public"]["Enums"]["record_status"]
          url?: string
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          created_at: string
          notified_at: string | null
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          notified_at?: string | null
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          notified_at?: string | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_info: {
        Row: {
          address: string | null
          email: string | null
          id: number
          map_url: string | null
          name: string | null
          opening_hours: string | null
          phone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          email?: string | null
          id?: number
          map_url?: string | null
          name?: string | null
          opening_hours?: string | null
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          email?: string | null
          id?: number
          map_url?: string | null
          name?: string | null
          opening_hours?: string | null
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _has_promo: {
        Args: { _is_pro: boolean; _product_id: string }
        Returns: boolean
      }
      _promo_apply: {
        Args: {
          _base: number
          _type: Database["public"]["Enums"]["discount_type"]
          _value: number
        }
        Returns: number
      }
      _promo_price: {
        Args: { _base: number; _is_pro: boolean; _product_id: string }
        Returns: number
      }
      _quote_cart: {
        Args: {
          _coupon: string
          _delivery: Database["public"]["Enums"]["delivery_method"]
          _uid: string
        }
        Returns: Json
      }
      admin_delete_category: { Args: { _id: string }; Returns: undefined }
      admin_delete_client_data: {
        Args: { _user_id: string }
        Returns: undefined
      }
      admin_delete_order: { Args: { _order_id: number }; Returns: undefined }
      admin_delete_product: { Args: { _product_id: string }; Returns: Json }
      admin_send_notification: {
        Args: { _body: string; _title: string; _user_ids: string[] }
        Returns: number
      }
      admin_send_notification_audience: {
        Args: {
          _audience: Database["public"]["Enums"]["target_audience"]
          _body: string
          _title: string
        }
        Returns: number
      }
      admin_update_order: {
        Args: {
          _note: string
          _order_id: number
          _shipping: number
          _status: string
          _tecnobyte: boolean
        }
        Returns: undefined
      }
      admin_update_order_item: {
        Args: {
          _discount: number
          _item_id: number
          _note: string
          _quantity: number
          _unit_price: number
        }
        Returns: undefined
      }
      catalog_products: {
        Args: never
        Returns: {
          audience: Database["public"]["Enums"]["product_audience"]
          availability: Database["public"]["Enums"]["availability"]
          category_id: string
          category_name: string
          created_at: string
          description: string
          final_price: number
          id: string
          image_url: string
          in_promotion: boolean
          is_kit: boolean
          name: string
          original_price: number
          price: number
          pro_price: number
          size_group: string
          size_label: string
        }[]
      }
      create_order: {
        Args: {
          _address: Json
          _coupon: string
          _delivery: Database["public"]["Enums"]["delivery_method"]
          _note: string
          _request_id: string
        }
        Returns: number
      }
      decide_pro_request: {
        Args: { _approve: boolean; _note: string; _request_id: string }
        Returns: undefined
      }
      delete_own_account_data: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      quote_cart: {
        Args: {
          _coupon: string
          _delivery: Database["public"]["Enums"]["delivery_method"]
        }
        Returns: Json
      }
      update_own_profile: {
        Args: {
          _birth_date: string
          _cpf: string
          _name: string
          _phone: string
        }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "ativa" | "excluida"
      account_type: "comum" | "profissional"
      app_role: "admin" | "user"
      availability: "disponivel" | "esgotado"
      delivery_method: "retirada" | "entrega"
      discount_type: "percentual" | "valor_fixo"
      order_status:
        | "recebido"
        | "em_negociacao"
        | "confirmado"
        | "pronto_retirada"
        | "enviado"
        | "concluido"
        | "cancelado"
        | "aguardando_confirmacao"
        | "aguardando_pagamento"
        | "pagamento_confirmado"
      pro_status: "nao_solicitado" | "em_analise" | "aprovado" | "rejeitado"
      product_audience: "todos" | "profissionais"
      proof_type: "cnpj" | "mei" | "certificado"
      record_status: "ativo" | "inativo"
      request_status: "em_analise" | "aprovado" | "rejeitado"
      target_audience: "todos" | "comuns" | "profissionais"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_status: ["ativa", "excluida"],
      account_type: ["comum", "profissional"],
      app_role: ["admin", "user"],
      availability: ["disponivel", "esgotado"],
      delivery_method: ["retirada", "entrega"],
      discount_type: ["percentual", "valor_fixo"],
      order_status: [
        "recebido",
        "em_negociacao",
        "confirmado",
        "pronto_retirada",
        "enviado",
        "concluido",
        "cancelado",
        "aguardando_confirmacao",
        "aguardando_pagamento",
        "pagamento_confirmado",
      ],
      pro_status: ["nao_solicitado", "em_analise", "aprovado", "rejeitado"],
      product_audience: ["todos", "profissionais"],
      proof_type: ["cnpj", "mei", "certificado"],
      record_status: ["ativo", "inativo"],
      request_status: ["em_analise", "aprovado", "rejeitado"],
      target_audience: ["todos", "comuns", "profissionais"],
    },
  },
} as const
