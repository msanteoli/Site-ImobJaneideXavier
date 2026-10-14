import React, { useState, useEffect, useRef } from 'react'
import { submitLead } from '@/services/publicSite'
import { snapshot } from '@/lib/searchMemory'
import { getCampaign } from '@/lib/campaign'
import { trackLead, trackWhatsapp } from '@/lib/marketing'
import { maskPhoneInput } from '@/lib/clientUtils'
import { formatVisitSlot } from '@/lib/publicSiteUtils'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, CheckCircle2, MessageCircle, Calendar } from 'lucide-react'

interface PublicContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyCode?: string
  visitStart?: string
  onSubmitted?: () => void
  onChooseOtherSlot?: () => void
}

export const PublicContactModal: React.FC<PublicContactModalProps> = ({
  open,
  onOpenChange,
  propertyCode,
  visitStart,
  onSubmitted,
  onChooseOtherSlot,
}) => {
  const isMobile = useIsMobile()

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

  // Quando o modal abre, gera um submissionId UMA vez se não houver um ativo para este fluxo
  useEffect(() => {
    if (open) {
      if (!submissionId || successResponse) {
        setSubmissionId(crypto.randomUUID())
      }
      setConsentError(false)
      setEmailError(null)
      setServerError(null)
      // Se já estava com sucesso e abriu de novo, reseta tudo
      if (successResponse) {
        setSuccessResponse(null)
        setName('')
        setPhone('')
        setEmail('')
        setConsent(false)
        setWebsite('')
      }
    }
  }, [open, successResponse, submissionId])

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

      // Notifica o componente pai para recarregar horários da ficha após qualquer envio
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

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleChooseOtherSlot = () => {
    onOpenChange(false)
    if (onChooseOtherSlot) {
      onChooseOtherSlot()
    }
  }

  const formattedVisitStart = visitStart ? formatVisitSlot(visitStart) : null

  // Monta a mensagem de sucesso conforme o valor de visit retornado pelo servidor
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

  const formContent = (
    <div>
      {successResponse ? (
        <div className="py-6 flex flex-col items-center text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-foreground tracking-tight">
            Recebemos o seu contato. Em breve falaremos com você.
          </h3>
          {renderSuccessMessage()}

          <div className="w-full pt-4 space-y-3">
            {successResponse.visit === 'slot_taken' && (
              <Button
                type="button"
                className="w-full rounded-[8px] h-12 min-h-[48px] font-medium"
                onClick={handleChooseOtherSlot}
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
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-[8px] h-12 min-h-[48px] border-border font-medium"
              onClick={handleClose}
            >
              Continuar buscando
            </Button>
          </div>
        </div>
      ) : (
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
            <label htmlFor="website-trap">Website</label>
            <input
              id="website-trap"
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
            <Label htmlFor="lead-name" className="text-[13px] font-medium text-foreground">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lead-name"
              type="text"
              required
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="h-12 rounded-[8px] border-border bg-background text-sm"
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5 text-left">
            <Label htmlFor="lead-phone" className="text-[13px] font-medium text-foreground">
              WhatsApp <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lead-phone"
              type="tel"
              required
              placeholder="(75) 99999-9999"
              value={phone}
              onChange={handlePhoneChange}
              disabled={loading}
              className="h-12 rounded-[8px] border-border bg-background text-sm"
            />
          </div>

          {/* E-mail (obrigatório) */}
          <div className="space-y-1.5 text-left">
            <Label htmlFor="lead-email" className="text-[13px] font-medium text-foreground">
              E-mail <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lead-email"
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
              className={`h-12 rounded-[8px] bg-background text-sm ${
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
                id="lead-consent"
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
                  htmlFor="lead-consent"
                  className="cursor-pointer text-xs font-normal text-muted-foreground inline"
                >
                  Autorizo a imobiliária a entrar em contato comigo por WhatsApp, telefone ou e-mail
                  e a usar as buscas que fiz neste site para me atender melhor.{' '}
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
              className="w-full h-12 rounded-[8px] font-medium text-sm min-h-[48px]"
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )

  const titleText = propertyCode
    ? `Tenho interesse no imóvel ${propertyCode}`
    : 'Falar com a imobiliária'
  const descText = 'Preencha seus dados para receber atendimento de um dos nossos corretores.'

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-[16px] px-6 py-6 max-h-[92vh] overflow-y-auto"
        >
          <SheetHeader className="text-left mb-4">
            <SheetTitle className="text-lg font-semibold text-foreground">{titleText}</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              {descText}
            </SheetDescription>
          </SheetHeader>
          {formContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[16px] border border-border p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)] dark:shadow-none">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-semibold text-foreground">{titleText}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {descText}
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  )
}
