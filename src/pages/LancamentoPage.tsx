import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Sparkles } from 'lucide-react'
import { PublicLayout } from '@/components/public/PublicLayout'
import { PropertyCard } from '@/components/public/PropertyCard'
import { PhotoZoom } from '@/components/public/PhotoZoom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getLancamento, PublicLancamentoDetail } from '@/services/publicSite'
import { getFullPhotoUrl } from '@/lib/publicSiteUtils'

export const LancamentoPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [lancamento, setLancamento] = useState<PublicLancamentoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Zoom da galeria do lançamento
  const [zoomOpen, setZoomOpen] = useState(false)
  const [zoomIndex, setZoomIndex] = useState(0)

  useEffect(() => {
    if (!slug) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setNotFound(false)
    setErrorMsg(null)

    getLancamento(slug)
      .then((data) => {
        setLancamento(data)
      })
      .catch((err: unknown) => {
        const status = (err as { status?: number })?.status
        if (status === 404) {
          setNotFound(true)
        } else {
          setErrorMsg(err instanceof Error ? err.message : 'Erro ao carregar lançamento.')
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          <Skeleton className="h-6 w-32 rounded-[8px]" />
          <Skeleton className="h-10 w-2/3 rounded-[8px]" />
          <Skeleton className="aspect-[21/9] w-full rounded-[16px]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <Skeleton className="aspect-[4/3] w-full rounded-[12px]" />
            <Skeleton className="aspect-[4/3] w-full rounded-[12px]" />
            <Skeleton className="aspect-[4/3] w-full rounded-[12px]" />
          </div>
        </div>
      </PublicLayout>
    )
  }

  // Lançamento inativo, vencido ou não encontrado: página de 404 do site
  if (notFound) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto px-4 py-24 text-center space-y-5">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Lançamento indisponível
            </h1>
            <p className="text-sm text-muted-foreground">
              Este lançamento não está mais disponível ou expirou.
            </p>
          </div>
          <div className="pt-2">
            <Button asChild variant="outline" size="lg" className="rounded-full px-6 min-h-[44px]">
              <Link to="/buscar">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ver imóveis disponíveis
              </Link>
            </Button>
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (errorMsg || !lancamento) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Erro ao carregar lançamento</h2>
          <p className="text-sm text-muted-foreground">
            {errorMsg || 'Não foi possível carregar as informações.'}
          </p>
          <Button asChild variant="outline" className="rounded-[8px] min-h-[44px]">
            <Link to="/buscar">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para busca
            </Link>
          </Button>
        </div>
      </PublicLayout>
    )
  }

  const galeria = lancamento.galeria || []
  const imoveis = lancamento.imoveis || []

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Voltar */}
        <div>
          <Link
            to="/buscar"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para a busca</span>
          </Link>
        </div>

        {/* Topo do Lançamento: Título, Tag de Lançamento e Descrição */}
        <header className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Lançamento Exclusivo</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            {lancamento.titulo}
          </h1>
          {lancamento.texto && (
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {lancamento.texto}
            </p>
          )}
        </header>

        {/* Galeria de Fotos */}
        {galeria.length > 0 && (
          <section aria-label="Galeria de fotos do lançamento" className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Galeria</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {galeria.map((foto, idx) => {
                const fullUrl = getFullPhotoUrl(foto) || ''
                return (
                  <div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setZoomIndex(idx)
                      setZoomOpen(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setZoomIndex(idx)
                        setZoomOpen(true)
                      }
                    }}
                    className="aspect-[4/3] rounded-[16px] overflow-hidden bg-muted cursor-zoom-in group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                  >
                    <img
                      src={fullUrl}
                      alt={`${lancamento.titulo} - Foto ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Grade de Imóveis vinculados ao lançamento:
            Mesmo tratamento de imóvel da busca (só Disponível e marcado para o site, sem endereço exato nem proprietário) */}
        <section
          aria-label="Imóveis do lançamento"
          className="space-y-6 pt-6 border-t border-border"
        >
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Unidades disponíveis
            </h2>
            <p className="text-sm text-muted-foreground">
              {imoveis.length === 1
                ? '1 imóvel disponível neste lançamento'
                : `${imoveis.length} imóveis disponíveis neste lançamento`}
            </p>
          </div>

          {imoveis.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {imoveis.map((prop) => (
                <PropertyCard key={prop.code} property={prop} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground bg-muted/30 rounded-[16px] border border-border p-6">
              Nenhuma unidade disponível no momento para este lançamento.
            </div>
          )}
        </section>

        {/* Modal de Zoom da Galeria */}
        {galeria.length > 0 && (
          <PhotoZoom
            open={zoomOpen}
            onOpenChange={setZoomOpen}
            photos={galeria}
            currentIndex={zoomIndex}
            onIndexChange={setZoomIndex}
            propertyTitle={lancamento.titulo}
          />
        )}
      </div>
    </PublicLayout>
  )
}

export default LancamentoPage
