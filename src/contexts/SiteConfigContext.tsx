import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  PublicSiteConfig,
  SiteConfigLoadResult,
  fetchSiteConfigDetailed,
} from '@/services/publicSite'
import { resolveAssetUrl, hexToHslValues } from '@/lib/publicSiteUtils'

interface SiteConfigContextValue {
  config: PublicSiteConfig | null
  isPreview: boolean
  isExpiredPreview: boolean
  loading: boolean
}

const SiteConfigContext = createContext<SiteConfigContextValue>({
  config: null,
  isPreview: false,
  isExpiredPreview: false,
  loading: true,
})

let cachedLoadPromise: Promise<SiteConfigLoadResult> | null = null
function loadSharedSiteConfig(): Promise<SiteConfigLoadResult> {
  if (!cachedLoadPromise) {
    cachedLoadPromise = fetchSiteConfigDetailed().catch(() => ({
      config: null,
      isPreview: false,
      isExpiredPreview: false,
    }))
  }
  return cachedLoadPromise
}

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SiteConfigLoadResult>({
    config: null,
    isPreview: false,
    isExpiredPreview: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    loadSharedSiteConfig().then((res) => {
      if (active) {
        setState(res)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  // Aplicação de Favicon em tempo de execução
  useEffect(() => {
    if (state.config?.favicon_url) {
      const resolvedFavicon = resolveAssetUrl(state.config.favicon_url)
      if (resolvedFavicon) {
        let linkEl = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null
        if (!linkEl) {
          linkEl = document.createElement('link')
          linkEl.rel = 'icon'
          document.head.appendChild(linkEl)
        }
        linkEl.href = resolvedFavicon
      }
    }
  }, [state.config?.favicon_url])

  // Aplicação da cor primária (--primary e --primary-foreground)
  useEffect(() => {
    if (state.config?.cor_acao) {
      const hslResult = hexToHslValues(state.config.cor_acao)
      if (hslResult) {
        document.documentElement.style.setProperty('--primary', hslResult.primaryHsl)
        document.documentElement.style.setProperty('--primary-foreground', hslResult.foregroundHsl)
        document.documentElement.style.setProperty('--ring', hslResult.primaryHsl)
        return () => {
          document.documentElement.style.removeProperty('--primary')
          document.documentElement.style.removeProperty('--primary-foreground')
          document.documentElement.style.removeProperty('--ring')
        }
      }
    }
  }, [state.config?.cor_acao])

  return (
    <SiteConfigContext.Provider
      value={{
        config: state.config,
        isPreview: state.isPreview,
        isExpiredPreview: state.isExpiredPreview,
        loading,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  )
}

export function useSiteConfig(): SiteConfigContextValue {
  return useContext(SiteConfigContext)
}
