import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PublicContactModal } from './PublicContactModal'
import { CookieBanner } from './CookieBanner'
import { FloatingWhatsAppButton } from './FloatingWhatsAppButton'
import {
  getFilters,
  getSiteConfig,
  PublicFiltersResponse,
  PublicSiteConfig,
} from '@/services/publicSite'

/**
 * Itens de menu configuráveis no topo para o site público v2:
 * Cabeçalho: logo, Comprar, Alugar, pílula "Contato". Sem botão "Entrar".
 */
export interface HeaderMenuItem {
  label: string
  actionKey: 'comprar' | 'alugar' | 'contato'
}

export const HEADER_MENU_ITEMS: HeaderMenuItem[] = [
  { label: 'Comprar', actionKey: 'comprar' },
  { label: 'Alugar', actionKey: 'alugar' },
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

let siteConfigCachePromise: Promise<PublicSiteConfig | null> | null = null
function loadCachedSiteConfig(): Promise<PublicSiteConfig | null> {
  if (!siteConfigCachePromise) {
    siteConfigCachePromise = getSiteConfig().catch(() => null)
  }
  return siteConfigCachePromise
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
  orgName = 'Imobiliária Janeide Xavier',
  whatsappEnabled,
  showContactButton = true,
  onSelectPurpose,
  onOpenContact,
  floatingWaClassName,
}) => {
  const [internalContactOpen, setInternalContactOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cookiePreferencesOpen, setCookiePreferencesOpen] = useState(false)
  const [isWhatsappEnabled, setIsWhatsappEnabled] = useState<boolean>(whatsappEnabled ?? false)
  const [siteConfig, setSiteConfig] = useState<PublicSiteConfig | null>(null)

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

    loadCachedSiteConfig().then((cfg) => {
      if (cfg) setSiteConfig(cfg)
    })
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
        const heroEl = document.getElementById('hero-search-card')
        if (heroEl) {
          heroEl.scrollIntoView({ behavior: 'smooth' })
        }
      }
    } else if (item.actionKey === 'alugar') {
      if (onSelectPurpose) {
        onSelectPurpose('locacao')
      } else {
        const heroEl = document.getElementById('hero-search-card')
        if (heroEl) {
          heroEl.scrollIntoView({ behavior: 'smooth' })
        }
      }
    } else if (item.actionKey === 'contato') {
      handleOpenContactModal()
    }
  }

  const customLinks = siteConfig?.links && Array.isArray(siteConfig.links) ? siteConfig.links : []

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Cabeçalho: logo, Comprar, Alugar, pílula "Contato". Sem botão "Entrar" */}
      <header className="pub-enter-header sticky top-0 z-40 w-full border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-20 flex items-center justify-between gap-3 sm:gap-4">
            {/* À esquerda: Logo ou nome da imobiliária */}
            <div className="flex-1 min-w-0 flex items-center">
              <Link
                to="/"
                className="text-lg sm:text-xl font-semibold tracking-tight text-foreground hover:opacity-90 transition-opacity truncate min-h-[44px] inline-flex items-center gap-2"
              >
                {siteConfig?.logo_url ? (
                  <img
                    src={siteConfig.logo_url}
                    alt={orgName}
                    className="h-10 w-auto max-w-[200px] object-contain"
                  />
                ) : (
                  <span>{orgName}</span>
                )}
              </Link>
            </div>

            {/* No desktop (a partir de md): Comprar, Alugar e a pílula Contato */}
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
                {siteConfig?.logo_url ? (
                  <img
                    src={siteConfig.logo_url}
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
          </div>
        </SheetContent>
      </Sheet>

      {/* Conteúdo da página */}
      <main className="flex-1">{children}</main>

      {/* Botão flutuante de WhatsApp */}
      {isWhatsappEnabled && <FloatingWhatsAppButton className={floatingWaClassName} />}

      {/* Rodapé: links de Instagram, WhatsApp e outros (vindos da config), copyright, Privacidade, Preferências de cookies. Sem seletor de tema. */}
      <footer className="border-t border-border bg-background pt-8 pb-20 px-4 text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Links adicionais vindos da config (Instagram, WhatsApp, etc) */}
          {customLinks.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
              {customLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors min-h-[44px] inline-flex items-center px-2 py-1"
                >
                  {link.rotulo}
                </a>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 pt-4">
            <p className="text-sm text-muted-foreground leading-normal py-2 text-center sm:text-left">
              © {new Date().getFullYear()}{' '}
              <Link to="/" className="font-semibold text-foreground hover:underline inline">
                {orgName}
              </Link>
              . Todos os direitos reservados.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2">
              <Link
                to="/sobre"
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors min-h-[44px] inline-flex items-center px-1"
              >
                Sobre
              </Link>
              <Link
                to="/privacidade"
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors min-h-[44px] inline-flex items-center px-1"
              >
                Política de Privacidade
              </Link>
              <button
                type="button"
                onClick={() => setCookiePreferencesOpen(true)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors min-h-[44px] inline-flex items-center px-1"
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
