import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react'
import { submitLead } from '@/services/publicSite'
import { useSiteConfig } from '@/contexts/SiteConfigContext'
import { ORG_FALLBACK_NAME } from '@/lib/siteBrand'
import { maskPhoneInput } from '@/lib/clientUtils'
import { getCampaign } from '@/lib/campaign'
import { snapshot } from '@/lib/searchMemory'
import { trackLead } from '@/lib/marketing'
import { PublicLayout } from '@/components/public/PublicLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const PROPERTY_TYPES_CAPTACAO = [
  'Casa',
  'Apartamento',
  'Terreno',
  'Sala ou loja comercial',
  'Galpão',
  'Chácara ou sítio',
  'Outro',
] as const

export const VenderPage: React.FC = () => {
  const { config: siteConfig, isPreview } = useSiteConfig()
  const orgName = siteConfig?.sobre?.titulo?.trim() || ORG_FALLBACK_NAME

  // Atualiza título da página com o nome da imobiliária
  useEffect(() => {
    const prevTitle = document.title
    document.title = `Anuncie seu imóvel | ${orgName}`
    return () => {
      document.title = prevTitle
    }
  }, [orgName])

  // Campos do formulário (sem e-mail; sem persistência no navegador nem em URL)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [propertyType, setPropertyType] = useState<string>('')
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('') // Honeypot
  const [submissionId, setSubmissionId] = useState('')

  // Estados de erro e envio
  const [loading, setLoading] = useState(false)
  const [typeError, setTypeError] = useState(false)
  const [consentError, setConsentError] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const consentCheckboxRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!submissionId) {
      setSubmissionId(crypto.randomUUID())
    }
  }, [submissionId])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(maskPhoneInput(e.target.value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    // Validação do tipo do imóvel
    if (!propertyType) {
      setTypeError(true)
      return
    }
    setTypeError(false)

    // Validação da autorização obrigatória
    if (!consent) {
      setConsentError(true)
      if (consentCheckboxRef.current) {
        consentCheckboxRef.current.focus()
      }
      return
    }
    setConsentError(false)

    setLoading(true)
    try {
      const memorySnap = snapshot()
      const campaign = getCampaign()

      await submitLead({
        name: name.trim(),
        phone: phone.trim(),
        consent: true,
        submission_id: submissionId,
        website: website || undefined,
        intent: 'captacao',
        owner_address: address.trim(),
        owner_property_type: propertyType,
        search: {
          filters: memorySnap.filters,
          viewed: memorySnap.viewed,
        },
        utm_source: campaign.utm_source,
        utm_medium: campaign.utm_medium,
        utm_campaign: campaign.utm_campaign,
        gclid: campaign.gclid,
        fbclid: campaign.fbclid,
      })

      trackLead()
      setIsSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar contato.'
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResetForm = () => {
    setName('')
    setPhone('')
    setAddress('')
    setPropertyType('')
    setConsent(false)
    setWebsite('')
    setSubmissionId(crypto.randomUUID())
    setConsentError(false)
    setTypeError(false)
    setServerError(null)
    setIsSuccess(false)
  }

  return (
    <PublicLayout orgName={orgName}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
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

        {/* Aviso de Prévia / Alerta para o dono */}
        <div className="p-4 rounded-[12px] bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Aviso de homologação interna</span>
            <p className="leading-relaxed opacity-95">
              O servidor ainda não armazena permanentemente os campos de captação (
              <code className="px-1 py-0.5 rounded bg-amber-500/20 font-mono text-xs">intent</code>,{' '}
              <code className="px-1 py-0.5 rounded bg-amber-500/20 font-mono text-xs">
                owner_address
              </code>{' '}
              e{' '}
              <code className="px-1 py-0.5 rounded bg-amber-500/20 font-mono text-xs">
                owner_property_type
              </code>
              ). Esta página pode ser conferida na prévia, mas{' '}
              <strong>não deve ser publicada</strong> até o sistema interno aceitar esses campos.
            </p>
          </div>
        </div>

        {/* Cabeçalho */}
        <header className="space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Anuncie seu imóvel
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Quer vender ou alugar? Deixe seu contato e um corretor fala com você para avaliar e
            divulgar seu imóvel com total segurança.
          </p>
        </header>

        {/* Conteúdo: Sucesso ou Formulário */}
        {isSuccess ? (
          <div className="py-12 px-6 sm:px-10 rounded-[16px] bg-card border border-border shadow-sm text-center space-y-6">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                Recebemos seu contato.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Recebemos seu contato. Um corretor vai falar com você para conhecer o imóvel.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all min-h-[44px]"
              >
                Voltar para o início
              </Link>
              <Button
                type="button"
                variant="outline"
                onClick={handleResetForm}
                className="w-full sm:w-auto rounded-full px-6 py-3 min-h-[44px] border-border text-foreground"
              >
                Anunciar outro imóvel
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 rounded-[16px] bg-card border border-border shadow-sm space-y-5"
          >
            {/* Honeypot anti-spam */}
            <div
              style={{
                position: 'absolute',
                opacity: 0,
                zIndex: -1,
                pointerEvents: 'none',
                top: '-9999px',
                left: '-9999px',
              }}
              aria-hidden="true"
            >
              <label htmlFor="vender-website-trap">Website</label>
              <input
                id="vender-website-trap"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            {/* Nome */}
            <div className="space-y-1.5 text-left">
              <Label htmlFor="vender-name" className="text-sm font-medium text-foreground">
                Nome completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vender-name"
                type="text"
                required
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="h-12 rounded-[8px] border-border bg-background text-base text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5 text-left">
              <Label htmlFor="vender-phone" className="text-sm font-medium text-foreground">
                WhatsApp <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vender-phone"
                type="tel"
                required
                placeholder="(75) 99999-9999"
                value={phone}
                onChange={handlePhoneChange}
                disabled={loading}
                className="h-12 rounded-[8px] border-border bg-background text-base text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Endereço do imóvel (pedido ao proprietário) */}
            <div className="space-y-1.5 text-left">
              <Label htmlFor="vender-address" className="text-sm font-medium text-foreground">
                Endereço do imóvel <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vender-address"
                type="text"
                required
                placeholder="Rua, número, bairro ou condomínio em Feira de Santana"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
                className="h-12 rounded-[8px] border-border bg-background text-base text-foreground placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Usado exclusivamente pela equipe de corretores para localização e avaliação.
              </p>
            </div>

            {/* Tipo do imóvel */}
            <div className="space-y-1.5 text-left">
              <Label htmlFor="vender-type" className="text-sm font-medium text-foreground">
                Tipo do imóvel <span className="text-destructive">*</span>
              </Label>
              <Select
                value={propertyType}
                onValueChange={(val) => {
                  setPropertyType(val)
                  if (val) setTypeError(false)
                }}
                disabled={loading}
              >
                <SelectTrigger
                  id="vender-type"
                  className={`h-12 rounded-[8px] bg-background text-base text-foreground ${
                    typeError ? 'border-destructive focus:ring-destructive' : 'border-border'
                  }`}
                >
                  <SelectValue placeholder="Selecione o tipo do imóvel" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground">
                  {PROPERTY_TYPES_CAPTACAO.map((item) => (
                    <SelectItem key={item} value={item} className="text-base py-2.5">
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {typeError && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1.5 pt-0.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Selecione o tipo do imóvel.</span>
                </p>
              )}
            </div>

            {/* Autorização de contato (obrigatória) */}
            <div className="space-y-2 pt-2 text-left">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="vender-consent"
                  ref={consentCheckboxRef}
                  checked={consent}
                  onCheckedChange={(checked) => {
                    setConsent(checked === true)
                    if (checked) setConsentError(false)
                  }}
                  disabled={loading}
                  className="mt-1"
                />
                <div className="text-xs text-muted-foreground leading-relaxed font-normal">
                  <Label
                    htmlFor="vender-consent"
                    className="cursor-pointer text-xs font-normal text-muted-foreground inline"
                  >
                    Autorizo a imobiliária a entrar em contato comigo por WhatsApp, telefone ou
                    e-mail para tratar da divulgação e captação deste imóvel.{' '}
                  </Label>
                  <span>Li e aceito a </span>
                  <a
                    href="/privacidade"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors inline-block"
                  >
                    Política de Privacidade
                  </a>
                  .
                </div>
              </div>
              {consentError && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1.5 pt-1">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Para enviar, marque a autorização de contato.</span>
                </p>
              )}
            </div>

            {/* Erro do servidor */}
            {serverError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-[8px] text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Botão de Envio */}
            <div className="pt-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-[8px] font-semibold text-sm min-h-[48px] bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200"
              >
                {loading ? 'Enviando...' : 'Anunciar meu imóvel'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </PublicLayout>
  )
}

export default VenderPage
