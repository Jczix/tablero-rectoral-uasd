import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { FILTRO_INICIAL, reducir, type Accion, type EstadoFiltros } from './filtros'
import type { Filtro } from '../data/source'

interface Valor {
  filtro: Filtro
  historial: Filtro[]
  despachar: (a: Accion) => void
}

const Ctx = createContext<Valor | null>(null)

export function ProveedorFiltros({ children }: { children: ReactNode }) {
  const inicial: EstadoFiltros = { actual: FILTRO_INICIAL, historial: [] }
  const [estado, despachar] = useReducer(reducir, inicial)
  return (
    <Ctx.Provider value={{
      filtro: estado.actual, historial: estado.historial, despachar,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useFiltros(): Valor {
  const v = useContext(Ctx)
  if (!v) throw new Error('useFiltros debe usarse dentro de ProveedorFiltros')
  return v
}
