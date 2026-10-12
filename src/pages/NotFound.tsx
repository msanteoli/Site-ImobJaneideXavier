/* 404 do site público */
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 text-foreground">404</h1>
        <p className="text-lg text-muted-foreground mb-4">Página não encontrada</p>
        <a href="/" className="text-primary hover:underline">
          Voltar ao início
        </a>
      </div>
    </div>
  )
}

export default NotFound
