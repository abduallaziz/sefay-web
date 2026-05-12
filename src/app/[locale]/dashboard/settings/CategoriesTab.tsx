'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { Trash2, Plus, GripVertical, Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  color: string
  icon: string
  sort_order: number
}

const PRESET_COLORS = [
  '#F59E0B', '#EF4444', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
]

const PRESET_ICONS = ['🍔', '☕', '🛒', '🚗', '🔧', '🧵', '💊', '📦', '🍕', '🥤', '🍰', '🎯']

export default function CategoriesTab() {
  const isAr = useLocale() === 'ar'
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState('')

  // New category form
  const [newName,  setNewName]  = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [newIcon,  setNewIcon]  = useState(PRESET_ICONS[0])

  useEffect(() => { loadCategories() }, [])

  async function loadCategories() {
    setLoading(true)
    try {
      const session = getSession()
      if (!session) return
      const { data } = await supabase
        .from('categories')
        .select('id, name, color, icon, sort_order')
        .eq('tenant_id', session.tenant_id)
        .order('sort_order', { ascending: true })
      setCategories(data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function addCategory() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const session = getSession()
      if (!session) return
      const { data, error } = await supabase
        .from('categories')
        .insert({
          tenant_id:  session.tenant_id,
          name:       newName.trim(),
          color:      newColor,
          icon:       newIcon,
          sort_order: categories.length,
        })
        .select()
        .single()
      if (error) throw error
      setCategories(prev => [...prev, data])
      setNewName('')
      showToast(isAr ? '✅ تمت الإضافة' : '✅ Added')
    } catch (e) { console.error(e); showToast(isAr ? '❌ خطأ' : '❌ Error') }
    finally { setSaving(false) }
  }

  async function deleteCategory(id: string) {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      setCategories(prev => prev.filter(c => c.id !== id))
      showToast(isAr ? '✅ تم الحذف' : '✅ Deleted')
    } catch (e) { console.error(e); showToast(isAr ? '❌ خطأ' : '❌ Error') }
  }

  async function updateCategory(id: string, field: keyof Category, value: string | number) {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
    try {
      await supabase.from('categories').update({ [field]: value }).eq('id', id)
    } catch (e) { console.error(e) }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
    </div>
  )

  return (
    <div style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>

      {toast && (
        <div style={{ position: 'fixed', top: '80px', insetInlineEnd: '24px', backgroundColor: 'var(--color-primary)', color: '#000', padding: '10px 20px', borderRadius: 'var(--radius-md)', fontWeight: '700', fontSize: '13px', zIndex: 1000 }}>
          {toast}
        </div>
      )}

      <h3 className="form-section-title">
        🗂️ {isAr ? 'إدارة الفئات' : 'Manage Categories'}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
        {isAr ? 'الفئات تظهر في الـ POS لتنظيم المنتجات والخدمات' : 'Categories appear in POS to organize products and services'}
      </p>

      {/* Add new category */}
      <div style={{ backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
          {isAr ? 'إضافة فئة جديدة' : 'Add New Category'}
        </div>

        {/* Icon picker */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            {isAr ? 'الأيقونة' : 'Icon'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {PRESET_ICONS.map(icon => (
              <button key={icon} onClick={() => setNewIcon(icon)}
                style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', border: `2px solid ${newIcon === icon ? 'var(--color-primary)' : 'var(--color-border)'}`, backgroundColor: newIcon === icon ? 'var(--color-primary-light)' : 'transparent', cursor: 'pointer', fontSize: '18px' }}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            {isAr ? 'اللون' : 'Color'}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {PRESET_COLORS.map(color => (
              <button key={color} onClick={() => setNewColor(color)}
                style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: color, border: `3px solid ${newColor === color ? 'var(--color-text-primary)' : 'transparent'}`, cursor: 'pointer' }} />
            ))}
          </div>
        </div>

        {/* Name + Add button */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', backgroundColor: newColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
            {newIcon}
          </div>
          <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder={isAr ? 'اسم الفئة...' : 'Category name...'}
            onKeyDown={e => e.key === 'Enter' && addCategory()}
            style={{ flex: 1 }} />
          <button onClick={addCategory} disabled={!newName.trim() || saving} className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
            {isAr ? 'إضافة' : 'Add'}
          </button>
        </div>
      </div>

      {/* Categories list */}
      {categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
          {isAr ? 'لا توجد فئات بعد' : 'No categories yet'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categories.map((cat) => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
              <GripVertical size={14} color="var(--color-text-muted)" style={{ flexShrink: 0, cursor: 'grab' }} />
              <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', backgroundColor: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                {cat.icon}
              </div>
              <input className="form-input" value={cat.name}
                onChange={e => updateCategory(cat.id, 'name', e.target.value)}
                onBlur={e => updateCategory(cat.id, 'name', e.target.value)}
                style={{ flex: 1, padding: '6px 10px', fontSize: '13px', fontWeight: '600' }} />
              <button onClick={() => deleteCategory(cat.id)}
                style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-danger-border)', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}