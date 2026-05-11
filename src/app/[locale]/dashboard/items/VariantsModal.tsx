'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { X, Plus, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react'

interface VariantOption {
  id: string
  name: string
  price_adjustment: number
  sku: string | null
  stock_quantity: number
}

interface VariantGroup {
  id: string
  name: string
  type: string
  required: boolean
  multi_select: boolean
  item_variant_options: VariantOption[]
}

interface Props {
  itemId: string
  itemName: string
  trackInventory: boolean
  onClose: () => void
}

export default function VariantsModal({ itemId, itemName, trackInventory, onClose }: Props) {
  const locale = useLocale()
  const ar = locale === 'ar'

  const [groups, setGroups]     = useState<VariantGroup[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [expanded, setExpanded] = useState<string[]>([])

  // New Group Form
  const [showNewGroup, setShowNewGroup]       = useState(false)
  const [newGroupName, setNewGroupName]       = useState('')
  const [newGroupType, setNewGroupType]       = useState<'VARIANT' | 'ADDON'>('VARIANT')
  const [newGroupRequired, setNewGroupRequired] = useState(false)
  const [newGroupMulti, setNewGroupMulti]     = useState(false)

  // New Option Form per group
  const [newOptionName, setNewOptionName]     = useState<Record<string, string>>({})
  const [newOptionPrice, setNewOptionPrice]   = useState<Record<string, string>>({})
  const [newOptionStock, setNewOptionStock]   = useState<Record<string, string>>({})
  const [newOptionSku, setNewOptionSku]       = useState<Record<string, string>>({})

  useEffect(() => { loadGroups() }, [])

  async function loadGroups() {
    setLoading(true)
    try {
      const res = await api.variants.getGroups(itemId)
      setGroups(res.data || [])
      setExpanded((res.data || []).map((g: VariantGroup) => g.id))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function createGroup() {
    if (!newGroupName.trim()) return
    setSaving(true)
    try {
      await api.variants.createGroup(itemId, {
        name:         newGroupName.trim(),
        type:         newGroupType,
        required:     newGroupRequired,
        multi_select: newGroupMulti,
      })
      setNewGroupName(''); setShowNewGroup(false)
      loadGroups()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  async function deleteGroup(groupId: string) {
    if (!confirm(ar ? 'حذف المجموعة؟' : 'Delete group?')) return
    try {
      await api.variants.deleteGroup(groupId)
      loadGroups()
    } catch (e) { console.error(e) }
  }

  async function createOption(groupId: string) {
    const name = newOptionName[groupId]?.trim()
    if (!name) return
    setSaving(true)
    try {
      await api.variants.createOption(groupId, {
        item_id:          itemId,
        name,
        price_adjustment: Number(newOptionPrice[groupId] || 0),
        stock_quantity:   Number(newOptionStock[groupId] || 0),
        sku:              newOptionSku[groupId] || null,
      })
      setNewOptionName(p  => ({ ...p, [groupId]: '' }))
      setNewOptionPrice(p => ({ ...p, [groupId]: '' }))
      setNewOptionStock(p => ({ ...p, [groupId]: '' }))
      setNewOptionSku(p   => ({ ...p, [groupId]: '' }))
      loadGroups()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  async function deleteOption(optionId: string) {
    if (!confirm(ar ? 'حذف الخيار؟' : 'Delete option?')) return
    try {
      await api.variants.deleteOption(optionId)
      loadGroups()
    } catch (e) { console.error(e) }
  }

  async function adjustStock(optionId: string, change: number, itemId: string) {
    try {
      await api.variants.adjustStock(optionId, {
        item_id:         itemId,
        type:            'MANUAL',
        quantity_change: change,
      })
      loadGroups()
    } catch (e) { console.error(e) }
  }

  function toggleExpand(id: string) {
    setExpanded(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg" style={{ maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title">
            🎛️ {ar ? 'Variants —' : 'Variants —'} {itemName}
          </h3>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              {ar ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : (
            <>
              {/* Groups */}
              {groups.map(group => (
                <div key={group.id} style={{
                  marginBottom: '16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                }}>
                  {/* Group Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--color-bg-tertiary)',
                    cursor: 'pointer',
                  }} onClick={() => toggleExpand(group.id)}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-text-primary)' }}>
                        {group.name}
                      </span>
                      <span style={{
                        marginRight: '8px', marginLeft: '8px',
                        fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                        backgroundColor: group.type === 'ADDON' ? 'var(--color-success-light)' : 'var(--color-primary-light)',
                        color: group.type === 'ADDON' ? 'var(--color-success)' : 'var(--color-primary)',
                      }}>
                        {group.type === 'ADDON' ? (ar ? 'إضافة' : 'Addon') : (ar ? 'خيار' : 'Variant')}
                      </span>
                      {group.required && (
                        <span style={{ fontSize: '11px', color: 'var(--color-danger)' }}>
                          {ar ? '• إلزامي' : '• Required'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteGroup(group.id) }}
                      style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        border: '1px solid var(--color-danger-border)',
                        backgroundColor: 'var(--color-danger-light)',
                        color: 'var(--color-danger)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      <Trash2 size={12} />
                    </button>
                    {expanded.includes(group.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>

                  {/* Options */}
                  {expanded.includes(group.id) && (
                    <div style={{ padding: '12px 16px' }}>
                      {group.item_variant_options.map(opt => (
                        <div key={opt.id} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '8px 12px', marginBottom: '6px',
                          backgroundColor: 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                        }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--color-text-primary)' }}>
                              {opt.name}
                            </span>
                            {opt.price_adjustment !== 0 && (
                              <span style={{ marginRight: '8px', fontSize: '12px', color: 'var(--color-primary)' }}>
                                +{opt.price_adjustment} {ar ? 'ر.س' : 'SAR'}
                              </span>
                            )}
                            {opt.sku && (
                              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                SKU: {opt.sku}
                              </span>
                            )}
                          </div>

                          {/* Stock Controls */}
                          {trackInventory && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => adjustStock(opt.id, -1, itemId)}
                                style={{
                                  width: '24px', height: '24px', borderRadius: '4px',
                                  border: '1px solid var(--color-border)',
                                  backgroundColor: 'var(--color-bg-tertiary)',
                                  color: 'var(--color-text-primary)',
                                  cursor: 'pointer', fontSize: '16px', lineHeight: 1,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>−</button>
                              <span style={{
                                minWidth: '32px', textAlign: 'center',
                                fontWeight: '700', fontSize: '13px',
                                color: opt.stock_quantity <= 5 ? 'var(--color-danger)' : 'var(--color-success)',
                              }}>
                                {opt.stock_quantity}
                              </span>
                              <button
                                onClick={() => adjustStock(opt.id, 1, itemId)}
                                style={{
                                  width: '24px', height: '24px', borderRadius: '4px',
                                  border: '1px solid var(--color-border)',
                                  backgroundColor: 'var(--color-bg-tertiary)',
                                  color: 'var(--color-text-primary)',
                                  cursor: 'pointer', fontSize: '16px', lineHeight: 1,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>+</button>
                            </div>
                          )}

                          <button onClick={() => deleteOption(opt.id)} style={{
                            width: '24px', height: '24px', borderRadius: '4px',
                            border: '1px solid var(--color-danger-border)',
                            backgroundColor: 'var(--color-danger-light)',
                            color: 'var(--color-danger)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <X size={10} />
                          </button>
                        </div>
                      ))}

                      {/* Add Option Form */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <input
                          className="form-input"
                          style={{ flex: 2, minWidth: '120px' }}
                          placeholder={ar ? 'اسم الخيار' : 'Option name'}
                          value={newOptionName[group.id] || ''}
                          onChange={e => setNewOptionName(p => ({ ...p, [group.id]: e.target.value }))}
                        />
                        <input
                          className="form-input"
                          style={{ width: '80px' }}
                          type="number" placeholder={ar ? 'سعر +' : 'Price +'}
                          value={newOptionPrice[group.id] || ''}
                          onChange={e => setNewOptionPrice(p => ({ ...p, [group.id]: e.target.value }))}
                        />
                        {trackInventory && (
                          <input
                            className="form-input"
                            style={{ width: '80px' }}
                            type="number" placeholder={ar ? 'مخزون' : 'Stock'}
                            value={newOptionStock[group.id] || ''}
                            onChange={e => setNewOptionStock(p => ({ ...p, [group.id]: e.target.value }))}
                          />
                        )}
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => createOption(group.id)}
                          disabled={saving}>
                          <Plus size={12} />
                          {ar ? 'إضافة' : 'Add'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Group */}
              {!showNewGroup ? (
                <button className="btn btn-secondary" style={{ width: '100%' }}
                  onClick={() => setShowNewGroup(true)}>
                  <Plus size={14} />
                  {ar ? 'إضافة مجموعة' : 'Add Group'}
                </button>
              ) : (
                <div style={{
                  padding: '16px', border: '1px dashed var(--color-primary)',
                  borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-primary-light)',
                }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder={ar ? 'اسم المجموعة (مثال: الحجم، اللون)' : 'Group name (e.g. Size, Color)'}
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                    />
                    <select
                      className="form-input form-select"
                      style={{ width: '120px' }}
                      value={newGroupType}
                      onChange={e => setNewGroupType(e.target.value as any)}>
                      <option value="VARIANT">{ar ? 'خيار' : 'Variant'}</option>
                      <option value="ADDON">{ar ? 'إضافة' : 'Addon'}</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={newGroupRequired}
                        onChange={e => setNewGroupRequired(e.target.checked)} />
                      {ar ? 'إلزامي' : 'Required'}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={newGroupMulti}
                        onChange={e => setNewGroupMulti(e.target.checked)} />
                      {ar ? 'اختيار متعدد' : 'Multi select'}
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary btn-sm" onClick={createGroup} disabled={saving}>
                      <Save size={12} />
                      {ar ? 'حفظ' : 'Save'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowNewGroup(false)}>
                      {ar ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {ar ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}