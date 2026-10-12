// O site público não tem login: o sistema interno é outro projeto (VITE_APP_URL).
// Este módulo existe só para a BuscarPage copiada sem alteração; nunca há sessão aqui.
export function useAuth() {
  return { isAuthenticated: false, isLoading: false }
}
