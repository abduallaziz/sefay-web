'use client'

import { useEffect, useState } from 'react'
import { X, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface VariantOption {
  id: string
  name: string
  price_adjustment: number
  stock_quantity: number
}

interface VariantGroup {
  id: string
  name: string
  type: string
  required: boolean
  multi_select: boolean
  min_select: number
  max_select: number
  item_variant_options: VariantOption[]
}

interface Item {
  id: string
  name: string
  price: number
  color?: string
  image_url?: string
}

interface Props {
  item: Item
  isAr: boolean
onConfirm: (item: any, selectedOptions: any[], finalPrice: number) => void
  onClose: () => void
}

export default function VariantModal({ item, isAr, onConfirm, onClose }: Props) {
  const [groups, setGroups] = useState<VariantGroup[]>([])
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)

  const lc = (ar: string, en: string) => isAr ? ar : en

  useEffect(() => {
    loadGroups()
  }, [])

  async function loadGroups() {
    try {
      const res = await api.variants.getGroups(item.id)
      const data: VariantGroup[] = res.data || []
      setGroups(data)
      // pre-select أول خيار في كل group required
      const init: Record<string, string[]> = {}
      data.forEach(g => {
        if (g.required && g.item_variant_options?.length > 0) {
          init[g.id] = [g.item_variant_options[0].id]
        } else {
          init[g.id] = []
        }
      })
      setSelected(init)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function toggleOption(group: VariantGroup, optionId: string) {
    setSelected(prev => {
        const current = prev[group.id] || []

        if (!group.multi_select || group.max_select === 1) {
        // single select — دائماً استبدل
        return { ...prev, [group.id]: [optionId] }
        }

        // multi select
        const max = group.max_select || 999
        if (current.includes(optionId)) {
        const next = current.filter(id => id !== optionId)
        if (group.required && next.length === 0) return prev
        return { ...prev, [group.id]: next }
        } else {
        if (current.length >= max) return prev
        return { ...prev, [group.id]: [...current, optionId] }
        }
    })
}

  function isValid() {
    return groups.every(g => {
      if (!g.required) return true
      const sel = selected[g.id] || []
      return sel.length >= (g.min_select || 1)
    })
  }

  function calcPrice() {
    let price = item.price
    groups.forEach(g => {
      const sel = selected[g.id] || []
      sel.forEach(optId => {
        const opt = g.item_variant_options?.find(o => o.id === optId)
        if (opt) price += opt.price_adjustment
      })
    })
    return price
  }

  function handleConfirm() {
    if (!isValid()) return
    const allSelected: VariantOption[] = []
    groups.forEach(g => {
      const sel = selected[g.id] || []
      sel.forEach(optId => {
        const opt = g.item_variant_options?.find(o => o.id === optId)
        if (opt) allSelected.push(opt)
      })
    })
    onConfirm(item, allSelected, calcPrice())
  }

  const finalPrice = calcPrice()

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: '480px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--color-text-primary)' }}>
              {item.name}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {lc('اختر المواصفات', 'Select options')}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', padding: '4px',
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              {lc('جاري التحميل...', 'Loading...')}
            </div>
          ) : groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              {lc('لا توجد خيارات', 'No options')}
            </div>
          ) : groups.map(group => (
            <div key={group.id} style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px',
              }}>
                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  {group.name}
                </span>
                {group.required && (
                  <span style={{
                    fontSize: '11px', padding: '2px 8px',
                    backgroundColor: 'rgba(var(--color-danger-rgb), 0.15)',
                    color: 'var(--color-danger)',
                    borderRadius: '20px', fontWeight: '600',
                  }}>
                    {lc('مطلوب', 'Required')}
                  </span>
                )}
                {group.multi_select && (
                  <span style={{
                    fontSize: '11px', padding: '2px 8px',
                    backgroundColor: 'rgba(var(--color-primary-rgb), 0.15)',
                    color: 'var(--color-primary)',
                    borderRadius: '20px', fontWeight: '600',
                  }}>
                    {lc(`اختر حتى ${group.max_select}`, `Up to ${group.max_select}`)}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {group.item_variant_options?.map(opt => {
                  const isSelected = (selected[group.id] || []).includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleOption(group, opt.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        backgroundColor: isSelected ? 'rgba(var(--color-primary-rgb), 0.1)' : 'var(--color-bg-tertiary)',
                        color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'var(--transition)',
                      }}
                    >
                      {isSelected && <Check size={13} />}
                      {opt.name}
                      {opt.price_adjustment !== 0 && (
                        <span style={{ fontSize: '12px', opacity: 0.8 }}>
                          {opt.price_adjustment > 0 ? '+' : ''}{formatCurrency(opt.price_adjustment, isAr ? 'ar-SA' : 'en-US')}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--color-border)',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{lc('السعر', 'Price')}</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-primary)' }}>
              {formatCurrency(finalPrice, isAr ? 'ar-SA' : 'en-US')}
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!isValid()}
            style={{
              flex: 1, maxWidth: '200px',
              padding: '12px',
              backgroundColor: isValid() ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
              color: isValid() ? '#fff' : 'var(--color-text-muted)',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: '700',
              cursor: isValid() ? 'pointer' : 'not-allowed',
            }}
          >
            {lc('إضافة للسلة', 'Add to Cart')}
          </button>
        </div>
      </div>
    </div>
  )
}