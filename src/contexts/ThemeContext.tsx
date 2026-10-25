import React, { createContext, useContext, useEffect, useState } from 'react'

export type ThemePreference = 'auto' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: ThemePreference
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemePreference) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'imob_site_tema'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getStoredTheme(): ThemePreference {
  try {
    const item = localStorage.getItem(STORAGE_KEY)
    if (item === 'claro' || item === 'light') {
      return 'light'
    }
    if (item === 'escuro' || item === 'dark') {
      return 'dark'
    }
  } catch {
    // localStorage bloqueado ou indisponível
  }
  return 'auto'
}

function getSystemTheme(): ResolvedTheme {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark'
  }
  return 'light'
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemePreference>(() => getStoredTheme())
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme())

  // Acompanha mudanças no prefers-color-scheme do sistema em tempo real
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  const resolvedTheme: ResolvedTheme = theme === 'auto' ? systemTheme : theme

  // Aplica classe no <html> conforme tema resolvido
  useEffect(() => {
    try {
      const root = document.documentElement
      if (resolvedTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    } catch {
      // noop
    }
  }, [resolvedTheme])

  const setTheme = (newTheme: ThemePreference) => {
    setThemeState(newTheme)
    try {
      if (newTheme === 'auto') {
        localStorage.removeItem(STORAGE_KEY)
      } else if (newTheme === 'dark') {
        localStorage.setItem(STORAGE_KEY, 'escuro')
      } else if (newTheme === 'light') {
        localStorage.setItem(STORAGE_KEY, 'claro')
      }
    } catch {
      // Falha ao gravar no localStorage ignorada
    }
  }

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light')
    } else {
      setTheme('dark')
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider')
  }
  return context
}
