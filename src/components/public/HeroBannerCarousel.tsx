import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PublicBannerItem, PublicNeighborhoodOption, PublicTypeOption } from '@/services/publicSite'
import { FilterValues } from './SearchFilterBar'
import { SearchBubble } from './SearchBubble'
import { useTheme } from '@/contexts/ThemeContext'

interface HeroBannerCarouselProps {
  banners: PublicBannerItem[]
  values: FilterValues
  neighborhoods: PublicNeighborhoodOption[]
  types: PublicTypeOption[]
  onSearch: (newValues: FilterValues) => void
  onOpenMoreFilters: () => void
}

/**
 * Resolve o link de destino de acordo com a ordem de prioridade definida na spec:
 * 1) link_url
 * 2) destino_url
 * 3) /lancamentos/{destino_slug}
 * Sem nenhum dos três, o banner não é clicável.
 */
function getBannerDestination(banner: PublicBannerItem): {
  url: string | null
  isExternal: boolean
} {
  if (banner.link_url && banner.link_url.trim()) {
    const raw = banner.link_url.trim()
    const isExternal = /^https?:\/\//i.test(raw)
    return { url: raw, isExternal }
  }

  if (banner.destino_url && banner.destino_url.trim()) {
    const raw = banner.destino_url.trim()
    const isExternal = /^https?:\/\//i.test(raw)
    return { url: raw, isExternal }
  }

  if (banner.destino_slug && banner.destino_slug.trim()) {
    return {
      url: `/lancamentos/${encodeURIComponent(banner.destino_slug.trim())}`,
      isExternal: false,
    }
  }

  return { url: null, isExternal: false }
}

