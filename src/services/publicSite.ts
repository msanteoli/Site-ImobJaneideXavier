export interface PublicSiteConfig {
  logo_url?: string | null
  favicon_url?: string | null
  cor_acao?: string | null
  links?: Array<{ rotulo: string; url: string }>
  sobre?: {
    titulo?: string
    texto?: string
  }
  contato?: {
    endereco?: string
    horario?: string
    telefone?: string
    email?: string
  }
  redes?: {
    instagram?: string
    whatsapp?: string
  }
  versao?: number
  previa?: boolean
}

export interface SiteConfigLoadResult {
  config: PublicSiteConfig | null
  isPreview: boolean
  isExpiredPreview: boolean
}

export interface PublicBannerItem {
  id: string
  titulo: string
  subtitulo?: string
  texto_botao?: string
  imagem_desktop_url: string
  imagem_celular_url?: string
  destino_slug?: string
  tipo?: 'lancamento' | 'super_destaque'
}

export interface PublicHighlightItem {
  codigo: string
  titulo: string
  bairro: string
  preco: string | number
  foto_url?: string | null
}

export interface PublicMapCount {
  bairro: string
  quantidade: number
}

export interface PublicLancamentoDetail {
  titulo: string
  texto?: string
  galeria?: string[]
  imoveis?: PublicPropertyListItem[]
}

export interface PublicOrganization {
  name: string
  whatsapp_enabled: boolean
  whatsapp_url: string | null
}

export interface PublicNeighborhoodOption {
  name: string
  count: number
}

export interface PublicTypeOption {
  value: string
  count: number
}

export interface PublicPurposesCount {
  venda: number
  locacao: number
}

export interface PublicFiltersResponse {
  organization: PublicOrganization
  neighborhoods: PublicNeighborhoodOption[]
  types: PublicTypeOption[]
  purposes: PublicPurposesCount
}

export interface PriceDetail {
  state: 'informado' | 'consulte' | 'nao_informado'
  value: number | null
}

export interface PublicPropertyListItem {
  code: string
  title: string
  purpose: 'venda' | 'locacao' | 'ambos'
  type: string
  neighborhood: string
  city: string
  bedrooms: number
  bathrooms: number
  parking: number
  area: number
  condo_fee: number
  iptu: number
  sale: PriceDetail | null
  rent: PriceDetail | null
  cover: string | null
  highlight: 'comum' | 'destaque' | 'super_destaque'
}

