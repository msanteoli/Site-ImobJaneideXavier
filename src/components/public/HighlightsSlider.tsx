import React, { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { PublicHighlightItem, PublicPropertyListItem } from '@/services/publicSite'
import { getFullPhotoUrl, formatPrice } from '@/lib/publicSiteUtils'

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
  const scrollRef = useRef<HTMLDivElement>(null)

  // Normaliza lista de até 10 itens
  const items: UnifiedHighlightItem[] = React.useMemo(() => {
    if (highlights && highlights.length > 0) {
      return highlights.slice(0, 10).map((h) => ({
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

    if (fallbackProperties && fallbackProperties.length > 0) {
      return fallbackProperties
        .filter((p) => Boolean(p.cover))
        .slice(0, 10)
        .map((p) => {
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

    return []
  }, [highlights, fallbackProperties])

  if (items.length === 0) return null

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' })
    }
  }

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' })
    }
  }

  return (
    <section
      aria-label="Imóveis em destaque"
      className="w-full bg-muted/40 py-8 border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        {/* Cabeçalho da seção com controles */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Destaques
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Seleção exclusiva de imóveis para você
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleScrollLeft}
              aria-label="Rolar destaques para a esquerda"
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-colors shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleScrollRight}
              aria-label="Rolar destaques para a direita"
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-colors shadow-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Trilha do Slide com cartões de tamanho idêntico */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory"
        >
          {items.map((item) => {
            const photoUrl = getFullPhotoUrl(item.foto_url)

            return (
              <Link
                key={item.codigo}
                to={`/buscar/${encodeURIComponent(item.codigo)}`}
                className="snap-start shrink-0 w-[260px] sm:w-[280px] bg-card rounded-[16px] border border-border overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {/* Imagem do cartão com tamanho padronizado */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted flex items-center justify-center">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={item.titulo}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-4">
                      <Home className="h-8 w-8 stroke-[1.5]" />
                      <span className="text-xs mt-1 font-medium">Sem foto</span>
                    </div>
                  )}
                  <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded-full font-mono">
                    Cód. {item.codigo}
                  </div>
                </div>

                {/* Conteúdo do cartão com altura uniforme */}
                <div className="p-4 flex-1 flex flex-col justify-between text-left space-y-2">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {item.titulo}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.bairro}</p>
                  </div>
                  <div className="pt-2 border-t border-border/60">
                    <span className="text-xs text-muted-foreground block">Valor</span>
                    <span className="text-sm sm:text-base font-bold text-foreground tabular">
                      {item.preco}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
