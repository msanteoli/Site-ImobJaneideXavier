import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Reveal } from '@/components/public/Reveal'

export const AnuncieBanner: React.FC = () => {
  return (
    <section
      aria-label="Anuncie seu imóvel"
      className="w-full bg-card border-b border-border py-16 sm:py-20 overflow-hidden"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <Reveal delay={0} className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Proprietários</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">
            Anuncie seu imóvel
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Quer vender ou alugar? Deixe seu contato e um corretor fala com você.
          </p>

          <div className="pt-4">
            <Link
              to="/vender"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all duration-200 min-h-[44px] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span>Anunciar meu imóvel</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default AnuncieBanner
