'use client'
import CarWashSetup from './car-wash'
import CafeSetup from './cafe'
import MarketSetup from './market'
import TailorSetup from './tailor'
import RestaurantSetup from './restaurant'
import OtherSetup from './other'

export type Step3Item = {
  name: string
  price: string
  category?: string
  type?: string
  stock_quantity?: string
  duration?: string
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
      return <CarWashSetup items={items} onChange={onChange} />
    case 'cafe':
      return <CafeSetup items={items} onChange={onChange} />
    case 'restaurant':
      return <RestaurantSetup items={items} onChange={onChange} />
    case 'supermarket':
      return <MarketSetup items={items} onChange={onChange} />
    case 'tailor':
      return <TailorSetup items={items} onChange={onChange} />
    case 'other':
      return <OtherSetup items={items} onChange={onChange} />
    default:
      return <OtherSetup items={items} onChange={onChange} />
  }
}