import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        index: resolve(__dirname, "pages/index.html"),
        login: resolve(__dirname, "pages/login.html"),
        dashboard: resolve(__dirname, "pages/dashboard.html"),
        usuarios: resolve(__dirname, "pages/usuarios.html"),
        proveedores: resolve(__dirname, "pages/proveedores.html"),
        productos: resolve(__dirname, "pages/productos.html"),
        ventas: resolve(__dirname, "pages/ventas.html"),
        estadisticas: resolve(__dirname, "pages/estadisticas.html")
      }
    }
  },
  server: {
    port: 5173
  }
});
