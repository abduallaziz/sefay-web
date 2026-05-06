'use client'
import { useLocale } from 'next-intl'
import { Trash2 } from 'lucide-react'

interface Item { name: string; price: string; quantity: string; sku: string }
interface Props { items: Item[]; onChange: (items: Item[]) => void }

export default function MarketSetup({ items, onChange }: Props) {
  const isAr = useLocale() === 'ar'
  const update = (i: number, field: keyof Item, val: string) =>
    onChange(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 36px', gap: '6px', marginBottom: '4px' }}>
        {[isAr ? 'المنتج' : 'Product', isAr ? 'السعر' : 'Price', isAr ? 'الكمية' : 'Qty', 'SKU', ''].map((h, i) => (
          <div key={i} style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)' }}>{h}</div>
        ))}
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 36px', gap: '6px', alignItems: 'center' }}>
          <input className="form-input" value={item.name} onChange={e => update(i, 'name', e.target.value)} placeholder={isAr ? 'مياه معدنية' : 'Mineral Water'} />
          <input className="form-input" type="number" value={item.price} onChange={e => update(i, 'price', e.target.value)} placeholder="0" />
          <input className="form-input" type="number" value={item.quantity} onChange={e => update(i, 'quantity', e.target.value)} placeholder="0" />
          <input className="form-input" value={item.sku} onChange={e => update(i, 'sku', e.target.value)} placeholder="SKU" />
          <button onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-danger-border)', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...items, { name: '', price: '', quantity: '', sku: '' }])}
        style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginTop: '4px' }}>
        + {isAr ? 'إضافة منتج' : 'Add Product'}
      </button>
    </div>
  )
}