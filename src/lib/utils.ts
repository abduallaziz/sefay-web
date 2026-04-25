import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number, locale: string = 'ar-SA'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string, locale: string = 'ar-SA'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string, locale: string = 'ar-SA'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatNumber(num: number, locale: string = 'ar-SA'): string {
  return new Intl.NumberFormat(locale).format(num)
}

export function getTodayDate(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })
}

export function getPaymentLabel(method: string, locale: string = 'ar-SA'): string {
  const labels: Record<string, Record<string, string>> = {
    'ar-SA': {
      cash: 'نقد',
      mada: 'مدى',
      visa: 'فيزا',
      mastercard: 'ماستر كارد',
    },
    'en': {
      cash: 'Cash',
      mada: 'Mada',
      visa: 'Visa',
      mastercard: 'Mastercard',
    },
  }
  return labels[locale]?.[method] || labels['ar-SA'][method] || method
}

export function getStatusLabel(status: string, locale: string = 'ar-SA'): string {
  const labels: Record<string, Record<string, string>> = {
    'ar-SA': {
      completed: 'مكتمل',
      pending: 'معلق',
      cancelled: 'ملغي',
      refunded: 'مسترجع',
    },
    'en': {
      completed: 'Completed',
      pending: 'Pending',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    },
  }
  return labels[locale]?.[status] || labels['ar-SA'][status] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: '#00e5a0',
    pending: '#f0c040',
    cancelled: '#ff5566',
    refunded: '#a78bfa',
  }
  return colors[status] || '#8aaac8'
}

export function getDirection(locale: string): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

export function getFontFamily(locale: string): string {
  return locale === 'ar' ? "'Cairo', sans-serif" : "'Inter', sans-serif"
}