#!/usr/bin/env node

/**
 * Script para empaquetar Safe Browse Guard para Chrome Web Store
 * Genera un archivo ZIP listo para subir a la tienda
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const DIST_DIR = 'dist';
const OUTPUT_DIR = 'releases';
const PACKAGE_NAME = 'safe-browse-guard-v1.0.0.zip';

console.log('🔧 Empaquetando Safe Browse Guard para Chrome Web Store...\n');

// Verificar que existe el directorio dist
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ Error: El directorio dist no existe. Ejecuta "npm run build" primero.');
  process.exit(1);
}

// Crear directorio de releases si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log('📁 Directorio releases creado');
}

// Crear el archivo ZIP
const output = fs.createWriteStream(path.join(OUTPUT_DIR, PACKAGE_NAME));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Empaquetado completado!`);
  console.log(`📦 Archivo: ${path.join(OUTPUT_DIR, PACKAGE_NAME)}`);
  console.log(`📏 Tamaño: ${sizeInMB} MB`);
  console.log(`📄 Archivos totales: ${archive.pointer()} bytes`);
  
  console.log('\n🚀 Siguiente paso:');
  console.log('   1. Abre Chrome Developer Dashboard: https://chrome.google.com/webstore/devconsole');
  console.log('   2. Sube el archivo ZIP generado');
  console.log('   3. Completa la información de la tienda usando chrome-store/store-listing.md');
  console.log('   4. Solicita revisión para publicación\n');
});

archive.on('error', (err) => {
  console.error('❌ Error empaquetando:', err);
  process.exit(1);
});

archive.pipe(output);

// Añadir todos los archivos del directorio dist
console.log('📋 Añadiendo archivos al paquete:');

function addFilesToArchive(dir, basePath = '') {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const relativePath = path.join(basePath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      addFilesToArchive(fullPath, relativePath);
    } else {
      // Solo incluir archivos necesarios para la extensión
      const validExtensions = ['.js', '.html', '.css', '.json', '.png', '.svg', '.ico'];
      const hasValidExtension = validExtensions.some(ext => file.endsWith(ext));
      
      if (hasValidExtension) {
        archive.file(fullPath, { name: relativePath });
        console.log(`   ✓ ${relativePath}`);
      }
    }
  });
}

addFilesToArchive(DIST_DIR);

// Añadir archivos adicionales necesarios
const additionalFiles = [
  'README.md',
  'LICENSE' // Si existe
];

additionalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    archive.file(file, { name: file });
    console.log(`   ✓ ${file}`);
  }
});

console.log('\n📦 Finalizando archivo...');
archive.finalize(); 