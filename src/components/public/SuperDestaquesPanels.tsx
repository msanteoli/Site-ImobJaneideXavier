import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { PublicSuperDestaqueItem } from '@/services/publicSite'
import { getFullPhotoUrl, formatPrice, PUBLIC_PROPERTY_TYPE_LABELS } from '@/lib/publicSiteUtils'
import { Reveal } from '@/components/public/Reveal'

interface SuperDestaquesPanelsProps {
  items: PublicSuperDestaqueItem[]
}

export const SuperDestaquesPanels: React.FC<SuperDestaquesPanelsProps> = ({ items }) => {
  const navigate = useNavigate()

  // Painel atualmente aberto / em foco
  // No desktop: hover ou foco alarga (flex-grow).
  // No celular: primeiro toque abre; segundo toque navega.
  const [activeCode, setActiveCode] = useState<string | null>(null)
  const [hoveredCode, setHoveredCode] = useState<string | null>(null)
  const [focusedCode, setFocusedCode] = useState<string | null>(null)

  // Embla carousel para navegar horizontalmente em qualquer breakpoint
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
  })

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Detecta se dispositivo tem toque primário
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isTouch = window.matchMedia('(pointer: coarse)').matches
      setIsTouchDevice(isTouch)
    }
  }, [])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()

  if (!items || items.length === 0) {
    return null
  }

  // Verifica suporte a prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Trata clique do item
  const handleItemClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: PublicSuperDestaqueItem,
  ) => {
    const isExternal = Boolean(item.landing_url && /^https?:\/\//i.test(item.landing_url))
    const dest = item.landing_url || `/buscar/${encodeURIComponent(item.code)}`

    // No celular / touch: se ainda não é o ativo, o primeiro toque apenas abre
    if (isTouchDevice && !prefersReducedMotion) {
      if (activeCode !== item.code) {
        e.preventDefault()
        setActiveCode(item.code)
        return
      }
    }

    // Se é link externo, deixa o comportamento normal
    if (isExternal) {
      return
    }

    // Destino interno com View Transitions API quando suportada
    if (
      !prefersReducedMotion &&
      typeof document !== 'undefined' &&
      'startViewTransition' in document
    ) {
      e.preventDefault()
      const docWithVT = document as unknown as {
        startViewTransition: (cb: () => void) => void
      }
      docWithVT.startViewTransition(() => {
        navigate(dest)
      })
      return
    }
  }

  return (
    <section
      aria-label="Super-destaques de imóveis"
      className="w-full bg-background py-14 sm:py-20 border-b border-border overflow-hidden select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Cabeçalho da seção: 01 — Super-destaques e controles de navegação */}
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2 text-left">
            <span className="section-label">01 — Super-destaques</span>
            <h2 className="section-title text-foreground">Imóveis em destaque exclusivo</h2>
          </div>

          {/* Setas "anterior" e "próximo" nas pontas quando houver mais painéis do que os visíveis */}
          {(canScrollPrev || canScrollNext || items.length > 2) && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                aria-label="Super-destaque anterior"
                className="w-11 h-11 rounded-full border border-border bg-card hover:bg-muted disabled:opacity-30 disabled:pointer-events-none text-foreground flex items-center justify-center transition-colors min-w-[44px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={!canScrollNext}
                aria-label="Próximo super-destaque"
                className="w-11 h-11 rounded-full border border-border bg-card hover:bg-muted disabled:opacity-30 disabled:pointer-events-none text-foreground flex items-center justify-center transition-colors min-w-[44px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Embla Carousel Viewport */}
        <div className="overflow-hidden" ref={emblaRef}>
          {/* Container flex com transição suave */}
          <div className="flex -ml-4 py-2">
            {items.map((item, index) => {
              const itemNumber = String(index + 1).padStart(2, '0')
              const isExternal = Boolean(item.landing_url && /^https?:\/\//i.test(item.landing_url))
              const dest = item.landing_url || `/buscar/${encodeURIComponent(item.code)}`

              const isOpened =
                prefersReducedMotion ||
                (isTouchDevice
                  ? activeCode === item.code
                  : hoveredCode === item.code || focusedCode === item.code)

              // Capa e segunda foto (para crossfade ao abrir)
              const coverUrl = getFullPhotoUrl(item.cover || (item.photos && item.photos[0]))
              const secondPhotoUrl =
                item.photos && item.photos.length > 1 ? getFullPhotoUrl(item.photos[1]) : null

              // Tipo formatado e bairro
              const typeLabel = PUBLIC_PROPERTY_TYPE_LABELS[item.type] || item.type
              const locationLabel = [item.neighborhood, item.city].filter(Boolean).join(', ')

              // Preço formatado
              const salePrice = item.sale ? formatPrice(item.sale, 'sale') : null
              const rentPrice = item.rent ? formatPrice(item.rent, 'rent') : null
              const priceDisplay = salePrice || rentPrice || 'Consulte'

              // View-transition-name exclusivo para destinos internos
              const vtName = !isExternal ? `property-photo-${item.code}` : undefined

              return (
                <div
                  key={item.code}
                  className={`min-w-0 pl-4 shrink-0 transition-[flex-basis,flex-grow] duration-500 ease-out ${
                    // 4 visíveis a partir de 1024px (basis-1/4), 2 visíveis abaixo disso (basis-1/2)
                    // Ao abrir (no desktop): alarga (ex: basis-[40%] no lg ou grow-[1.8])
                    isOpened && !prefersReducedMotion
                      ? 'basis-[68%] sm:basis-[55%] lg:basis-[36%] xl:basis-[34%]'
                      : 'basis-[50%] sm:basis-[45%] lg:basis-[25%]'
                  }`}
                >
                  <Reveal delay={index * 50} className="h-full">
                    <Link
                      to={dest}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      onClick={(e) => handleItemClick(e, item)}
                      onMouseEnter={() => {
                        if (!isTouchDevice) setHoveredCode(item.code)
                      }}
                      onMouseLeave={() => {
                        if (!isTouchDevice) setHoveredCode(null)
                      }}
                      onFocus={() => {
                        setFocusedCode(item.code)
                      }}
                      onBlur={() => {
                        setFocusedCode(null)
                      }}
                      viewTransition={!isExternal}
                      aria-label={`${item.title} — ${typeLabel} em ${item.neighborhood}`}
                      className="super-destaque-panel group relative block w-full h-[80svh] min-h-[520px] rounded-[16px] overflow-hidden bg-neutral-900 border border-border shadow-md hover:shadow-xl transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {/* 1. Camada de Imagens de Fundo com Crossfade */}
                      <div className="absolute inset-0 overflow-hidden bg-muted">
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={item.title}
                            style={{ viewTransitionName: vtName }}
                            className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
                              isOpened && secondPhotoUrl ? 'opacity-0' : 'opacity-100'
                            }`}
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/60">
                            <Home className="h-12 w-12 stroke-[1.5]" />
                            <span className="text-xs mt-2 font-medium">Sem foto</span>
                          </div>
                        )}

                        {/* Segunda foto para crossfade quando o painel se abre */}
                        {secondPhotoUrl && (
                          <img
                            src={secondPhotoUrl}
                            alt={`${item.title} - Vista alternativa`}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out pointer-events-none ${
                              isOpened ? 'opacity-100' : 'opacity-0'
                            }`}
                            loading="lazy"
                          />
                        )}

                        {/* Overlay escuro leve para leitura de textos */}
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300 pointer-events-none" />

                        {/* Gradiente sutil no topo para o título e na base para o preço/bairro */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/85 pointer-events-none" />
                      </div>

                      {/* 2. Topo: Número no topo na cor da ação principal (text-primary) e title em CAIXA ALTA */}
                      <div className="absolute top-0 inset-x-0 p-4 sm:p-5 text-left z-10 space-y-1">
                        <div className="text-primary font-bold font-mono text-xl sm:text-2xl drop-shadow-sm tracking-tight">
                          {itemNumber}
                        </div>
                        <h3 className="font-bold text-white uppercase text-sm sm:text-base tracking-wide line-clamp-2 drop-shadow-md leading-tight">
                          {item.title}
                        </h3>
                      </div>

                      {/* 3. Lateral inferior esquerda: texto vertical rotacionado 90° com tipo e bairro em letras pequenas */}
                      <div className="absolute left-2 sm:left-3 bottom-24 z-10 origin-bottom-left -rotate-90 pointer-events-none">
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold text-white/80 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-sm border border-white/10 whitespace-nowrap shadow-sm">
                          {typeLabel} · {item.neighborhood}
                        </span>
                      </div>

                      {/* 4. Base do painel: quando aberto (ou com reduced motion), mostra o bairro e o preço com transição */}
                      <div
                        className={`absolute inset-x-0 bottom-0 p-4 sm:p-5 z-10 text-left transition-all duration-500 ${
                          isOpened
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-3 pointer-events-none'
                        }`}
                      >
                        <div className="p-3 sm:p-4 rounded-[12px] bg-black/75 backdrop-blur-md border border-white/15 space-y-1 shadow-lg">
                          <p className="text-xs uppercase tracking-wider text-white/80 font-medium truncate">
                            {locationLabel}
                          </p>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-base sm:text-lg font-bold text-white tabular drop-shadow-sm">
                              {priceDisplay}
                            </span>
                            <span className="text-xs font-semibold text-primary underline underline-offset-2">
                              Ver imóvel
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default SuperDestaquesPanels
