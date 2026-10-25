import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PublicContactModal } from './PublicContactModal'
import { CookieBanner } from './CookieBanner'
import { FloatingWhatsAppButton } from './FloatingWhatsAppButton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { getFilters, PublicFiltersResponse } from '@/services/publicSite'
import { useSiteConfig } from '@/contexts/SiteConfigContext'
import {
  resolveAssetUrl,
  sanitizeHttpsUrl,
  sanitizeTelUrl,
  sanitizeMailtoUrl,
} from '@/lib/publicSiteUtils'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, Phone, Mail } from 'lucide-react'

/**
 * Itens de menu configuráveis no topo para o site público v2:
 * Cabeçalho: logo, Comprar, Alugar, pílula "Contato". Sem botão "Entrar".
 */
import { ORG_FALLBACK_NAME } from '@/lib/siteBrand'

export interface HeaderMenuItem {
  label: string
  actionKey: 'comprar' | 'alugar' | 'contato' | 'sobre'
  href?: string
}

export const HEADER_MENU_ITEMS: HeaderMenuItem[] = [
  { label: 'Comprar', actionKey: 'comprar' },
  { label: 'Alugar', actionKey: 'alugar' },
  { label: 'Sobre', actionKey: 'sobre', href: '/sobre' },
  { label: 'Contato', actionKey: 'contato' },
]

let filtersCachePromise: Promise<PublicFiltersResponse> | null = null
function loadCachedFilters(): Promise<PublicFiltersResponse> {
  if (!filtersCachePromise) {
    filtersCachePromise = getFilters().catch((err) => {
      filtersCachePromise = null
      throw err
    })
  }
  return filtersCachePromise
}

