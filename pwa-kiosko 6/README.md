# Mi Kiosko - PWA de Portadas de Prensa

PWA para consultar portadas de periódicos de España, Portugal y Francia.

## Características

- 41 periódicos organizados por categorías
- Sistema de favoritos guardado localmente
- Instalable como app nativa
- Diseño móvil optimizado

## Instalación en Android

### Opción 1: Servidor local

1. Copia la carpeta a tu PC
2. Abre terminal en la carpeta y ejecuta:
   ```
   python -m http.server 8080
   ```
3. En tu móvil (misma WiFi), abre: http://IP-DE-TU-PC:8080
4. En Chrome: Menú → "Añadir a pantalla de inicio"

### Opción 2: Hosting gratuito

Sube a Netlify, GitHub Pages o similar, y abre la URL en tu móvil.

## Estructura

- index.html - Página principal
- styles.css - Estilos
- data.js - Base de datos de periódicos
- app.js - Lógica de la app
- sw.js - Service Worker
- manifest.json - Config PWA
- icons/ - Iconos

## Licencia

Código 100% tuyo. Modifica, publica y monetiza libremente.
