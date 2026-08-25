import { ProveedorFiltros } from './state/FiltrosContext'
import { Encabezado } from './components/marco/Encabezado'
import { BarraFiltros } from './components/filtros/BarraFiltros'
import { Rectoral } from './vistas/Rectoral'

export default function App() {
  return (
    <ProveedorFiltros>
      <div className="flex h-screen flex-col overflow-hidden bg-panel">
        <Encabezado />
        <BarraFiltros />
        <main className="min-h-0 flex-1 overflow-hidden"><Rectoral /></main>
      </div>
    </ProveedorFiltros>
  )
}