interface PublicLayoutProps {
  children: React.ReactNode
  orgName?: string
  whatsappEnabled?: boolean
  showContactButton?: boolean
  onSelectPurpose?: (purpose: 'venda' | 'locacao') => void
  onOpenContact?: () => void
  floatingWaClassName?: string
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  orgName = ORG_FALLBACK_NAME,
  whatsappEnabled,
  showContactButton = true,
  onSelectPurpose,
  onOpenContact,
  floatingWaClassName,
}) => {
  const navigate = useNavigate()
  const [internalContactOpen, setInternalContactOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cookiePreferencesOpen, setCookiePreferencesOpen] = useState(false)
  const [isWhatsappEnabled, setIsWhatsappEnabled] = useState<boolean>(whatsappEnabled ?? false)
  const { config: siteConfig } = useSiteConfig()

  React.useEffect(() => {
    if (whatsappEnabled !== undefined) {
      setIsWhatsappEnabled(whatsappEnabled)
    } else {
      loadCachedFilters()
        .then((res) => {
          if (res?.organization) {
            setIsWhatsappEnabled(Boolean(res.organization.whatsapp_enabled))
          }
        })
        .catch(() => {
          setIsWhatsappEnabled(false)
        })
    }
  }, [whatsappEnabled])

  const handleOpenContactModal = () => {
    if (onOpenContact) {
      onOpenContact()
    } else {
      setInternalContactOpen(true)
    }
  }

  const handleMenuItemClick = (item: HeaderMenuItem) => {
    setMobileMenuOpen(false)

    if (item.actionKey === 'comprar') {
      if (onSelectPurpose) {
        onSelectPurpose('venda')
      } else {
        const heroEl =
          document.getElementById('hero-banner-section') ||
          document.getElementById('hero-search-card')
        if (heroEl) {
          heroEl.scrollIntoView({ behavior: 'smooth' })
        } else {
          navigate('/buscar?purpose=venda')
        }
      }
    } else if (item.actionKey === 'alugar') {
      if (onSelectPurpose) {
        onSelectPurpose('locacao')
      } else {
        const heroEl =
          document.getElementById('hero-banner-section') ||
          document.getElementById('hero-search-card')
        if (heroEl) {
          heroEl.scrollIntoView({ behavior: 'smooth' })
        } else {
          navigate('/buscar?purpose=locacao')
        }
      }
    } else if (item.actionKey === 'sobre') {
      navigate('/sobre')
    } else if (item.actionKey === 'contato') {
      handleOpenContactModal()
    }
  }

  // Resolução de Logo
  const resolvedLogo = resolveAssetUrl(siteConfig?.logo_url)

  // Links normais com rotulo e url válidos (apenas https://)
  const validCustomLinks = (siteConfig?.links || [])
    .filter((l) => l && l.rotulo && sanitizeHttpsUrl(l.url))
    .map((l) => ({ rotulo: l.rotulo, url: sanitizeHttpsUrl(l.url)! }))

  // Redes sociais (apenas https://)
  const instagramUrl = sanitizeHttpsUrl(siteConfig?.redes?.instagram)
  const whatsappUrl = sanitizeHttpsUrl(siteConfig?.redes?.whatsapp)

  // Informações de contato do rodapé
  const contato = siteConfig?.contato
  const hasEndereco = Boolean(contato?.endereco?.trim())
  const hasHorario = Boolean(contato?.horario?.trim())
  const rawTelefone = contato?.telefone?.trim()
  const telLink = sanitizeTelUrl(rawTelefone)
  const rawEmail = contato?.email?.trim()
  const mailtoLink = sanitizeMailtoUrl(rawEmail)
  const hasContatoAny = hasEndereco || hasHorario || Boolean(rawTelefone) || Boolean(rawEmail)

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Cabeçalho: logo, Comprar, Alugar, Sobre, pílula Contato. Sem botão Entrar */}
      <header className="pub-enter-header sticky top-0 z-40 w-full border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-20 flex items-center justify-between gap-3 sm:gap-4">
            {/* À esquerda: Logo ou nome da imobiliária */}
            <div className="flex-1 min-w-0 flex items-center">
              <Link
                to="/"
                className="text-lg sm:text-xl font-semibold tracking-tight text-foreground hover:opacity-90 transition-opacity truncate min-h-[44px] inline-flex items-center gap-2"
              >
                {resolvedLogo ? (
                  <img
                    src={resolvedLogo}
                    alt={orgName}
                    className="h-10 w-auto max-w-[200px] object-contain"
                  />
                ) : (
                  <span>{orgName}</span>
                )}
              </Link>
            </div>

            {/* No desktop (a partir de md): Comprar, Alugar, Sobre, pílula Contato e ThemeToggle */}
            <nav
              className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0"
              aria-label="Menu principal"
            >
              {HEADER_MENU_ITEMS.map((item) => {
                if (item.actionKey === 'contato') {
                  if (!showContactButton) return null
                  return (
                    <Button
                      key={item.actionKey}
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => handleMenuItemClick(item)}
                      aria-label={item.label}
                      className="font-medium text-sm rounded-full border-border hover:bg-muted text-foreground h-11 md:h-11 min-h-[44px] md:min-h-[44px] px-5 py-2.5 inline-flex items-center justify-center transition-colors shrink-0"
                    >
                      {item.label}
                    </Button>
                  )
                }

                return (
                  <button
                    key={item.actionKey}
                    type="button"
                    onClick={() => handleMenuItemClick(item)}
                    className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors px-3 py-2 min-h-[44px] inline-flex items-center"
                  >
                    {item.label}
                  </button>
                )
              })}
              <ThemeToggle className="ml-1" />
            </nav>

            {/* No celular: botão de menu à direita */}
            <div className="md:hidden shrink-0 flex items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Abrir menu de navegação"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-[8px] border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu lateral móvel */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="right"
          className="w-[280px] sm:w-[320px] p-6 flex flex-col justify-between"
        >
          <div className="space-y-6">
            <SheetHeader className="text-left">
              <SheetTitle className="text-lg font-semibold text-foreground">
                {resolvedLogo ? (
                  <img
                    src={resolvedLogo}
                    alt={orgName}
                    className="h-8 w-auto max-w-[180px] object-contain"
                  />
                ) : (
                  orgName
                )}
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2" aria-label="Menu móvel">
              {HEADER_MENU_ITEMS.map((item) => {
                if (item.actionKey === 'contato') {
                  if (!showContactButton) return null
                  return (
                    <Button
                      key={item.actionKey}
                      type="button"
                      variant="outline"
                      onClick={() => handleMenuItemClick(item)}
                      className="w-full justify-start rounded-full font-medium text-sm border-border h-11 min-h-[44px] mt-2"
                    >
                      {item.label}
                    </Button>
                  )
                }

                return (
                  <button
                    key={item.actionKey}
                    type="button"
                    onClick={() => handleMenuItemClick(item)}
                    className="w-full text-left py-3 px-3 text-base font-medium text-foreground hover:bg-muted rounded-[8px] transition-colors min-h-[44px] flex items-center"
                  >
                    {item.label}
                  </button>
                )
              })}
            </nav>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Alternar tema</span>
              <ThemeToggle />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Conteúdo da página */}
      <main className="flex-1">{children}</main>

      {/* Botão flutuante de WhatsApp */}
      {isWhatsappEnabled && <FloatingWhatsAppButton className={floatingWaClassName} />}

      {/* Rodapé escuro nos dois temas: contatos, redes sociais, copyright e links institucionais */}
      <footer className="border-t border-border bg-[#0B0A0E] text-white pt-12 sm:pt-16 pb-16 px-4 sm:px-6 text-sm">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Bloco 1: Imobiliária / Atendimento */}
            <div className="space-y-4">
              <span className="section-label text-neutral-400">Atendimento</span>
              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                {orgName}
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
                Estamos à disposição para ajudar você a encontrar o imóvel ideal em Feira de Santana
                e região.
              </p>
              {showContactButton && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenContactModal}
                    className="font-medium text-sm rounded-full border-white/20 hover:bg-white/10 text-white min-h-[44px] px-6"
                  >
                    Falar com a imobiliária
                  </Button>
                </div>
              )}
            </div>

            {/* Bloco 2: Informações de contato */}
            {hasContatoAny && (
              <div className="space-y-4">
                <span className="section-label text-neutral-400">Informações</span>
                <div className="space-y-3.5 text-sm text-neutral-300">
                  {hasEndereco && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-white text-xs uppercase tracking-wider">
                          Endereço
                        </span>
                        <span className="text-neutral-300 leading-relaxed">
                          {contato!.endereco}
                        </span>
                      </div>
                    </div>
                  )}

                  {hasHorario && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-white text-xs uppercase tracking-wider">
                          Horário
                        </span>
                        <span className="text-neutral-300">{contato!.horario}</span>
                      </div>
                    </div>
                  )}

                  {rawTelefone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-white text-xs uppercase tracking-wider">
                          Telefone
                        </span>
                        {telLink ? (
                          <a
                            href={telLink}
                            className="text-white hover:text-primary transition-colors block"
                          >
                            {rawTelefone}
                          </a>
                        ) : (
                          <span className="text-neutral-300">{rawTelefone}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {rawEmail && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-white text-xs uppercase tracking-wider">
                          E-mail
                        </span>
                        {mailtoLink ? (
                          <a
                            href={mailtoLink}
                            className="text-white hover:text-primary transition-colors block break-all"
                          >
                            {rawEmail}
                          </a>
                        ) : (
                          <span className="text-neutral-300 break-all">{rawEmail}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bloco 3: Redes sociais e canais */}
            <div className="space-y-4">
              <span className="section-label text-neutral-400">Conecte-se</span>
              <p className="text-sm text-neutral-400">
                Acompanhe novidades, novos imóveis e oportunidades exclusivas.
              </p>
              {(validCustomLinks.length > 0 || instagramUrl || whatsappUrl) && (
                <div className="flex flex-col gap-2 pt-1 text-sm font-medium">
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-primary transition-colors min-h-[44px] inline-flex items-center gap-2"
                    >
                      <span>Instagram</span>
                    </a>
                  )}
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-primary transition-colors min-h-[44px] inline-flex items-center gap-2"
                    >
                      <span>WhatsApp</span>
                    </a>
                  )}
                  {validCustomLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-primary transition-colors min-h-[44px] inline-flex items-center"
                    >
                      {link.rotulo}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Linha de copyright e links institucionais */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
            <p className="text-center sm:text-left leading-normal">
              © {new Date().getFullYear()}{' '}
              <Link to="/" className="font-medium text-white hover:underline inline">
                {orgName}
              </Link>
              . Todos os direitos reservados.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2">
              <Link
                to="/sobre"
                className="text-neutral-300 hover:text-white underline underline-offset-4 transition-colors min-h-[44px] inline-flex items-center px-1"
              >
                Sobre
              </Link>
              <Link
                to="/privacidade"
                className="text-neutral-300 hover:text-white underline underline-offset-4 transition-colors min-h-[44px] inline-flex items-center px-1"
              >
                Política de Privacidade
              </Link>
              <button
                type="button"
                onClick={() => setCookiePreferencesOpen(true)}
                className="text-neutral-300 hover:text-white underline underline-offset-4 transition-colors min-h-[44px] inline-flex items-center px-1"
              >
                Preferências de cookies
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de contato */}
      <PublicContactModal open={internalContactOpen} onOpenChange={setInternalContactOpen} />

      {/* Banner de cookies */}
      <CookieBanner
        forceOpen={cookiePreferencesOpen}
        onClose={() => setCookiePreferencesOpen(false)}
      />
    </div>
  )
}
