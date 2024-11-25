import { defineConfig } from 'vite'
import glslify from 'rollup-plugin-glslify'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    glslify()
  ],
  resolve: {},
})