export interface PublicPropertyListResponse {
  items: PublicPropertyListItem[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface PublicPropertyDetail extends PublicPropertyListItem {
  description: string
  photos: string[]
  condominium: {
    name: string
    amenities: string
    rules: string
  } | null
}

export interface SearchPropertiesParams {
  purpose?: string
  type?: string
  neighborhood?: string
  min_price?: number | string
  max_price?: number | string
  bedrooms?: number | string
  parking?: number | string
  sort?: 'recent' | 'price_asc' | 'price_desc'
  featured?: '0' | '1'
  page?: number | string
  per_page?: number | string
}

export interface SubmitLeadSearch {
  filters?: {
    neighborhood?: string
    type?: string
    purpose?: string
    bedrooms?: number
    max_price?: number
  }
  viewed?: string[]
}

export interface SubmitLeadPayload {
  name: string
  phone: string
  email?: string
  consent: true
  submission_id: string
  property_code?: string
  visit_start?: string
  search?: SubmitLeadSearch
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  gclid?: string
  fbclid?: string
  website?: string
}

export interface SubmitLeadResponse {
  ok: boolean
  whatsapp_url: string | null
  visit?: 'requested' | 'slot_taken' | 'invalid' | 'limit' | 'none' | string
}

// O site é um projeto separado: lê o servidor do sistema (VITE_API_BASE_URL)
// e sempre informa a imobiliária (VITE_ORG_SLUG).
const BACKEND = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const ORG = String(import.meta.env.VITE_ORG_SLUG || '')

export async function getFilters(): Promise<PublicFiltersResponse> {
  const url = `${BACKEND}/backend/v1/public/filters?org=${encodeURIComponent(ORG)}`
  const res = await fetch(url)
  if (!res.ok) {
    let msg = 'Erro ao carregar filtros da busca.'
    try {
      const err = await res.json()
      if (err && typeof err.message === 'string') {
        msg = err.message
      }
    } catch {
      // Ignora erro de JSON
    }
    throw new Error(msg)
  }
  return res.json()
}

export async function fetchSiteConfigDetailed(): Promise<SiteConfigLoadResult> {
  const baseEndpoint = `${BACKEND}/backend/v1/public/site/config?org=${encodeURIComponent(ORG)}`

  try {
    const res = await fetch(baseEndpoint)
    if (!res.ok) {
      return { config: null, isPreview: false, isExpiredPreview: false }
    }
    const data = (await res.json()) as PublicSiteConfig
    return {
      config: data,
      isPreview: false,
      isExpiredPreview: false,
    }
  } catch {
    return { config: null, isPreview: false, isExpiredPreview: false }
  }
}

export async function getSiteConfig(): Promise<PublicSiteConfig | null> {
  const result = await fetchSiteConfigDetailed()
  return result.config
}

export async function getSiteBanners(): Promise<PublicBannerItem[]> {
  try {
    const url = `${BACKEND}/backend/v1/public/site/banners?org=${encodeURIComponent(ORG)}`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    if (Array.isArray(data)) {
      return data.slice(0, 5)
    }
    return []
  } catch {
    return []
  }
}

export async function getSiteHighlights(): Promise<PublicHighlightItem[]> {
  try {
    const url = `${BACKEND}/backend/v1/public/site/highlights?org=${encodeURIComponent(ORG)}`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    if (Array.isArray(data)) {
      return data.slice(0, 10)
    }
    return []
  } catch {
    return []
  }
}

export async function getSiteMapCounts(): Promise<PublicMapCount[]> {
  try {
    const url = `${BACKEND}/backend/v1/public/site/map-counts?org=${encodeURIComponent(ORG)}`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    if (Array.isArray(data)) {
      return data
    }
    return []
  } catch {
    return []
  }
}

export async function getLancamento(slug: string): Promise<PublicLancamentoDetail> {
  const cleanSlug = encodeURIComponent(slug.trim())
  const url = `${BACKEND}/backend/v1/public/site/lancamentos/${cleanSlug}?org=${encodeURIComponent(ORG)}`
  const res = await fetch(url)
  if (!res.ok) {
    let msg = 'Lançamento não encontrado.'
    try {
      const err = await res.json()
      if (err && typeof err.message === 'string') {
        msg = err.message
      }
    } catch {
      // Ignora erro
    }
    const err = new Error(msg)
    ;(err as { status?: number }).status = res.status
    throw err
  }
  return res.json()
}

export async function searchProperties(
  params: SearchPropertiesParams = {},
): Promise<PublicPropertyListResponse> {
  const query = new URLSearchParams()
  query.set('org', ORG)

  if (params.purpose) query.set('purpose', params.purpose)
  if (params.type) query.set('type', params.type)
  if (params.neighborhood) query.set('neighborhood', params.neighborhood)
  if (params.min_price != null && params.min_price !== '') {
    query.set('min_price', String(params.min_price))
  }
  if (params.max_price != null && params.max_price !== '') {
    query.set('max_price', String(params.max_price))
  }
  if (params.bedrooms != null && params.bedrooms !== '') {
    query.set('bedrooms', String(params.bedrooms))
  }
  if (params.parking != null && params.parking !== '') {
    query.set('parking', String(params.parking))
  }
  if (params.featured) query.set('featured', params.featured)
  if (params.sort) query.set('sort', params.sort)
  if (params.page != null) query.set('page', String(params.page))
  if (params.per_page != null) query.set('per_page', String(params.per_page))

  const qs = query.toString()
  const url = `${BACKEND}/backend/v1/public/properties${qs ? `?${qs}` : ''}`
  const res = await fetch(url)
  if (!res.ok) {
    let msg = 'Erro ao buscar imóveis.'
    try {
      const err = await res.json()
      if (err && typeof err.message === 'string') {
        msg = err.message
      }
    } catch {
      // Ignora erro de JSON
    }
    throw new Error(msg)
  }
  return res.json()
}

export async function getProperty(code: string): Promise<PublicPropertyDetail> {
  const encoded = encodeURIComponent(code.trim())
  const url = `${BACKEND}/backend/v1/public/properties/${encoded}?org=${encodeURIComponent(ORG)}`
  const res = await fetch(url)
  if (!res.ok) {
    let msg = 'Erro ao obter dados do imóvel.'
    try {
      const err = await res.json()
      if (err && typeof err.message === 'string') {
        msg = err.message
      }
    } catch {
      // Ignora erro de JSON
    }
    const error = new Error(msg)
    ;(error as { status?: number }).status = res.status
    throw error
  }
  return res.json()
}

export async function submitLead(payload: SubmitLeadPayload): Promise<SubmitLeadResponse> {
  const url = `${BACKEND}/backend/v1/public/leads`

  // Monta objeto omitindo campos vazios
  const body: Record<string, unknown> = {
    org: ORG,
    name: payload.name,
    phone: payload.phone,
    consent: payload.consent,
    submission_id: payload.submission_id,
  }

  if (payload.email && payload.email.trim()) {
    body.email = payload.email.trim()
  }
  if (payload.property_code && payload.property_code.trim()) {
    body.property_code = payload.property_code.trim()
  }
  if (payload.visit_start && payload.visit_start.trim()) {
    body.visit_start = payload.visit_start.trim()
  }
  if (payload.search) {
    body.search = payload.search
  }
  if (payload.utm_source) body.utm_source = payload.utm_source
  if (payload.utm_medium) body.utm_medium = payload.utm_medium
  if (payload.utm_campaign) body.utm_campaign = payload.utm_campaign
  if (payload.gclid) body.gclid = payload.gclid
  if (payload.fbclid) body.fbclid = payload.fbclid
  if (payload.website !== undefined) body.website = payload.website

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    let msg = 'Erro ao enviar contato.'
    try {
      const err = await res.json()
      if (err && typeof err.message === 'string') {
        msg = err.message
      }
    } catch {
      // Ignora erro de JSON
    }
    throw new Error(msg)
  }
  return res.json()
}
