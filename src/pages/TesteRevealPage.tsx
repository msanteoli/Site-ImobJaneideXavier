import React from 'react'
import Reveal from '@/components/public/Reveal'

export const TesteRevealPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-4xl mx-auto space-y-12">
      <header className="space-y-2">
        <h1 className="text-display-xl">Página de Validação de Reveal</h1>
        <p className="text-muted-foreground">
          Página temporária de desenvolvimento para testar tokens de tipografia, espaçamento e
          componente Reveal.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-display-md">Títulos com Escala Display</h2>
        <p className="text-display-sm">Exemplo Display Pequeno (display-sm)</p>
      </section>

      <section className="space-y-8 py-section-sm">
        <Reveal variant="default">
          <div className="p-6 rounded-lg border bg-card text-card-foreground">
            <h3 className="text-lg font-semibold mb-2">Bloco de Reveal Padrão</h3>
            <p className="text-sm text-muted-foreground">
              Entrou com opacidade e translação vertical suave.
            </p>
          </div>
        </Reveal>

        <Reveal variant="photo" delay={200}>
          <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
            <img
              src="https://img.usecurling.com/p/800/450?q=modern+house"
              alt="Casa Moderna de Teste"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 p-4 on-photo text-foreground font-medium">
              Foto mascarada com reveal-photo (clip-path de baixo para cima)
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

export default TesteRevealPage
