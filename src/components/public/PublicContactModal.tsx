import React from 'react'
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
import { PublicContactForm } from './PublicContactForm'

export interface PublicContactModalProps {
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

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleChooseOtherSlot = () => {
    onOpenChange(false)
    if (onChooseOtherSlot) {
      onChooseOtherSlot()
    }
  }

  const formContent = (
    <PublicContactForm
      key={open ? 'open' : 'closed'}
      propertyCode={propertyCode}
      visitStart={visitStart}
      onSubmitted={onSubmitted}
      onChooseOtherSlot={handleChooseOtherSlot}
      onClose={handleClose}
      variant="modal"
    />
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
