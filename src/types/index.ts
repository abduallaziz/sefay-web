export type Locale = 'ar-SA' | 'en'

export type Direction = 'rtl' | 'ltr'

export interface User {
  id: string
  name: string
  email: string
  role: 'superadmin' | 'owner' | 'manager' | 'cashier' | 'worker'
  active: boolean
  tenant_id: string
  branch_id?: string
  locale?: Locale
}

export interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  phone?: string
  city?: string
  tax_rate: number
  tax_number?: string
  website?: string
  logo_url?: string
  sub_end?: string
  created_at: string
  locale?: Locale
}

export interface Branch {
  id: string
  tenant_id: string
  name: string
  city: string
  phone: string
  active: boolean
}

export interface Service {
  id: string
  tenant_id: string
  name: string
  price: number
  category: string
  icon: string
  color: string
  active: boolean
  image_url?: string
  type?: 'single' | 'bundle'
  bundle_items?: BundleItem[]
}

export interface BundleItem {
  service_id: string
  service_name: string
  price: number
  custom_price: boolean
}

export interface Customer {
  id: string
  tenant_id: string
  name: string
  phone: string
  loyalty_points: number
  created_at: string
}

export interface Vehicle {
  id: string
  customer_id: string
  tenant_id: string
  plate: string
  type: string
}

export interface Order {
  id: string
  tenant_id: string
  branch_id?: string
  customer_id?: string
  cashier_id?: string
  subtotal: number
  discount: number
  tax: number
  total: number
  payment_method: 'cash' | 'mada' | 'visa' | 'mastercard'
  status: 'pending' | 'completed' | 'cancelled' | 'refunded'
  coupon_code?: string
  created_at: string
  customers?: { name: string; phone: string }
  vehicles?: { plate: string }
  order_items?: { service_name: string; price: number; qty: number }[]
}

export interface Coupon {
  id: string
  tenant_id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  min_order: number
  max_uses: number | null
  used_count: number
  active: boolean
  expires_at?: string
}

export interface Shift {
  id: string
  tenant_id: string
  branch_id: string
  cashier_id: string
  status: 'open' | 'closed'
  opening_cash: number
  closing_cash?: number
  opened_at: string
  closed_at?: string
}

export interface Expense {
  id: string
  tenant_id: string
  title: string
  amount: number
  category: string
  notes?: string
  date: string
}

export interface DailySummary {
  date: string
  total_orders: number
  total_sales: number
  total_tax: number
  total_discount: number
  cash: number
  card: number
}