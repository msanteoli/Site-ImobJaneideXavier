import { PriceDetail } from '@/services/publicSite'

export const PUBLIC_PROPERTY_TYPE_LABELS: Record<string, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
  comercial: 'Sala ou loja comercial',
  galpao: 'Galpão',
  chacara: 'Chácara ou sítio',
  outro: 'Outro',
}

export function formatPrice(price: PriceDetail | null, purpose: 'sale' | 'rent'): string {
  if (!price) return ''
  if (price.state === 'consulte') return 'Consulte'
  if (price.state === 'nao_informado') return 'Valor não informado'
  if (price.state === 'informado' && price.value != null) {
    const formatted = price.value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
    return purpose === 'rent' ? `${formatted}/mês` : formatted
  }
  return 'Valor não informado'
}

export function formatCurrencyBR(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

export function getFullPhotoUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

export function buildSpecsSummary(props: {
  bedrooms?: number
  bathrooms?: number
  parking?: number
  area?: number
}): string {
  const parts: string[] = []

  if (props.bedrooms && props.bedrooms > 0) {
    parts.push(`${props.bedrooms} ${props.bedrooms === 1 ? 'quarto' : 'quartos'}`)
  }
  if (props.bathrooms && props.bathrooms > 0) {
    parts.push(`${props.bathrooms} ${props.bathrooms === 1 ? 'banheiro' : 'banheiros'}`)
  }
  if (props.parking && props.parking > 0) {
    parts.push(`${props.parking} ${props.parking === 1 ? 'vaga' : 'vagas'}`)
  }
  if (props.area && props.area > 0) {
    parts.push(`${props.area} m²`)
  }

  return parts.join(' · ')
}

/**
 * Formata um horário de visita (ISO string) no horário da Bahia (UTC-3),
 * no formato usado na ficha do imóvel: "qui 08/10 às 14:00" ou similar.
 * Se apenas a data for necessária, usa "qui 08/10".
 */
export function formatVisitSlot(isoString?: string | null): string {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return String(isoString)

    const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

    // Considera UTC-3 (Bahia / horário de Brasília sem horário de verão)
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Bahia',
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    const parts = formatter.formatToParts(d)
    const partMap: Record<string, string> = {}
    for (const p of parts) {
      partMap[p.type] = p.value
    }

    const weekdayShort = (partMap.weekday || '').replace('.', '').toLowerCase()
    const day = partMap.day || ''
    const month = partMap.month || ''
    const hour = partMap.hour || ''
    const minute = partMap.minute || ''

    const diaLabel = weekdayShort || dias[d.getDay()] || ''

    return `${diaLabel} ${day}/${month} às ${hour}:${minute}`
  } catch {
    return String(isoString)
  }
}
