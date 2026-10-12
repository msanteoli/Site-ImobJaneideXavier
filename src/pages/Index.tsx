/* TESTE DE VIABILIDADE (descartável): este projeto só tem interface e lê o servidor do projeto
   Imobdigital pelo endereço da variável VITE_API_BASE_URL. Não cria nem grava nada de verdade. */
import { useEffect, useState } from 'react'

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || ''

interface Check {
  name: string
  status: 'rodando' | 'ok' | 'falhou'
  detail: string
}

const Index = () => {
  const [checks, setChecks] = useState<Check[]>([])
  const [photo, setPhoto] = useState<string | null>(null)

  const put = (c: Check) =>
    setChecks((prev) =>
      [...prev.filter((p) => p.name !== c.name), c].sort((a, b) => a.name.localeCompare(b.name)),
    )

  useEffect(() => {
    const run = async () => {
      put({
        name: '0 variável',
        status: BASE ? 'ok' : 'falhou',
        detail: BASE ? 'VITE_API_BASE_URL definida' : 'VITE_API_BASE_URL vazia',
      })
      if (!BASE) return

      // 1) GET simples (sem preflight): filtros do site
      try {
        const r = await fetch(`${BASE}/backend/v1/public/filters`)
        const j = await r.json()
        put({
          name: '1 filtros (GET)',
          status: r.ok ? 'ok' : 'falhou',
          detail: `HTTP ${r.status}; bairros: ${Array.isArray(j.neighborhoods) ? j.neighborhoods.length : '?'}; tipos: ${Array.isArray(j.types) ? j.types.length : '?'}`,
        })
      } catch (e) {
        put({
          name: '1 filtros (GET)',
          status: 'falhou',
          detail: `erro de rede/CORS: ${String((e as Error).message)}`,
        })
      }

      // 2) lista de imóveis e uma foto servida pelo servidor interno
      try {
        const r = await fetch(`${BASE}/backend/v1/public/properties?per_page=3`)
        const j = await r.json()
        const items = Array.isArray(j.items) ? j.items : []
        put({
          name: '2 imóveis (GET)',
          status: r.ok ? 'ok' : 'falhou',
          detail: `HTTP ${r.status}; ${items.length} imóveis na amostra`,
        })
        const cover = items.find((i: { cover?: string | null }) => i.cover)?.cover
        if (cover) {
          const url = cover.startsWith('http') ? cover : `${BASE}${cover}`
          setPhoto(url)
          put({ name: '3 foto (img)', status: 'rodando', detail: 'carregando a imagem abaixo...' })
        } else {
          put({
            name: '3 foto (img)',
            status: 'falhou',
            detail: 'nenhum imóvel com foto na amostra',
          })
        }
      } catch (e) {
        put({
          name: '2 imóveis (GET)',
          status: 'falhou',
          detail: `erro de rede/CORS: ${String((e as Error).message)}`,
        })
      }

      // 3) POST com JSON (exige preflight CORS). O corpo é inválido de propósito: o servidor responde 400
      //    ANTES de criar qualquer lead. Não grava nada.
      try {
        const r = await fetch(`${BASE}/backend/v1/public/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        put({
          name: '4 contato (POST com preflight)',
          status: r.status === 400 ? 'ok' : 'falhou',
          detail: `HTTP ${r.status} (esperado 400: corpo vazio recusado, nada foi criado)`,
        })
      } catch (e) {
        put({
          name: '4 contato (POST com preflight)',
          status: 'falhou',
          detail: `erro de rede/CORS: ${String((e as Error).message)}`,
        })
      }
    }
    run()
  }, [])

  return (
    <div className="container mx-auto py-8 px-4 space-y-4">
      <h1 className="text-2xl font-bold">Teste de viabilidade: site separado</h1>
      <p className="text-sm text-muted-foreground">
        Esta página só lê o servidor do sistema interno. Nada é gravado.
      </p>
      <ul className="space-y-2 text-sm">
        {checks.map((c) => (
          <li key={c.name} className="rounded border p-3">
            <b>{c.name}</b>: {c.status === 'ok' ? 'OK' : c.status === 'falhou' ? 'FALHOU' : '...'} —{' '}
            {c.detail}
          </li>
        ))}
      </ul>
      {photo && (
        <img
          src={photo}
          alt="foto de teste"
          className="max-h-64 rounded border"
          onLoad={() =>
            put({
              name: '3 foto (img)',
              status: 'ok',
              detail: 'imagem carregou do servidor interno',
            })
          }
          onError={() =>
            put({ name: '3 foto (img)', status: 'falhou', detail: 'a imagem não carregou' })
          }
        />
      )}
    </div>
  )
}

export default Index
