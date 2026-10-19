import React, { createContext, useContext, useEffect, useState } from 'react'

export type ThemePreference = 'auto' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: ThemePreference
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemePreference) => void
}

const STORAGE_KEY = 'imobdigital-theme'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getStoredTheme(): ThemePreference {
  try {
    const item = localStorage.getItem(STORAGE_KEY)
    if (item === 'light' || item === 'dark' || item === 'auto') {
      return item
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
  // Versão 2: Tema fixo claro. Nenhuma alternância nem leitura de storage.
  useEffect(() => {
    try {
      document.documentElement.classList.remove('dark')
    } catch {
      // noop
    }
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        theme: 'light',
        resolvedTheme: 'light',
        setTheme: () => {},
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
