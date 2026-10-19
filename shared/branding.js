export const PROFESSIONAL_NAME = 'Patrick Chukwu'
export const PUBLIC_EMAIL = 'chukwupatrickify@gmail.com'
export const DEFAULT_CURRENCY = 'NGN'

export const CURRENCIES = [
  { code: 'NGN', label: 'Nigerian naira (NGN)' },
  { code: 'USD', label: 'US dollar (USD)' },
  { code: 'GBP', label: 'British pound (GBP)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GHS', label: 'Ghanaian cedi (GHS)' },
  { code: 'KES', label: 'Kenyan shilling (KES)' },
  { code: 'ZAR', label: 'South African rand (ZAR)' },
  { code: 'CAD', label: 'Canadian dollar (CAD)' },
]

export const PAYMENT_METHODS = [
  { id: 'bank_transfer', label: 'Bank transfer' },
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Card' },
  { id: 'other', label: 'Other' },
]

export const STATUS_LABELS = {
  draft: 'Draft',
  issued: 'Issued',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

export function currencyAllowed(code) {
  return CURRENCIES.some((item) => item.code === code)
}

export function methodLabel(id) {
  return PAYMENT_METHODS.find((item) => item.id === id)?.label || id
}
