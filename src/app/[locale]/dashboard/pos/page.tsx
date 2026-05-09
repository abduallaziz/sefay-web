'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { getSession } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { Plus, Minus, Trash2, ShoppingCart, Search, X } from 'lucide-react'

interface Item {
  id: string
  name: string
  price: number
  category: string
  image_url?: string
  color?: string
}

interface CartItem extends Item {
  qty: number
  custom_price?: number
}

interface Customer {
  id: string
  name: string
  phone: string
}

export default function POSPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [items, setItems]               = useState<Item[]>([])
  const [cart, setCart]                 = useState<CartItem[]>([])
  const [search, setSearch]             = useState('')
  const [selectedCat, setSelectedCat]   = useState('all')
  const [customer, setCustomer]         = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [discount, setDiscount]         = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mada' | 'visa' | 'mastercard' | 'mixed'>('cash')
  const [cashAmount, setCashAmount]     = useState('')
  const [cardAmount, setCardAmount]     = useState('')
  const [notes, setNotes]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [success, setSuccess]           = useState(false)

  const TAX_RATE = 15

  useEffect(() => { loadItems() }, [])

  async function loadItems() {
    setLoading(true)
    try {
      const res = await api.items.getActive()
      setItems(res.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function searchCustomers(q: string) {
    if (!q || q.length < 2) { setCustomerResults([]); return }
    try {
      const res = await api.customers.search(q)
      setCustomerResults(res.data || [])
    } catch { setCustomerResults([]) }
  }

  function addToCart(item: Item) {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function updateQty(id: string, delta: number) {
    setCart(prev => prev
      .map(c => c.id === id ? { ...c, qty: c.qty + delta } : c)
      .filter(c => c.qty > 0)
    )
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(c => c.id !== id))
  }

  function clearCart() {
    setCart([])
    setDiscount(0)
    setCustomer(null)
    setCustomerSearch('')
    setNotes('')
    setPaymentMethod('cash')
    setCashAmount('')
    setCardAmount('')
  }

  const subtotal    = cart.reduce((s, c) => s + (c.custom_price ?? c.price) * c.qty, 0)
  const discountAmt = Math.min(discount, subtotal)
  const taxable     = subtotal - discountAmt
  const tax         = taxable * (TAX_RATE / 100)
  const total       = taxable + tax

  async function submitOrder() {
    if (cart.length === 0) return
    if (paymentMethod === 'mixed') {
      const c = parseFloat(cashAmount) || 0
      const k = parseFloat(cardAmount) || 0
      if (Math.abs(c + k - total) > 0.01) {
        alert(isAr ? 'نقد + بطاقة يجب أن يساوي الإجمالي' : 'Cash + Card must equal total')
        return
      }
    }
    setSubmitting(true)
    try {
      const body: any = {
        customer_id:    customer?.id || undefined,
        payment_method: paymentMethod,
        discount:       discountAmt,
        notes:          notes || undefined,
        items: cart.map(c => ({
          item_id:   c.id,
          item_name: c.name,
          price:     c.custom_price ?? c.price,
          qty:       c.qty,
        })),
      }
      if (paymentMethod === 'mixed') {
        body.cash_amount = parseFloat(cashAmount) || 0
        body.card_amount = parseFloat(cardAmount) || 0
      }
      await api.orders.create(body)
      setSuccess(true)
      clearCart()
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      alert(e?.response?.data?.message || (isAr ? 'حدث خطأ' : 'Error'))
    } finally { setSubmitting(false) }
  }

  const categories    = ['all', ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))]
  const filteredItems = items.filter(item => {
    const matchCat    = selectedCat === 'all' || item.category === selectedCat
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const lc = (ar: string, en: string) => isAr ? ar : en

  const paymentLabels: Record<string, string> = {
    cash:       lc('نقد', 'Cash'),
    mada:       lc('مادا', 'Mada'),
    visa:       lc('فيزا', 'Visa'),
    mastercard: lc('ماستر كارد', 'Mastercard'),
    mixed:      lc('مختلط', 'Mixed'),
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '16px', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>

      {/* ─── LEFT: Items ─────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={16} style={{ position: 'absolute', top: '50%', [isAr ? 'right' : 'left']: '12px', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={lc('ابحث عن منتج...', 'Search items...')}
            style={{
              width: '100%', padding: isAr ? '10px 36px 10px 12px' : '10px 12px 10px 36px',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCat(cat)} style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
              border: '1px solid var(--color-border)', cursor: 'pointer',
              backgroundColor: selectedCat === cat ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
              color: selectedCat === cat ? '#fff' : 'var(--color-text-secondary)',
            }}>
              {cat === 'all' ? lc('الكل', 'All') : cat}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', alignContent: 'start' }}>
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              {lc('جاري التحميل...', 'Loading...')}
            </div>
          ) : filteredItems.map(item => {
            const inCart = cart.find(c => c.id === item.id)
            return (
              <div key={item.id} style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: `2px solid ${inCart ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-lg)', padding: '12px',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                position: 'relative', transition: 'var(--transition)',
              }}>
                {/* Badge qty */}
                {inCart && (
                  <div style={{
                    position: 'absolute', top: '6px', [isAr ? 'left' : 'right']: '6px',
                    backgroundColor: 'var(--color-primary)', color: '#fff',
                    borderRadius: '50%', width: '22px', height: '22px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '700',
                  }}>{inCart.qty}</div>
                )}

                {/* Image / Icon */}
                <div onClick={() => addToCart(item)} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '8px',
                      backgroundColor: item.color || 'var(--color-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                    }}>🛍️</div>
                  )}
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)', textAlign: 'center' }}>{item.name}</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)' }}>
                    {formatCurrency(item.price, isAr ? 'ar-SA' : 'en-US')}
                  </div>
                </div>

                {/* +/- buttons — تظهر فقط لما في الكارت */}
                {inCart && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <button onClick={e => { e.stopPropagation(); updateQty(item.id, -1) }} style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      border: '1px solid var(--color-border)', cursor: 'pointer',
                      backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}><Minus size={12} /></button>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text-primary)', minWidth: '20px', textAlign: 'center' }}>{inCart.qty}</span>
                    <button onClick={e => { e.stopPropagation(); updateQty(item.id, 1) }} style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      border: '1px solid var(--color-primary)', cursor: 'pointer',
                      backgroundColor: 'var(--color-primary)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}><Plus size={12} /></button>
                  </div>
                )}
              </div>
            )
          })}
          {!loading && filteredItems.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              {lc('لا توجد منتجات', 'No items')}
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT: Cart ─────────────────── */}
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', height: '100%',
      }}>

        {/* Cart Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={18} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--color-text-primary)' }}>
              {lc('السلة', 'Cart')} {cart.length > 0 && `(${cart.reduce((s, c) => s + c.qty, 0)})`}
            </span>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', fontSize: '12px' }}>
              {lc('مسح الكل', 'Clear')}
            </button>
          )}
        </div>

        {/* Cart Items — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
              <ShoppingCart size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <div style={{ fontSize: '13px' }}>{lc('السلة فارغة', 'Cart is empty')}</div>
            </div>
          ) : cart.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px', marginBottom: '8px',
              backgroundColor: 'var(--color-bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '4px' }}>{item.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: '700' }}>
                  {formatCurrency((item.custom_price ?? item.price) * item.qty, isAr ? 'ar-SA' : 'en-US')}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button onClick={() => updateQty(item.id, -1)} style={{
                  width: '26px', height: '26px', borderRadius: '6px',
                  border: '1px solid var(--color-border)', cursor: 'pointer',
                  backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Minus size={12} /></button>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text-primary)', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                <button onClick={() => updateQty(item.id, 1)} style={{
                  width: '26px', height: '26px', borderRadius: '6px',
                  border: '1px solid var(--color-primary)', cursor: 'pointer',
                  backgroundColor: 'var(--color-primary)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Plus size={12} /></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '4px' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Section — fixed */}
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--color-border)' }}>

          {/* Customer + Discount + Notes */}
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <input
                value={customer ? `${customer.name} — ${customer.phone}` : customerSearch}
                onChange={e => { setCustomerSearch(e.target.value); setCustomer(null); searchCustomers(e.target.value) }}
                placeholder={lc('بحث عن عميل (اختياري)', 'Search customer (optional)')}
                style={{
                  width: '100%', padding: '8px 12px', boxSizing: 'border-box',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)',
                  fontSize: '13px', outline: 'none',
                }}
              />
              {customer && (
                <button onClick={() => { setCustomer(null); setCustomerSearch('') }} style={{
                  position: 'absolute', top: '50%', [isAr ? 'left' : 'right']: '8px',
                  transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
                }}><X size={14} /></button>
              )}
              {customerResults.length > 0 && !customer && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 10,
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', marginBottom: '4px',
                  maxHeight: '150px', overflowY: 'auto',
                }}>
                  {customerResults.map((c: Customer) => (
                    <div key={c.id} onClick={() => { setCustomer(c); setCustomerResults([]); setCustomerSearch('') }} style={{
                      padding: '10px 12px', cursor: 'pointer', fontSize: '13px',
                      color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)',
                    }}>
                      <span style={{ fontWeight: '600' }}>{c.name}</span>
                      <span style={{ color: 'var(--color-text-muted)', margin: '0 8px' }}>{c.phone}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              type="number"
              value={discount || ''}
              onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
              placeholder={lc('خصم (اختياري)', 'Discount (optional)')}
              min={0}
              style={{
                width: '100%', padding: '8px 12px', boxSizing: 'border-box',
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)',
                fontSize: '13px', outline: 'none',
              }}
            />

            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={lc('ملاحظات (اختياري)', 'Notes (optional)')}
              style={{
                width: '100%', padding: '8px 12px', boxSizing: 'border-box',
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)',
                fontSize: '13px', outline: 'none',
              }}
            />
          </div>

          {/* Totals */}
          <div style={{ padding: '10px 16px', backgroundColor: 'var(--color-bg-tertiary)', borderTop: '1px solid var(--color-border)' }}>
            {[
              { label: lc('المجموع', 'Subtotal'), value: subtotal },
              ...(discountAmt > 0 ? [{ label: lc('الخصم', 'Discount'), value: -discountAmt, danger: true }] : []),
              { label: `${lc('ضريبة', 'Tax')} (${TAX_RATE}%)`, value: tax },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{row.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: (row as any).danger ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
                  {(row as any).danger ? '-' : ''}{formatCurrency(Math.abs(row.value), isAr ? 'ar-SA' : 'en-US')}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-text-primary)' }}>{lc('الإجمالي', 'Total')}</span>
              <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--color-primary)' }}>
                {formatCurrency(total, isAr ? 'ar-SA' : 'en-US')}
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
              {(['cash', 'mada', 'visa', 'mastercard', 'mixed'] as const).map(method => (
                <button key={method} onClick={() => setPaymentMethod(method)} style={{
                  padding: '8px', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '600',
                  border: `1px solid ${paymentMethod === method ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  cursor: 'pointer',
                  backgroundColor: paymentMethod === method ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                  color: paymentMethod === method ? '#fff' : 'var(--color-text-secondary)',
                }}>
                  {paymentLabels[method]}
                </button>
              ))}
            </div>

            {paymentMethod === 'mixed' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={e => setCashAmount(e.target.value)}
                  placeholder={lc('نقد', 'Cash')}
                  style={{ padding: '8px', backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '13px', outline: 'none' }}
                />
                <input
                  type="number"
                  value={cardAmount}
                  onChange={e => setCardAmount(e.target.value)}
                  placeholder={lc('بطاقة', 'Card')}
                  style={{ padding: '8px', backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '13px', outline: 'none' }}
                />
              </div>
            )}

            <button
              onClick={submitOrder}
              disabled={cart.length === 0 || submitting}
              style={{
                width: '100%', padding: '14px',
                backgroundColor: success ? 'var(--color-success)' : cart.length === 0 ? 'var(--color-bg-tertiary)' : 'var(--color-primary)',
                color: cart.length === 0 ? 'var(--color-text-muted)' : '#fff',
                border: 'none', borderRadius: 'var(--radius-md)',
                fontSize: '15px', fontWeight: '800',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {success ? `✅ ${lc('تم بنجاح!', 'Order Created!')}` : submitting ? lc('جاري الإرسال...', 'Processing...') : lc('إتمام الطلب', 'Checkout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}