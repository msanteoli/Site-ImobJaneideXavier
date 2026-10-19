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

export function getFullPhotoUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const trimmed = path.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  if (trimmed.startsWith('/')) {
    return `${base}${trimmed}`
  }
  return `${base}/${trimmed}`
}

/**
 * Utilitário específico para URLs de imagens e favicon:
 * endereço que comece com "/" prefixa VITE_API_BASE_URL;
 * endereço que já comece com "http" passa direto.
 */
export function resolveAssetUrl(url?: string | null): string | null {
  return getFullPhotoUrl(url)
}

/**
 * Validador e normalizador de URLs https:// para links e redes
 */
export function sanitizeHttpsUrl(url?: string | null): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (/^https:\/\//i.test(trimmed)) {
    return trimmed
  }
  return null
}

/**
 * Limpa e formata número para link tel:
 * Aceita números com dígitos (ex: (75) 99999-9999, 5575999999999, +55 75 99999-9999)
 */
export function sanitizeTelUrl(phone?: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/[^\d+]/g, '')
  if (!digits || digits.replace(/[^\d]/g, '').length < 8) return null
  return `tel:${digits}`
}

/**
 * Limpa e formata e-mail para link mailto:
 */
export function sanitizeMailtoUrl(email?: string | null): string | null {
  if (!email) return null
  const trimmed = email.trim()
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return `mailto:${trimmed}`
  }
  return null
}

/**
 * Converte cor hex (#RRGGBB ou #RGB) para HSL string no formato aceito pelo tema ("H S% L%"),
 * e calcula a cor de contraste apropriada (preto ou branco) para --primary-foreground.
 */
export function hexToHslValues(
  hexStr?: string | null,
): { primaryHsl: string; foregroundHsl: string } | null {
  if (!hexStr) return null
  const trimmed = hexStr.trim()
  const hexMatch =
    trimmed.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i) ||
    trimmed.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i)
  if (!hexMatch) return null

  let r: number, g: number, b: number
  if (hexMatch[1].length === 1) {
    r = parseInt(hexMatch[1] + hexMatch[1], 16) / 255
    g = parseInt(hexMatch[2] + hexMatch[2], 16) / 255
    b = parseInt(hexMatch[3] + hexMatch[3], 16) / 255
  } else {
    r = parseInt(hexMatch[1], 16) / 255
    g = parseInt(hexMatch[2], 16) / 255
    b = parseInt(hexMatch[3], 16) / 255
  }

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  const deg = Math.round(h * 360)
  const sat = Math.round(s * 100)
  const lum = Math.round(l * 100)

  // Luminância relativa para cálculo de contraste WCAG
  const sRGB = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })
  const relativeLuminance = 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]

  // Se a cor for clara (luminância relativa > 0.45), usa preto no texto, senão branco
  const foregroundHsl = relativeLuminance > 0.45 ? '0 0% 4%' : '0 0% 100%'

  return {
    primaryHsl: `${deg} ${sat}% ${lum}%`,
    foregroundHsl,
  }
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
