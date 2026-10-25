import React from 'react'
import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import { PublicHighlightItem, PublicPropertyListItem } from '@/services/publicSite'
import { getFullPhotoUrl, formatPrice } from '@/lib/publicSiteUtils'
import { Reveal } from '@/components/public/Reveal'

export interface UnifiedHighlightItem {
  codigo: string
  titulo: string
  bairro: string
  preco: string
  foto_url?: string | null
}

interface HighlightsSliderProps {
  highlights?: PublicHighlightItem[]
  fallbackProperties?: PublicPropertyListItem[]
}

export const HighlightsSlider: React.FC<HighlightsSliderProps> = ({
  highlights = [],
  fallbackProperties = [],
}) => {
  // Normaliza lista de até 10 itens com filtros de segurança
  // REGRA DOS TRÊS TIPOS DE IMÓVEL:
  // - Super-destaque: nunca na seção de destaques (fica na hero).
  // - Destaque: aparece na seção de quadros de destaque.
  // - Catálogo: nunca na seção de destaques (só na busca).
  const items: UnifiedHighlightItem[] = React.useMemo(() => {
    // 1. Caso haja destaques enviados pelo servidor
    if (highlights && highlights.length > 0) {
      // Filtro de segurança: descarte qualquer item com highlight === 'super_destaque' ou que não seja destaque.
      // Se o item não trouxer o campo highlight (undefined/null), mostre-o (o servidor já filtra na rota highlights).
      const validHighlights = highlights.filter((h) => {
        if (!h) return false
        if (h.highlight === 'super_destaque') return false
        if (h.highlight === 'comum') return false
        // Se tiver highlight definido, precisa ser 'destaque'
        if (h.highlight !== undefined && h.highlight !== 'destaque') return false
        return true
      })

      if (validHighlights.length > 0) {
        return validHighlights.slice(0, 10).map((h) => ({
          codigo: h.codigo,
          titulo: h.titulo,
          bairro: h.bairro,
          preco:
            typeof h.preco === 'number'
              ? `R$ ${h.preco.toLocaleString('pt-BR')}`
              : String(h.preco || 'Consulte'),
          foto_url: h.foto_url,
        }))
      }
    }

    // 2. Fallback quando vazio: imóveis mais recentes com foto
    // Filtro estrito: descartar super-destaques e catálogo comum (apenas destaque quando informado,
    // e caso fallbackProperties contenha itens com highlight 'destaque', prioriza ou usa imóveis com foto sem super-destaque nem comum)
    if (fallbackProperties && fallbackProperties.length > 0) {
      // Exclui expressamente super_destaque e comum (catálogo)
      const validFallback = fallbackProperties.filter((p) => {
        if (!p || !p.cover) return false
        if (p.highlight === 'super_destaque') return false
        if (p.highlight === 'comum') return false
        return true
      })

      if (validFallback.length > 0) {
        return validFallback.slice(0, 10).map((p) => {
          const s = p.sale ? formatPrice(p.sale, 'sale') : null
          const r = p.rent ? formatPrice(p.rent, 'rent') : null
          return {
            codigo: p.code,
            titulo: p.title,
            bairro: [p.neighborhood, p.city].filter(Boolean).join(', ') || 'Feira de Santana',
            preco: s || r || 'Consulte',
            foto_url: p.cover,
          }
        })
      }
    }

    return []
  }, [highlights, fallbackProperties])

  // Se não houver destaques nem fallback válido, a seção não aparece
  if (items.length === 0) return null

  return (
    <section
      aria-label="Imóveis em destaque"
      className="w-full bg-background py-14 sm:py-20 border-b border-border overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Cabeçalho da seção com rótulo numerado B3 */}
        <div className="space-y-2 text-left">
          <span className="section-label">01 — Destaques</span>
          <h2 className="section-title text-foreground">Imóveis selecionados</h2>
        </div>

        {/* Grade de quadros B3: 4 colunas em 1440px (2xl), 3 em 1024px (lg), 2 em 640px (sm), 1 no celular */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {items.map((item, index) => {
            const photoUrl = getFullPhotoUrl(item.foto_url)
            const itemNumber = String(index + 1).padStart(2, '0')

            return (
              <Reveal key={item.codigo} delay={index * 60} className="h-full flex flex-col">
                <Link
                  to={`/buscar/${encodeURIComponent(item.codigo)}`}
                  className="group relative w-full h-full bg-card rounded-[16px] border border-border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {/* Foto alta (proporção 3:4) ocupando o quadro */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted flex items-center justify-center">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={item.titulo}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out [@media(hover:hover)]:group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-4">
                        <Home className="h-8 w-8 stroke-[1.5]" />
                        <span className="text-xs mt-1 font-medium">Sem foto</span>
                      </div>
                    )}

                    {/* Overlay escuro leve no hover (só em dispositivos com hover) */}
                    <div className="absolute inset-0 bg-black/0 [@media(hover:hover)]:group-hover:bg-black/35 transition-colors duration-300 pointer-events-none" />

                    {/* Gradiente sutil na base da foto para garantir leitura dos metadados */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                    {/* Número "01", "02"... no canto superior esquerdo */}
                    <div className="absolute top-3.5 left-3.5 bg-black/60 backdrop-blur-md text-white text-[12px] font-mono font-medium px-2.5 py-1 rounded-md border border-white/10">
                      {itemNumber}
                    </div>

                    {/* Código do imóvel no canto superior direito */}
                    <div className="absolute top-3.5 right-3.5 bg-black/60 backdrop-blur-md text-white/90 text-[11px] font-mono px-2 py-0.5 rounded-md border border-white/10">
                      #{item.codigo}
                    </div>

                    {/* Metadados na base da foto (bairro, título e preço) com contraste AA garantido */}
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white text-left space-y-1">
                      <p className="text-[11px] uppercase tracking-wider text-white/80 font-medium truncate">
                        {item.bairro}
                      </p>
                      <h3 className="font-semibold text-base sm:text-lg text-white line-clamp-1 drop-shadow-sm">
                        {item.titulo}
                      </h3>
                      <div className="pt-1 flex items-baseline justify-between">
                        <span className="text-base sm:text-lg font-bold text-white tabular drop-shadow-sm">
                          {item.preco}
                        </span>
                        <span className="text-xs font-medium text-white/90 underline underline-offset-2 opacity-90 group-hover:opacity-100 transition-opacity">
                          Ver detalhes
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
