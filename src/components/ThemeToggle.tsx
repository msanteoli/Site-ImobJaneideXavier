import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const ariaLabel = isDark ? 'Usar tema claro' : 'Usar tema escuro'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        'w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-foreground transition-transform duration-200" />
      ) : (
        <Moon className="h-5 w-5 text-foreground transition-transform duration-200" />
      )}
    </button>
  )
}
