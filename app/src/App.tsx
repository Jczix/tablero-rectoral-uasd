import { ProveedorFiltros } from './state/FiltrosContext'
import { Encabezado } from './components/marco/Encabezado'
import { Rotador } from './kiosco/Rotador'

export default function App() {
  return (
    <ProveedorFiltros>
      <div className="flex h-screen flex-col overflow-hidden bg-panel">
        <Encabezado />
        <Rotador />
      </div>
    </ProveedorFiltros>
  )
}
