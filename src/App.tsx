import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SiteConfigProvider } from '@/contexts/SiteConfigContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

import BuscarPage from '@/pages/BuscarPage'
import ImovelPublicoPage from '@/pages/ImovelPublicoPage'
import Privacidade from '@/pages/Privacidade'
import SobrePage from '@/pages/SobrePage'
import LancamentoPage from '@/pages/LancamentoPage'
import VenderPage from '@/pages/VenderPage'
import NotFound from '@/pages/NotFound'

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <ThemeProvider>
        <SiteConfigProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<BuscarPage />} />
              <Route path="/buscar" element={<BuscarPage />} />
              <Route path="/buscar/:codigo" element={<ImovelPublicoPage />} />
              <Route path="/sobre" element={<SobrePage />} />
              <Route path="/vender" element={<VenderPage />} />
              <Route path="/lancamentos/:slug" element={<LancamentoPage />} />
              <Route path="/privacidade" element={<Privacidade />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </SiteConfigProvider>
      </ThemeProvider>
    </BrowserRouter>
  </ErrorBoundary>
)

export default App
