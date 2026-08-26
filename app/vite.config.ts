import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  // En producción la app vive en jczix.github.io/tablero-rectoral-uasd/
  // (GitHub Pages sirve bajo la ruta del repositorio); en dev y en pruebas
  // sigue en la raíz.
  base: mode === 'production' ? '/tablero-rectoral-uasd/' : '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/pruebas/setup.ts'],
  },
}))
