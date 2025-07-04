import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        include: ['@jscad/modeling', '@jscad/io', '@jscad/stl-serializer', '@jscad/obj-serializer']
    }
}) 