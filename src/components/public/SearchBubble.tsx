import React, { useState, useEffect, useRef, useId } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { PublicNeighborhoodOption, PublicTypeOption } from '@/services/publicSite'
import { FilterValues } from './SearchFilterBar'

export interface SearchBubbleProps {
  values: FilterValues
  neighborhoods: PublicNeighborhoodOption[]
  types?: PublicTypeOption[]
  onSearch: (newValues: FilterValues) => void
  onOpenMoreFilters?: () => void
  className?: string
}

function normalizeStr(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export const SearchBubble: React.FC<SearchBubbleProps> = ({
  values,
  neighborhoods,
  onSearch,
  onOpenMoreFilters,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [purpose, setPurpose] = useState<'venda' | 'locacao'>(values.purpose || 'venda')
  const [neighborhoodInput, setNeighborhoodInput] = useState(values.neighborhood || '')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const bubbleId = useId()
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerButtonRef = useRef<HTMLButtonElement>(null)

  // Sincroniza estado inicial com values passados por fora
  useEffect(() => {
    setPurpose(values.purpose || 'venda')
    setNeighborhoodInput(values.neighborhood || '')
  }, [values])

  // Normalização e busca de bairros
  const queryNorm = normalizeStr(neighborhoodInput)
  const filteredNeighborhoods = neighborhoods.filter((n) => {
    if (!queryNorm) return true
    return normalizeStr(n.name).includes(queryNorm)
  })

  // Fecha sugestões e recolhe no toque fora (mobile) ou mouse fora (desktop)
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false)
        // No celular ou clique fora em geral: só recolhe se o campo estiver vazio
        if (!neighborhoodInput.trim()) {
          setIsExpanded(false)
        }
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [neighborhoodInput])

  // Desktop hover handler: recolhe se o mouse sair e nenhum campo estiver em foco
  const handleMouseEnter = () => {
    // Só expande via hover em telas com mouse fino (pointer: fine)
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      setIsExpanded(true)
    }
  }

  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      // Não recolhe se houver texto digitado ou sugestões abertas
      if (neighborhoodInput.trim() || suggestionsOpen) return

      // Não recolhe se um elemento interno ainda mantiver foco ativo
      const activeEl = document.activeElement
      if (containerRef.current && activeEl && containerRef.current.contains(activeEl)) {
        return
      }

      setIsExpanded(false)
    }
  }

  const handleTriggerClick = () => {
    setIsExpanded(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  const handleClose = () => {
    setIsExpanded(false)
    setSuggestionsOpen(false)
    triggerButtonRef.current?.focus()
  }

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
      e.preventDefault()
      if (suggestionsOpen) {
        setSuggestionsOpen(false)
      } else {
        handleClose()
      }
    }
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative z-30 ${className}`}
    >
      {!isExpanded ? (
        /* Bolha recolhida: botão acessível com lupa e texto */
        <button
          ref={triggerButtonRef}
          type="button"
          aria-expanded={false}
          aria-controls={bubbleId}
          aria-label="Abrir busca de imóveis"
          onClick={handleTriggerClick}
          onFocus={() => setIsExpanded(true)}
          className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-card/95 hover:bg-card text-foreground shadow-2xl border border-white/20 dark:border-border/80 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[48px]"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Search className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Buscar imóvel
          </span>
        </button>
      ) : (
        /* Bolha expandida com animação de 300ms (respeita prefers-reduced-motion) */
        <div
          id={bubbleId}
          role="region"
          aria-label="Busca rápida de imóvel"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              handleClose()
            }
          }}
          className="w-[calc(100vw-32px)] max-w-md sm:max-w-lg bg-card/95 dark:bg-card/95 backdrop-blur-md rounded-[24px] sm:rounded-[28px] p-4 text-foreground shadow-2xl border border-white/20 dark:border-border/80 space-y-3 transition-all duration-300 animate-in fade-in zoom-in-95 motion-reduce:transition-none motion-reduce:animate-none"
        >
          {/* Topo da bolha expandida: Alternador Comprar / Alugar e Botão Fechar (X) */}
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-1.5 p-0.5 rounded-full bg-muted/60">
              <button
                type="button"
                onClick={() => {
                  setPurpose('venda')
                  onSearch({ ...values, purpose: 'venda' })
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px] ${
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
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px] ${
                  purpose === 'locacao'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Alugar
              </button>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Fechar busca de imóveis"
              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Campo de Bairro com autocomplete e botão Buscar */}
          <div className="relative w-full">
            <div className="relative flex items-center h-12 sm:h-13 w-full rounded-full border border-border bg-background focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all shadow-sm pl-4 pr-1.5">
              <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
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
                className="w-full h-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
              />

              <button
                type="button"
                onClick={() => triggerSearch()}
                aria-label="Buscar imóveis"
                className="shrink-0 h-9 sm:h-10 px-4 sm:px-5 rounded-full bg-primary text-primary-foreground font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all min-h-[36px]"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Buscar</span>
              </button>
            </div>

            {/* Dropdown de sugestões de bairros */}
            {suggestionsOpen && (
              <div
                id={listboxId}
                role="listbox"
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-card rounded-[16px] border border-border p-2 shadow-xl max-h-52 overflow-y-auto text-left"
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
                        <span className="font-medium text-foreground">{n.name}</span>
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

          {/* Atalho de mais filtros */}
          {onOpenMoreFilters && (
            <div className="flex items-center justify-end px-1 pt-0.5">
              <button
                type="button"
                onClick={onOpenMoreFilters}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[36px] px-2 py-1 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Mais filtros (tipo, quartos, preço)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBubble
