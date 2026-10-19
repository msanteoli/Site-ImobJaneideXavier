import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, MapPin, Phone, Mail, Clock } from 'lucide-react'
import { PublicLayout } from '@/components/public/PublicLayout'
import { getSiteConfig, PublicSiteConfig } from '@/services/publicSite'

const LOREM_SOBRE_PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.',
  'Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi.',
]

export const SobrePage: React.FC = () => {
  const [config, setConfig] = useState<PublicSiteConfig | null>(null)

  useEffect(() => {
    getSiteConfig().then((cfg) => {
      if (cfg) setConfig(cfg)
    })
  }, [])

  const titulo = config?.sobre?.titulo || 'Sobre a Imobiliária Janeide Xavier'
  const contato = config?.contato

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
        {/* Navegação voltar */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para o início</span>
          </Link>
        </div>

        {/* Cabeçalho */}
        <header className="space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            {titulo}
          </h1>
          <p className="text-base text-muted-foreground">
            Tradição, transparência e compromisso com o seu novo lar em Feira de Santana.
          </p>
        </header>

        {/* Texto Completo (Lorem Ipsum conforme regra do dono) */}
        <article className="prose prose-neutral max-w-none space-y-6 text-foreground/90 text-base sm:text-lg leading-relaxed">
          {config?.sobre?.texto ? (
            <p className="whitespace-pre-wrap">{config.sobre.texto}</p>
          ) : (
            LOREM_SOBRE_PARAGRAPHS.map((p, idx) => <p key={idx}>{p}</p>)
          )}
        </article>

        {/* Informações de contato vindas da config */}
        {contato && (
          <section className="pt-8 border-t border-border space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Atendimento e Localização
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {contato.endereco && (
                <div className="flex items-start gap-3 p-4 rounded-[12px] bg-muted/50 border border-border">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-foreground">Endereço</span>
                    <span className="text-muted-foreground">{contato.endereco}</span>
                  </div>
                </div>
              )}
              {contato.horario && (
                <div className="flex items-start gap-3 p-4 rounded-[12px] bg-muted/50 border border-border">
                  <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-foreground">
                      Horário de funcionamento
                    </span>
                    <span className="text-muted-foreground">{contato.horario}</span>
                  </div>
                </div>
              )}
              {contato.telefone && (
                <div className="flex items-start gap-3 p-4 rounded-[12px] bg-muted/50 border border-border">
                  <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-foreground">Telefone</span>
                    <span className="text-muted-foreground">{contato.telefone}</span>
                  </div>
                </div>
              )}
              {contato.email && (
                <div className="flex items-start gap-3 p-4 rounded-[12px] bg-muted/50 border border-border">
                  <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-foreground">E-mail</span>
                    <span className="text-muted-foreground">{contato.email}</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </PublicLayout>
  )
}

export default SobrePage
