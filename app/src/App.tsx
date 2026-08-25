import { ProveedorFiltros } from './state/FiltrosContext'
import { Encabezado } from './components/marco/Encabezado'
import { BarraFiltros } from './components/filtros/BarraFiltros'
import { Rectoral } from './vistas/Rectoral'

export default function App() {
  return (
    <ProveedorFiltros>
      <div className="flex min-h-screen flex-col bg-panel">
        <Encabezado />
        <BarraFiltros />
        <main className="flex-1"><Rectoral /></main>
      </div>
    </ProveedorFiltros>
  )
}
