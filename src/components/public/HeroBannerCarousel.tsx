import React, { useState, useEffect, useRef, useId } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import { PublicBannerItem, PublicNeighborhoodOption, PublicTypeOption } from '@/services/publicSite'
import { FilterValues } from './SearchFilterBar'

interface HeroBannerCarouselProps {
  banners: PublicBannerItem[]
  values: FilterValues
  neighborhoods: PublicNeighborhoodOption[]
  types: PublicTypeOption[]
  onSearch: (newValues: FilterValues) => void
  onOpenMoreFilters: () => void
}

function normalizeStr(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export const HeroBannerCarousel: React.FC<HeroBannerCarouselProps> = ({
  banners,
  values,
  neighborhoods,
  onSearch,
  onOpenMoreFilters,
}) => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [purpose, setPurpose] = useState<'venda' | 'locacao'>(values.purpose || 'venda')
  const [neighborhoodInput, setNeighborhoodInput] = useState(values.neighborhood || '')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [scrollY, setScrollY] = useState(0)
  const listboxId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<number | null>(null)

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
      // Limita o cálculo aos primeiros 800px da página
      if (window.scrollY <= 1000) {
        setScrollY(window.scrollY)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [prefersReducedMotion])

  // Sincroniza propósito e input com valores externos
  useEffect(() => {
    setPurpose(values.purpose || 'venda')
    setNeighborhoodInput(values.neighborhood || '')
  }, [values])

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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

  // Normalização e busca de bairros
  const queryNorm = normalizeStr(neighborhoodInput)
  const filteredNeighborhoods = neighborhoods.filter((n) => {
    if (!queryNorm) return true
    return normalizeStr(n.name).includes(queryNorm)
  })

  const triggerSearch = (overrideNeighborhood?: string) => {
    const finalNeighborhood =
      overrideNeighborhood !== undefined ? overrideNeighborhood : neighborhoodInput.trim()

    onSearch({
      ...values,
      purpose,
      neighborhood: finalNeighborhood,
    })
    setSuggestionsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!suggestionsOpen) {
        setSuggestionsOpen(true)
        setHighlightedIndex(0)
      } else {
        setHighlightedIndex((prev) => (prev < filteredNeighborhoods.length - 1 ? prev + 1 : prev))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (suggestionsOpen) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestionsOpen && highlightedIndex >= 0 && filteredNeighborhoods[highlightedIndex]) {
        const chosen = filteredNeighborhoods[highlightedIndex].name
        setNeighborhoodInput(chosen)
        triggerSearch(chosen)
      } else {
        triggerSearch()
      }
    } else if (e.key === 'Escape') {
      setSuggestionsOpen(false)
    }
  }

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
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {hasBanners ? (
          banners.map((banner, idx) => {
            const isCurrent = idx === currentBannerIndex
            const desktopImg = banner.imagem_desktop_url
            const mobileImg = banner.imagem_celular_url || desktopImg

            return (
              <div
                key={banner.id || idx}
                aria-hidden={!isCurrent}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
                style={{
                  transform: scrollY > 0 ? `translate3d(0, ${scrollY * 0.25}px, 0)` : undefined,
                  willChange: 'transform, opacity',
                }}
              >
                <picture className="w-full h-full block">
                  {banner.imagem_celular_url && (
                    <source media="(max-width: 640px)" srcSet={mobileImg} />
                  )}
                  <img
                    key={
                      isCurrent ? `img-active-${banner.id || idx}` : `img-idle-${banner.id || idx}`
                    }
                    src={desktopImg}
                    alt={banner.titulo}
                    className={`w-full h-full object-cover ${isCurrent ? 'ken-burns' : ''}`}
                  />
                </picture>
                {/* Overlay cinematográfico escuro nos dois temas (gradiente de baixo para cima) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/40" />
              </div>
            )
          })
        ) : (
          <div className="absolute inset-0 bg-neutral-950">
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/40" />
          </div>
        )}
      </div>

      {/* Espaço superior para centralizar o conteúdo verticalmente */}
      <div className="w-full flex-1 flex items-center justify-center relative z-20 pt-6 pb-2">
        {/* Conteúdo Central sobreposto: Título Grande (.hero-title) + Botão + Busca */}
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
          {hasBanners &&
            banners[currentBannerIndex] &&
            (() => {
              const banner = banners[currentBannerIndex]
              const isLancamento = banner.tipo === 'lancamento'
              const isSuperDestaque = banner.tipo === 'super_destaque'

              const renderButton = () => {
                if (isSuperDestaque) {
                  const url = banner.destino_url?.trim()
                  if (!url) return null
                  const isExternal = /^https?:\/\//i.test(url)
                  const buttonText = banner.texto_botao || 'Ver imóvel'

                  if (isExternal) {
                    return (
                      <div className="pt-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all duration-200 min-h-[44px] shadow-lg"
                        >
                          {buttonText}
                        </a>
                      </div>
                    )
                  }

                  return (
                    <div className="pt-2">
                      <Link
                        to={url}
                        className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all duration-200 min-h-[44px] shadow-lg"
                      >
                        {buttonText}
                      </Link>
                    </div>
                  )
                }

                if (isLancamento) {
                  if (!banner.destino_slug) return null
                  return (
                    <div className="pt-2">
                      <Link
                        to={`/lancamentos/${encodeURIComponent(banner.destino_slug)}`}
                        className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all duration-200 min-h-[44px] shadow-lg"
                      >
                        {banner.texto_botao || 'Conhecer lançamento'}
                      </Link>
                    </div>
                  )
                }

                if (banner.destino_url?.trim()) {
                  const url = banner.destino_url.trim()
                  const isExternal = /^https?:\/\//i.test(url)
                  const buttonText = banner.texto_botao || 'Saiba mais'
                  if (isExternal) {
                    return (
                      <div className="pt-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all duration-200 min-h-[44px] shadow-lg"
                        >
                          {buttonText}
                        </a>
                      </div>
                    )
                  }
                  return (
                    <div className="pt-2">
                      <Link
                        to={url}
                        className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all duration-200 min-h-[44px] shadow-lg"
                      >
                        {buttonText}
                      </Link>
                    </div>
                  )
                }

                if (banner.destino_slug) {
                  return (
                    <div className="pt-2">
                      <Link
                        to={`/lancamentos/${encodeURIComponent(banner.destino_slug)}`}
                        className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all duration-200 min-h-[44px] shadow-lg"
                      >
                        {banner.texto_botao || 'Conhecer lançamento'}
                      </Link>
                    </div>
                  )
                }

                return null
              }

              return (
                <div className="space-y-3 max-w-3xl animate-in fade-in duration-300">
                  <h1 className="hero-title text-white drop-shadow-md">{banner.titulo}</h1>
                  {renderButton()}
                </div>
              )
            })()}

          {!hasBanners && (
            <div className="space-y-3 max-w-2xl">
              <h1 className="hero-title text-white drop-shadow-md">Encontre seu imóvel</h1>
              <p className="text-sm sm:text-lg text-white/90 drop-shadow">
                Casas, apartamentos e terrenos para comprar e alugar em Feira de Santana.
              </p>
            </div>
          )}

          {/* Caixa de busca em pílula sobreposta abaixo do título */}
          <div className="w-full max-w-2xl bg-card/95 backdrop-blur-md rounded-[28px] p-3 sm:p-4 text-foreground shadow-2xl border border-border/80 space-y-3">
            {/* Alternador Comprar / Alugar */}
            <div className="flex items-center justify-center gap-2 border-b border-border/60 pb-2">
              <button
                type="button"
                onClick={() => {
                  setPurpose('venda')
                  onSearch({ ...values, purpose: 'venda' })
                }}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors min-h-[40px] ${
                  purpose === 'venda'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Comprar
              </button>
              <button
                type="button"
                onClick={() => {
                  setPurpose('locacao')
                  onSearch({ ...values, purpose: 'locacao' })
                }}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors min-h-[40px] ${
                  purpose === 'locacao'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Alugar
              </button>
            </div>

            {/* Campo de Bairro com autocomplete e botão de busca */}
            <div ref={wrapperRef} className="relative w-full">
              <div className="relative flex items-center h-12 sm:h-14 w-full rounded-full border border-border bg-background focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all shadow-sm pl-4 pr-2">
                <Search className="h-5 w-5 text-muted-foreground shrink-0 mr-2.5" />
                <input
                  ref={inputRef}
                  type="text"
                  role="combobox"
                  aria-expanded={suggestionsOpen}
                  aria-controls={listboxId}
                  aria-autocomplete="list"
                  placeholder="Busque por bairro..."
                  value={neighborhoodInput}
                  onChange={(e) => {
                    setNeighborhoodInput(e.target.value)
                    setSuggestionsOpen(true)
                    setHighlightedIndex(-1)
                  }}
                  onFocus={() => setSuggestionsOpen(true)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-full bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => triggerSearch()}
                  className="shrink-0 h-9 sm:h-11 px-4 sm:px-6 rounded-full bg-primary text-primary-foreground font-medium text-xs sm:text-sm inline-flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all min-h-[40px]"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Buscar</span>
                </button>
              </div>

              {/* Dropdown de sugestões */}
              {suggestionsOpen && (
                <div
                  id={listboxId}
                  role="listbox"
                  className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-card rounded-[16px] border border-border p-2 shadow-xl max-h-56 overflow-y-auto text-left"
                >
                  {filteredNeighborhoods.length > 0 ? (
                    filteredNeighborhoods.map((n, idx) => {
                      const isHighlighted = idx === highlightedIndex
                      return (
                        <div
                          key={n.name}
                          role="option"
                          aria-selected={isHighlighted}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          onClick={() => {
                            setNeighborhoodInput(n.name)
                            triggerSearch(n.name)
                          }}
                          className={`px-3 py-2 rounded-[8px] text-sm cursor-pointer flex items-center justify-between transition-colors min-h-[40px] ${
                            isHighlighted
                              ? 'bg-muted text-foreground'
                              : 'text-foreground hover:bg-muted'
                          }`}
                        >
                          <span>{n.name}</span>
                          <span className="text-xs text-muted-foreground tabular">
                            {n.count} imóveis
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="px-3 py-2.5 text-xs text-muted-foreground text-center">
                      Nenhum bairro encontrado.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Atalho de filtros avançados */}
            <div className="flex items-center justify-end px-2 pt-0.5">
              <button
                type="button"
                onClick={onOpenMoreFilters}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[36px]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Mais filtros (tipo, quartos, preço)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metadados inferiores (B2): linha fina na base da hero com subtítulo, tipo e contador/setas */}
      <div className="relative z-20 w-full border-t border-white/15 bg-black/40 backdrop-blur-sm px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs sm:text-sm">
          {/* Lado esquerdo: Subtítulo e Tipo */}
          <div className="flex items-center gap-3 min-w-0">
            {hasBanners && banners[currentBannerIndex] ? (
              <>
                <span className="font-semibold uppercase tracking-wider text-primary text-[11px] sm:text-xs shrink-0">
                  {banners[currentBannerIndex].tipo === 'lancamento' ? 'Lançamento' : 'Destaque'}
                </span>
                {banners[currentBannerIndex].subtitulo && (
                  <>
                    <span className="text-white/30 shrink-0">|</span>
                    <span className="text-white/80 truncate text-xs sm:text-sm">
                      {banners[currentBannerIndex].subtitulo}
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
                  className="w-8 h-8 rounded-full border border-white/20 bg-white/5 hover:bg-white/20 text-white flex items-center justify-center transition-colors min-w-[32px] min-h-[32px]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextBanner}
                  aria-label="Próximo banner"
                  className="w-8 h-8 rounded-full border border-white/20 bg-white/5 hover:bg-white/20 text-white flex items-center justify-center transition-colors min-w-[32px] min-h-[32px]"
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