export const HeroBannerCarousel: React.FC<HeroBannerCarouselProps> = ({
  banners,
  values,
  neighborhoods,
  types,
  onSearch,
  onOpenMoreFilters,
}) => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const timerRef = useRef<number | null>(null)

  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const bannerCount = banners.length
  const hasBanners = bannerCount > 0

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Parallax suave da foto ao rolar: SÓ em desktop com mouse (pointer: fine); desligado em toque e prefers-reduced-motion
  useEffect(() => {
    if (prefersReducedMotion) return
    if (typeof window === 'undefined') return

    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    if (!hasFinePointer) return

    const handleScroll = () => {
      if (window.scrollY <= 1000) {
        setScrollY(window.scrollY)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [prefersReducedMotion])

  // Carrossel de banners automáticos
  const handleNextBanner = () => {
    if (bannerCount <= 1) return
    setCurrentBannerIndex((prev) => (prev + 1) % bannerCount)
  }

  const handlePrevBanner = () => {
    if (bannerCount <= 1) return
    setCurrentBannerIndex((prev) => (prev - 1 + bannerCount) % bannerCount)
  }

  useEffect(() => {
    if (prefersReducedMotion || bannerCount <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = window.setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerCount)
    }, 6000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [bannerCount, isPaused, prefersReducedMotion])

  const currentBanner = hasBanners ? banners[currentBannerIndex] : null
  const hasTitleOrButton = Boolean(
    currentBanner?.titulo?.trim() || currentBanner?.texto_botao?.trim(),
  )
  const destination = currentBanner
    ? getBannerDestination(currentBanner)
    : { url: null, isExternal: false }
  const isClickable = Boolean(destination.url)

  return (
    <section
      id="hero-banner-section"
      role="region"
      aria-label="Lançamentos e busca de imóveis"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="relative w-full h-[100svh] min-h-[560px] bg-neutral-950 text-white overflow-hidden flex flex-col justify-between"
    >
      {/* Camada de Banners ou Fallback com Parallax suave */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {hasBanners ? (
          banners.map((banner, idx) => {
            const isCurrent = idx === currentBannerIndex
            const bannerDest = getBannerDestination(banner)

            // Dia vs Noite (Ideia I5): no tema escuro, se houver imagem_noite_* use-a; senão use a padrão
            const desktopDay = banner.imagem_desktop_url
            const mobileDay = banner.imagem_celular_url || desktopDay
            const desktopNight = banner.imagem_noite_desktop_url || desktopDay
            const mobileNight = banner.imagem_noite_celular_url || desktopNight

            const desktopImg = isDark ? desktopNight : desktopDay
            const mobileImg = isDark ? mobileNight : mobileDay

            const bannerHasTitleOrButton = Boolean(
              banner.titulo?.trim() || banner.texto_botao?.trim(),
            )
            const isBannerOnlyImage = !bannerHasTitleOrButton

            // Renderização da imagem com Ken Burns
            const imageElement = (
              <div
                className="w-full h-full relative"
                style={{
                  transform: scrollY > 0 ? `translate3d(0, ${scrollY * 0.25}px, 0)` : undefined,
                  willChange: 'transform, opacity',
                }}
              >
                <picture className="w-full h-full block">
                  {mobileImg && <source media="(max-width: 640px)" srcSet={mobileImg} />}
                  <img
                    key={`${banner.id || idx}-${isDark ? 'dark' : 'light'}`}
                    src={desktopImg}
                    alt={banner.titulo || 'Banner imobiliário'}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${
                      isCurrent ? 'ken-burns' : ''
                    }`}
                  />
                </picture>

                {/* Se NÃO houver título e botão, overlay sutil para manter legibilidade do cabeçalho/base */}
                {isBannerOnlyImage ? (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40 pointer-events-none" />
                ) : (
                  /* Com título/botão: overlay cinematográfico escuro */
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/40 pointer-events-none" />
                )}
              </div>
            )

            return (
              <div
                key={banner.id || idx}
                aria-hidden={!isCurrent}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* Se for banner só de imagem e tiver link: a imagem inteira é o link */}
                {isBannerOnlyImage && bannerDest.url && isCurrent ? (
                  bannerDest.isExternal ? (
                    <a
                      href={bannerDest.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={banner.titulo || 'Ver detalhes do banner'}
                      className="block w-full h-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                    >
                      {imageElement}
                    </a>
                  ) : (
                    <Link
                      to={bannerDest.url}
                      aria-label={banner.titulo || 'Ver detalhes do banner'}
                      className="block w-full h-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                    >
                      {imageElement}
                    </Link>
                  )
                ) : (
                  imageElement
                )}
              </div>
            )
          })
        ) : (
          <div className="absolute inset-0 bg-neutral-950">
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/40" />
          </div>
        )}
      </div>

      {/* Conteúdo Central/Lateral da Hero */}
      <div className="w-full flex-1 flex flex-col justify-end relative z-20 px-4 sm:px-6 pb-20 sm:pb-20">
        <div className="max-w-7xl mx-auto w-full flex flex-col items-start space-y-4">
          {/* Se houver banner com título e/ou botão: exibe alinhado à esquerda com overlay escuro só na faixa */}
          {hasBanners && currentBanner && hasTitleOrButton && (
            <div className="max-w-2xl text-left space-y-3 animate-in fade-in duration-300">
              {currentBanner.titulo?.trim() && (
                <div className="inline-block p-4 sm:p-5 rounded-[20px] bg-black/60 dark:bg-black/70 backdrop-blur-md border border-white/10 shadow-2xl">
                  <h1 className="hero-title text-white drop-shadow-md text-left">
                    {currentBanner.titulo}
                  </h1>
                </div>
              )}

              {/* Botão de ação (se houver texto_botao ou se tiver destino clicável) */}
              {isClickable &&
                (currentBanner.texto_botao?.trim() || currentBanner.tipo === 'lancamento') && (
                  <div className="pt-1">
                    {destination.isExternal ? (
                      <a
                        href={destination.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-95 transition-all duration-200 min-h-[44px] shadow-lg"
                      >
                        {currentBanner.texto_botao?.trim() ||
                          (currentBanner.tipo === 'lancamento'
                            ? 'Conhecer lançamento'
                            : 'Saiba mais')}
                      </a>
                    ) : (
                      <Link
                        to={destination.url!}
                        className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-95 transition-all duration-200 min-h-[44px] shadow-lg"
                      >
                        {currentBanner.texto_botao?.trim() ||
                          (currentBanner.tipo === 'lancamento'
                            ? 'Conhecer lançamento'
                            : 'Saiba mais')}
                      </Link>
                    )}
                  </div>
                )}
            </div>
          )}

          {/* Sem banners: fallback atual "Encontre seu imóvel" */}
          {!hasBanners && (
            <div className="max-w-2xl text-left space-y-3 animate-in fade-in duration-300">
              <div className="inline-block p-4 sm:p-5 rounded-[20px] bg-black/60 dark:bg-black/70 backdrop-blur-md border border-white/10 shadow-2xl">
                <h1 className="hero-title text-white drop-shadow-md">Encontre seu imóvel</h1>
                <p className="text-sm sm:text-base text-white/90 pt-1">
                  Casas, apartamentos e terrenos para comprar e alugar em Feira de Santana.
                </p>
              </div>
            </div>
          )}

          {/* Busca em bolha: no canto inferior esquerdo da hero, acima do contador de slides */}
          <div className="pt-2">
            <SearchBubble
              values={values}
              neighborhoods={neighborhoods}
              types={types}
              onSearch={onSearch}
              onOpenMoreFilters={onOpenMoreFilters}
            />
          </div>
        </div>
      </div>

      {/* Metadados inferiores: linha fina na base da hero com subtítulo, tipo e contador/setas */}
      <div className="relative z-20 w-full border-t border-white/15 bg-black/40 backdrop-blur-sm px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs sm:text-sm">
          {/* Lado esquerdo: Subtítulo e Tipo */}
          <div className="flex items-center gap-3 min-w-0">
            {hasBanners && currentBanner ? (
              <>
                <span className="font-semibold uppercase tracking-wider text-primary text-[11px] sm:text-xs shrink-0">
                  {currentBanner.tipo === 'lancamento'
                    ? 'Lançamento'
                    : currentBanner.tipo === 'super_destaque'
                      ? 'Destaque'
                      : 'Destaque'}
                </span>
                {currentBanner.subtitulo && (
                  <>
                    <span className="text-white/30 shrink-0">|</span>
                    <span className="text-white/80 truncate text-xs sm:text-sm">
                      {currentBanner.subtitulo}
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-white/70 text-xs sm:text-sm">
                Imóveis selecionados em Feira de Santana
              </span>
            )}
          </div>

          {/* Lado direito: Contador 01 / 05 e setas de navegação (some se houver um só banner) */}
          {bannerCount > 1 && (
            <div className="flex items-center gap-3 shrink-0">
              <span className="tabular font-mono text-xs sm:text-sm text-white/90">
                {String(currentBannerIndex + 1).padStart(2, '0')} /{' '}
                {String(bannerCount).padStart(2, '0')}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevBanner}
                  aria-label="Banner anterior"
                  className="w-8 h-8 rounded-full border border-white/20 bg-white/5 hover:bg-white/20 text-white flex items-center justify-center transition-colors min-w-[32px] min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextBanner}
                  aria-label="Próximo banner"
                  className="w-8 h-8 rounded-full border border-white/20 bg-white/5 hover:bg-white/20 text-white flex items-center justify-center transition-colors min-w-[32px] min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default HeroBannerCarousel
