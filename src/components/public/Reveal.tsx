import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export type RevealVariant = 'default' | 'photo'

export interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
  /**
   * Tag HTML a ser renderizada. Padrão: 'div'.
   */
  as?: React.ElementType
  /**
   * Tipo de reveal:
   * - 'default': fade in + translateY(24px)
   * - 'photo': máscara de baixo para cima com clip-path
   */
  variant?: RevealVariant
  /**
   * Atraso em milissegundos antes da animação iniciar.
   */
  delay?: number
  /**
   * Classes adicionais
   */
  className?: string
  /**
   * Estilo em linha adicional
   */
  style?: React.CSSProperties
}

/**
 * Componente Reveal
 *
 * Utiliza IntersectionObserver para animar a entrada de elementos uma única vez.
 * Suporta prefers-reduced-motion e fallback direto caso IntersectionObserver não exista.
 * O conteúdo sempre existe no HTML desde o primeiro instante para SEO e acessibilidade.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  as: Component = 'div',
  variant = 'default',
  delay = 0,
  className,
  style,
  ...props
}) => {
  const elementRef = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 1. Respeito a prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReduced) {
        setIsVisible(true)
        return
      }
    }

    // 2. Fallback caso IntersectionObserver não exista no browser
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true)
      return
    }

    const node = elementRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          setIsVisible(true)
          // Executa uma única vez: desconecta após entrar
          observer.disconnect()
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [])

  const baseClass = variant === 'photo' ? 'reveal-photo' : 'reveal'

  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(delay > 0 ? { transitionDelay: `${delay}ms` } : {}),
  }

  return (
    <Component
      ref={elementRef}
      className={cn(baseClass, isVisible && 'is-visible', className)}
      style={mergedStyle}
      {...props}
    >
      {children}
    </Component>
  )
}

export default Reveal
