import React, { useState, useEffect, useRef } from 'react'
import { submitLead } from '@/services/publicSite'
import { snapshot } from '@/lib/searchMemory'
import { getCampaign } from '@/lib/campaign'
import { trackLead, trackWhatsapp } from '@/lib/marketing'
import { maskPhoneInput } from '@/lib/clientUtils'
import { formatVisitSlot } from '@/lib/publicSiteUtils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, CheckCircle2, MessageCircle, Calendar } from 'lucide-react'

export interface PublicContactFormProps {
  propertyCode?: string
  visitStart?: string
  onSubmitted?: () => void
  onChooseOtherSlot?: () => void
  onClose?: () => void
  /**
   * Identificador do contexto para ids acessíveis e estilos (ex.: 'modal' ou 'footer')
   */
  variant?: 'modal' | 'footer'
}

export const PublicContactForm: React.FC<PublicContactFormProps> = ({
  propertyCode,
  visitStart,
  onSubmitted,
  onChooseOtherSlot,
  onClose,
  variant = 'modal',
}) => {
  // Form states
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('') // Honey-pot

  // Interaction & submission states
  const [submissionId, setSubmissionId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [consentError, setConsentError] = useState(false)
  const [successResponse, setSuccessResponse] = useState<{
    whatsapp_url: string | null
    visit?: string
    visitStartFormatted?: string
  } | null>(null)

  const consentCheckboxRef = useRef<HTMLButtonElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

  // Gera submissionId na montagem ou quando resetado
  useEffect(() => {
    if (!submissionId) {
      setSubmissionId(crypto.randomUUID())
    }
  }, [submissionId])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setPhone(maskPhoneInput(raw))
  }

  const validateEmail = (val: string): string | null => {
    const trimmed = val.trim()
    if (!trimmed) {
      return 'Informe o seu e-mail.'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      return 'Informe um e-mail válido.'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    // Validação de e-mail obrigatório
    const mailErr = validateEmail(email)
    if (mailErr) {
      setEmailError(mailErr)
      if (emailInputRef.current) {
        emailInputRef.current.focus()
      }
      return
    }
    setEmailError(null)

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

      const res = await submitLead({
        name,
        phone,
        email: email.trim(),
        consent: true,
        submission_id: submissionId,
        property_code: propertyCode || undefined,
        visit_start: visitStart && visitStart.trim() ? visitStart.trim() : undefined,
        search: {
          filters: memorySnap.filters,
          viewed: memorySnap.viewed,
        },
        utm_source: campaign.utm_source,
        utm_medium: campaign.utm_medium,
        utm_campaign: campaign.utm_campaign,
        gclid: campaign.gclid,
        fbclid: campaign.fbclid,
        website: website || undefined,
      })

      // Conversão Lead
      trackLead(propertyCode)

      const formattedSlot = visitStart ? formatVisitSlot(visitStart) : undefined

      setSuccessResponse({
        whatsapp_url: res.whatsapp_url,
        visit: res.visit,
        visitStartFormatted: formattedSlot,
      })

      if (onSubmitted) {
        onSubmitted()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar contato.'
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenWhatsApp = () => {
    if (!successResponse?.whatsapp_url) return
    trackWhatsapp(propertyCode)
    window.open(successResponse.whatsapp_url, '_blank', 'noopener,noreferrer')
  }

  const handleChooseOtherSlotClick = () => {
    if (onChooseOtherSlot) {
      onChooseOtherSlot()
    }
  }

  const handleResetForm = () => {
    setSuccessResponse(null)
    setName('')
    setPhone('')
    setEmail('')
    setConsent(false)
    setWebsite('')
    setSubmissionId(crypto.randomUUID())
    setConsentError(false)
    setEmailError(null)
    setServerError(null)
  }

  const formattedVisitStart = visitStart ? formatVisitSlot(visitStart) : null

  const renderSuccessMessage = () => {
    const visitStatus = successResponse?.visit
    const timeFormatted =
      successResponse?.visitStartFormatted || (visitStart ? formatVisitSlot(visitStart) : '')

    if (visitStatus === 'requested') {
      return (
        <p className="text-sm text-muted-foreground max-w-sm">
          Pedimos a visita para {timeFormatted}. O corretor vai entrar em contato para confirmar.
        </p>
      )
    }

    if (visitStatus === 'slot_taken') {
      return (
        <p className="text-sm text-muted-foreground max-w-sm">
          Esse horário acabou de ser pedido por outra pessoa. Recebemos o seu contato e vamos
          combinar outro horário com você.
        </p>
      )
    }

    if (visitStatus === 'invalid') {
      return (
        <p className="text-sm text-muted-foreground max-w-sm">
          Não foi possível pedir esse horário. Recebemos o seu contato e vamos combinar a visita com
          você.
        </p>
      )
    }

    if (visitStatus === 'limit') {
      return (
        <p className="text-sm text-muted-foreground max-w-sm">
          Você já tem um pedido de visita em andamento. Recebemos o seu contato.
        </p>
      )
    }

    // 'none' ou ausente / sem horário
    return (
      <p className="text-sm text-muted-foreground max-w-sm">
        Recebemos o seu pedido. Um atendente entra em contato em até 1 hora.
      </p>
    )
  }

  const idPrefix = variant === 'footer' ? 'footer-lead' : 'lead'

  if (successResponse) {
    return (
      <div className="py-6 flex flex-col items-center text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-semibold text-foreground tracking-tight">
          Recebemos o seu contato. Em breve falaremos com você.
        </h3>
        {renderSuccessMessage()}

        <div className="w-full pt-4 space-y-3">
          {successResponse.visit === 'slot_taken' && onChooseOtherSlot && (
            <Button
              type="button"
              className="w-full rounded-[8px] h-12 min-h-[48px] font-medium"
              onClick={handleChooseOtherSlotClick}
            >
              Escolher outro horário
            </Button>
          )}
          {successResponse.whatsapp_url && (
            <Button
              type="button"
              className="w-full rounded-[8px] bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center gap-2 font-medium h-12 min-h-[48px]"
              onClick={handleOpenWhatsApp}
            >
              <MessageCircle className="h-5 w-5" />
              Falar no WhatsApp
            </Button>
          )}
          {onClose ? (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-[8px] h-12 min-h-[48px] border-border font-medium"
              onClick={onClose}
            >
              Continuar buscando
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-[8px] h-12 min-h-[48px] border-border font-medium"
              onClick={handleResetForm}
            >
              Enviar outra mensagem
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      {/* Honeypot field - escondido para robôs */}
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
        <label htmlFor={`${idPrefix}-website-trap`}>Website</label>
        <input
          id={`${idPrefix}-website-trap`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {/* Horário de visita pedido (quando visitStart estiver preenchida) */}
      {formattedVisitStart && (
        <div className="p-3 rounded-[8px] bg-primary/10 border border-primary/20 flex items-center gap-2.5 text-xs font-medium text-foreground">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <span>
            Visita pedida: <strong>{formattedVisitStart}</strong>
          </span>
        </div>
      )}

      {/* Nome */}
      <div className="space-y-1.5 text-left">
        <Label htmlFor={`${idPrefix}-name`} className="text-[13px] font-medium text-foreground">
          Nome <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${idPrefix}-name`}
          type="text"
          required
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          className="h-12 rounded-[8px] border-border bg-background text-base text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* WhatsApp */}
      <div className="space-y-1.5 text-left">
        <Label htmlFor={`${idPrefix}-phone`} className="text-[13px] font-medium text-foreground">
          WhatsApp <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${idPrefix}-phone`}
          type="tel"
          required
          placeholder="(75) 99999-9999"
          value={phone}
          onChange={handlePhoneChange}
          disabled={loading}
          className="h-12 rounded-[8px] border-border bg-background text-base text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* E-mail (obrigatório) */}
      <div className="space-y-1.5 text-left">
        <Label htmlFor={`${idPrefix}-email`} className="text-[13px] font-medium text-foreground">
          E-mail <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${idPrefix}-email`}
          ref={emailInputRef}
          type="email"
          required
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (emailError) setEmailError(null)
          }}
          disabled={loading}
          className={`h-12 rounded-[8px] bg-background text-base text-foreground placeholder:text-muted-foreground ${
            emailError ? 'border-destructive focus-visible:ring-destructive' : 'border-border'
          }`}
        />
        {emailError && (
          <p className="text-xs text-destructive font-medium flex items-center gap-1.5 pt-0.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{emailError}</span>
          </p>
        )}
      </div>

      {/* Autorização de contato */}
      <div className="space-y-2 pt-2 text-left">
        <div className="flex items-start space-x-3">
          <Checkbox
            id={`${idPrefix}-consent`}
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
              htmlFor={`${idPrefix}-consent`}
              className="cursor-pointer text-xs font-normal text-muted-foreground inline"
            >
              Autorizo a imobiliária a entrar em contato comigo por WhatsApp, telefone ou e-mail e a
              usar as buscas que fiz neste site para me atender melhor.{' '}
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

      {/* Erro do servidor com texto do que corrigir */}
      {serverError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-[8px] text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Botão Enviar: ação principal preenchida, raio 8 px, 48 px */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-[8px] font-medium text-sm min-h-[48px] bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200"
        >
          {loading ? 'Enviando...' : 'Enviar mensagem'}
        </Button>
      </div>
    </form>
  )
}

export default PublicContactForm
