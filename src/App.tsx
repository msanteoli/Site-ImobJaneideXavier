import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/contexts/ThemeContext'

import BuscarPage from '@/pages/BuscarPage'
import ImovelPublicoPage from '@/pages/ImovelPublicoPage'
import Privacidade from '@/pages/Privacidade'
import SobrePage from '@/pages/SobrePage'
import LancamentoPage from '@/pages/LancamentoPage'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<BuscarPage />} />
          <Route path="/buscar" element={<BuscarPage />} />
          <Route path="/buscar/:codigo" element={<ImovelPublicoPage />} />
          <Route path="/sobre" element={<SobrePage />} />
          <Route path="/lancamentos/:slug" element={<LancamentoPage />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </ThemeProvider>
  </BrowserRouter>
)

export default App
