'use client'
import CarWashSetup from './car-wash'
import CafeSetup from './cafe'
import MarketSetup from './market'
import TailorSetup from './tailor'

export type Step3Item = {
  name: string
  price: string
  duration?: string
  category?: string
  quantity?: string
  sku?: string
  type?: string
}

interface Props {
  businessType: string
  items: Step3Item[]
  onChange: (items: Step3Item[]) => void
}

export default function Step3Router({ businessType, items, onChange }: Props) {
  switch (businessType) {
    case 'car_wash':
    case 'workshop':
      return <CarWashSetup items={items as any} onChange={onChange as any} />
    case 'cafe':
    case 'restaurant':
      return <CafeSetup items={items as any} onChange={onChange as any} />
    case 'supermarket':
    case 'market':
      return <MarketSetup items={items as any} onChange={onChange as any} />
    case 'tailor':
      return <TailorSetup items={items as any} onChange={onChange as any} />
    default:
      return <CarWashSetup items={items as any} onChange={onChange as any} />
  }
}