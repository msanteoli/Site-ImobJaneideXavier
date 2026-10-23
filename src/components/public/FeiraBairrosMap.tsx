import React, { useEffect, useState, useMemo } from 'react'
import { MapPin, Info } from 'lucide-react'
import { PublicMapCount } from '@/services/publicSite'

interface FeiraBairrosMapProps {
  mapCounts: PublicMapCount[]
  onSelectNeighborhood: (bairro: string) => void
}

interface GeoJSONFeature {
  type: string
  properties: {
    name?: string
    bairro?: string
    nome?: string
    [key: string]: unknown
  }
  geometry: {
    type: string
    coordinates: number[][][] | number[][][][]
  }
}

interface GeoJSONData {
  type: string
  features: GeoJSONFeature[]
}

export const FeiraBairrosMap: React.FC<FeiraBairrosMapProps> = ({
  mapCounts,
  onSelectNeighborhood,
}) => {
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredBairro, setHoveredBairro] = useState<string | null>(null)

  // Mapeia contagem por bairro (normalizado em minúsculas)
  const countsMap = useMemo(() => {
    const map = new Map<string, number>()
    mapCounts.forEach((c) => {
      if (c && c.bairro) {
        map.set(c.bairro.trim().toLowerCase(), c.quantidade || 0)
      }
    })
    return map
  }, [mapCounts])

  // Busca arquivo GeoJSON estático em public/
  useEffect(() => {
    let mounted = true
    setLoading(true)

    // Tenta carregar possíveis nomes padrão na pasta public/
    const candidates = [
      '/feira-de-santana-bairros.geojson',
      '/bairros-feira.geojson',
      '/bairros.geojson',
    ]

    const tryFetch = async () => {
      for (const path of candidates) {
        try {
          const res = await fetch(path)
          if (res.ok) {
            const data = await res.json()
            if (data && data.type === 'FeatureCollection' && Array.isArray(data.features)) {
              if (mounted) {
                setGeoData(data)
                setLoading(false)
              }
              return
            }
          }
        } catch {
          // Continua tentando os outros
        }
      }
      if (mounted) {
        setGeoData(null)
        setLoading(false)
      }
    }

    tryFetch()

    return () => {
      mounted = false
    }
  }, [])

  // Calcula limites e monta caminhos SVG a partir da geometria (Polygon e MultiPolygon)
  const { viewBox, featuresPaths } = useMemo(() => {
    if (!geoData || !Array.isArray(geoData.features) || geoData.features.length === 0) {
      return { viewBox: '0 0 100 100', featuresPaths: [] }
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    // Converte anel de coordenadas [lng, lat] em caminho SVG:
    // Em SVG, Y cresce para baixo, enquanto latitude cresce para o norte (para cima).
    // Invertemos a latitude (y = -lat) para manter a orientação geográfica correta do mapa.
    const ringToPath = (ring: number[][]) => {
      let d = ''
      for (let i = 0; i < ring.length; i++) {
        const pt = ring[i]
        if (!pt || pt.length < 2) continue
        const x = pt[0]
        const y = -pt[1]

        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y

        d += `${i === 0 ? 'M' : 'L'} ${x} ${y} `
      }
      return d ? `${d}Z ` : ''
    }

    const paths = geoData.features.map((feature, idx) => {
      let pathData = ''
      const geom = feature.geometry
      if (geom) {
        if (geom.type === 'Polygon') {
          const coords = geom.coordinates as number[][][]
          if (Array.isArray(coords)) {
            coords.forEach((ring) => {
              if (Array.isArray(ring)) {
                pathData += ringToPath(ring)
              }
            })
          }
        } else if (geom.type === 'MultiPolygon') {
          const coords = geom.coordinates as number[][][][]
          if (Array.isArray(coords)) {
            coords.forEach((poly) => {
              if (Array.isArray(poly)) {
                poly.forEach((ring) => {
                  if (Array.isArray(ring)) {
                    pathData += ringToPath(ring)
                  }
                })
              }
            })
          }
        }
      }

      const bairroNome =
        feature.properties.name ||
        feature.properties.bairro ||
        feature.properties.nome ||
        `Bairro ${idx + 1}`

      return {
        id: idx,
        nome: bairroNome,
        d: pathData.trim(),
      }
    })

    if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
      return { viewBox: '0 0 100 100', featuresPaths: [] }
    }

    const width = maxX - minX || 1
    const height = maxY - minY || 1
    const marginX = width * 0.04
    const marginY = height * 0.04

    const vbX = minX - marginX
    const vbY = minY - marginY
    const vbW = width + marginX * 2
    const vbH = height + marginY * 2

    return {
      viewBox: `${vbX} ${vbY} ${vbW} ${vbH}`,
      featuresPaths: paths,
    }
  }, [geoData])

  // Se não houver arquivo GeoJSON no projeto, a regra diz:
  // "Se não houver arquivo, a seção NÃO aparece"
  if (loading || !geoData || featuresPaths.length === 0) {
    return null
  }

  // Renderiza SVG com polígonos calculando viewBox a partir dos bounds
  // Sem pino, sem coordenada de imóvel, sem endereço. Apenas polígonos de bairros.
  return (
    <section
      aria-label="Mapa de bairros de Feira de Santana"
      className="w-full bg-background py-10 border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Explore por bairros em Feira de Santana</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Passe o cursor ou toque no bairro para ver a quantidade e clique para filtrar a busca
            </p>
          </div>
          {hoveredBairro && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-medium text-foreground">
              <Info className="h-4 w-4 text-primary" />
              <span>{hoveredBairro}</span>
            </div>
          )}
        </div>

        {/* Renderizador de SVG interativo baseado nas features do GeoJSON */}
        <div className="relative w-full aspect-[16/9] max-h-[500px] bg-muted/30 rounded-[16px] border border-border overflow-hidden flex items-center justify-center p-4">
          <svg className="w-full h-full" viewBox={viewBox}>
            {featuresPaths.map((item) => {
              const bairroNome = item.nome
              const count = countsMap.get(bairroNome.trim().toLowerCase()) || 0
              const isClickable = count > 0

              if (!item.d) return null

              return (
                <path
                  key={item.id}
                  d={item.d}
                  fillRule="evenodd"
                  className={
                    isClickable
                      ? 'fill-primary/40 stroke-primary hover:fill-primary/70 transition-colors cursor-pointer'
                      : 'fill-muted/70 stroke-border opacity-60 cursor-not-allowed pointer-events-none'
                  }
                  strokeWidth="0.001"
                  vectorEffect="non-scaling-stroke"
                  onMouseEnter={() => {
                    setHoveredBairro(
                      `${bairroNome}: ${count > 0 ? `${count} imóveis` : 'Sem imóveis'}`,
                    )
                  }}
                  onMouseLeave={() => setHoveredBairro(null)}
                  onClick={() => {
                    if (isClickable) {
                      onSelectNeighborhood(bairroNome)
                    }
                  }}
                >
                  <title>{`${bairroNome} (${count} imóveis)`}</title>
                </path>
              )
            })}
          </svg>
        </div>
      </div>
    </section>
  )
}
