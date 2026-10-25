import React from 'react'
import { Link } from 'react-router-dom'
import { Building2, ArrowRight } from 'lucide-react'
import { PublicSiteConfig } from '@/services/publicSite'
import { Reveal } from '@/components/public/Reveal'

interface SobreSectionProps {
  siteConfig?: PublicSiteConfig | null
}

const DEFAULT_LOREM_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'

export const SobreSection: React.FC<SobreSectionProps> = ({ siteConfig }) => {
  const titulo = siteConfig?.sobre?.titulo?.trim() || 'Sobre a Imobiliária Janeide Xavier'
  const resumo = siteConfig?.sobre?.texto?.trim() || DEFAULT_LOREM_TEXT

  return (
    <section
      aria-label="Sobre a imobiliária"
      className="w-full bg-background py-16 sm:py-24 border-b border-border overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Grade assimétrica em duas colunas a partir de 1024 px (lg:grid-cols-12):
            Texto à esquerda mais estreito (col-span-5), Imagem à direita mais larga (col-span-7).
            No celular, empilha: texto e depois imagem.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Coluna Esquerda: Rótulo 02 — Sobre, Título grande, Texto e Link */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <Reveal delay={0}>
              <span className="section-label">02 — Sobre</span>
            </Reveal>

            <Reveal delay={60}>
              <h2 className="section-title text-foreground">{titulo}</h2>
            </Reveal>

            <Reveal delay={120}>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{resumo}</p>
            </Reveal>

            <Reveal delay={180}>
              <div className="pt-2">
                <Link
                  to="/sobre"
                  className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors duration-200 group min-h-[44px]"
                >
                  <span className="underline underline-offset-4">Conheça a imobiliária</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Coluna Direita: Placeholder neutro na proporção 4:5, sem banco de imagem externo */}
          <div className="lg:col-span-7 w-full">
            <Reveal variant="photo" delay={120}>
              <div className="relative aspect-[4/5] w-full max-w-lg mx-auto lg:max-w-none rounded-[16px] border border-border bg-card overflow-hidden shadow-sm flex flex-col items-center justify-center p-8 text-center">
                {/* Textura sutil geométrica e ícone arquitetural neutro */}
                <div className="w-20 h-20 rounded-full bg-muted/80 border border-border flex items-center justify-center text-muted-foreground mb-4 shadow-inner">
                  <Building2 className="h-9 w-9 stroke-[1.25]" />
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    Espaço Editorial
                  </span>
                  <p className="text-sm text-muted-foreground/80 font-normal">
                    Tradição, transparência e excelência no mercado imobiliário
                  </p>
                </div>
                {/* Linhas decorativas sutis nos cantos */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-border/80 rounded-tl pointer-events-none" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-border/80 rounded-tr pointer-events-none" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-border/80 rounded-bl pointer-events-none" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-border/80 rounded-br pointer-events-none" />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SobreSection
