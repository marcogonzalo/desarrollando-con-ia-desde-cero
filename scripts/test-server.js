#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

let PORT = 8080;
const TEST_PAGES_DIR = path.join(__dirname, '..', 'tests', 'fixtures', 'test-pages');

// Función para encontrar un puerto disponible
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  let filePath = path.join(TEST_PAGES_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(TEST_PAGES_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>404 - Página no encontrada</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #e74c3c; }
              .link { color: #3498db; text-decoration: none; }
            </style>
          </head>
          <body>
            <h1 class="error">404 - Página no encontrada</h1>
            <p>La página solicitada no existe.</p>
            <a href="/" class="link">← Volver al inicio</a>
          </body>
          </html>
        `);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error interno del servidor');
      }
      return;
    }

    const mimeType = getMimeType(filePath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
});

// Función para compilar la extensión
function buildExtension() {
  return new Promise((resolve, reject) => {
    console.log('🔨 Compilando extensión...');
    exec('npm run build', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error compilando extensión:', error);
        reject(error);
        return;
      }
      console.log('✅ Extensión compilada exitosamente');
      resolve();
    });
  });
}

// Función para abrir el navegador
function openBrowser(url) {
  const start = process.platform === 'darwin' ? 'open' : 
                process.platform === 'win32' ? 'start' : 'xdg-open';
  
  exec(`${start} ${url}`, (error) => {
    if (error) {
      console.log(`⚠️  No se pudo abrir el navegador automáticamente. Abre manualmente: ${url}`);
    } else {
      console.log(`🌐 Navegador abierto en: ${url}`);
    }
  });
}

// Verificar que el directorio de pruebas existe
if (!fs.existsSync(TEST_PAGES_DIR)) {
  console.error(`❌ Directorio de pruebas no encontrado: ${TEST_PAGES_DIR}`);
  process.exit(1);
}

async function startServer() {
  try {
    // Compilar extensión primero
    await buildExtension();
    
    // Encontrar puerto disponible
    PORT = await findAvailablePort(PORT);
    
    // Iniciar servidor
    server.listen(PORT, () => {
      console.log('\n🚀 Servidor de pruebas iniciado');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`📁 Sirviendo desde: ${TEST_PAGES_DIR}`);
      console.log('\n📋 Páginas de prueba disponibles:');
      console.log(`   • http://localhost:${PORT}/ (índice principal)`);
      console.log(`   • http://localhost:${PORT}/paypal-fake.html`);
      console.log(`   • http://localhost:${PORT}/bank-phishing.html`);
      console.log(`   • http://localhost:${PORT}/safe-contact.html`);
      console.log('\n⚠️  IMPORTANTE: Asegúrate de tener la extensión Safe Browse Guard instalada');
      console.log('   1. Ve a chrome://extensions/');
      console.log('   2. Activa "Modo de desarrollador"');
      console.log('   3. Carga la extensión desde la carpeta del proyecto');
      console.log('\n🛑 Presiona Ctrl+C para detener el servidor\n');
      
      // Abrir navegador automáticamente después de 2 segundos
      setTimeout(() => {
        openBrowser(`http://localhost:${PORT}`);
      }, 2000);
    });

    server.on('error', (err) => {
      console.error('❌ Error del servidor:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejo de señales para cierre limpio
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo servidor de pruebas...');
  server.close(() => {
    console.log('✅ Servidor detenido correctamente');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Señal de terminación recibida...');
  server.close(() => {
    console.log('✅ Servidor detenido correctamente');
    process.exit(0);
  });
});

// Iniciar servidor
startServer(); 