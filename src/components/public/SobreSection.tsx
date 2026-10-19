import React from 'react'
import { Link } from 'react-router-dom'
import { Building2, ArrowRight } from 'lucide-react'
import { PublicSiteConfig } from '@/services/publicSite'

interface SobreSectionProps {
  siteConfig?: PublicSiteConfig | null
}

const DEFAULT_LOREM_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'

export const SobreSection: React.FC<SobreSectionProps> = ({ siteConfig }) => {
  const titulo = siteConfig?.sobre?.titulo || 'Sobre a Imobiliária Janeide Xavier'
  const resumo = siteConfig?.sobre?.texto || DEFAULT_LOREM_TEXT

  return (
    <section
      aria-label="Sobre a imobiliária"
      className="w-full bg-background py-12 sm:py-16 border-b border-border"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
          <Building2 className="h-6 w-6" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {titulo}
        </h2>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          {resumo}
        </p>

        <div className="pt-2">
          <Link
            to="/sobre"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border bg-card hover:bg-muted text-foreground text-sm font-semibold transition-all shadow-sm min-h-[44px]"
          >
            <span>Conheça a imobiliária</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
