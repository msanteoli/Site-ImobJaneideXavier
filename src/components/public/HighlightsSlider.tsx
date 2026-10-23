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
      className="w-full bg-muted/40 py-10 sm:py-14 border-b border-border overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Cabeçalho da seção */}
        <div className="space-y-1 text-left">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Destaques
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Imóveis em destaque</p>
        </div>

        {/* Grade de quadros: 1 coluna no celular, 2 em 768 px (md), 3 em 1280 px (xl) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((item, index) => {
            const photoUrl = getFullPhotoUrl(item.foto_url)

            return (
              <Reveal key={item.codigo} delay={index * 50} className="h-full flex flex-col">
                <Link
                  to={`/buscar/${encodeURIComponent(item.codigo)}`}
                  className="w-full h-full bg-card rounded-[16px] border border-border overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {/* Foto grande com reveal (.reveal-photo) ao entrar na tela */}
                  <Reveal
                    variant="photo"
                    delay={index * 50}
                    className="relative aspect-[16/10] w-full overflow-hidden bg-muted flex items-center justify-center"
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={item.titulo}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-4">
                        <Home className="h-8 w-8 stroke-[1.5]" />
                        <span className="text-xs mt-1 font-medium">Sem foto</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-sm text-white text-[11px] px-2.5 py-0.5 rounded-full font-mono shadow-sm">
                      Cód. {item.codigo}
                    </div>
                  </Reveal>

                  {/* Conteúdo do quadro com altura uniforme */}
                  <div className="p-5 flex-1 flex flex-col justify-between text-left space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-base sm:text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {item.titulo}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                        {item.bairro}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-border/60 flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground block">Valor</span>
                        <span className="text-base sm:text-lg font-bold text-foreground tabular">
                          {item.preco}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-primary group-hover:underline">
                        Ver detalhes &rarr;
                      </span>
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
