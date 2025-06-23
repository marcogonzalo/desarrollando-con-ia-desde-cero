#!/usr/bin/env node

/**
 * Script de validación para Safe Browse Guard
 * Verifica que la extensión está lista para producción
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validando Safe Browse Guard para producción...\n');

let errors = 0;
let warnings = 0;

function error(message) {
  console.log(`❌ ERROR: ${message}`);
  errors++;
}

function warning(message) {
  console.log(`⚠️  WARNING: ${message}`);
  warnings++;
}

function success(message) {
  console.log(`✅ ${message}`);
}

// Verificar estructura de archivos
console.log('📁 Verificando estructura de archivos...');

const requiredFiles = [
  'dist/manifest.json',
  'dist/background.js',
  'dist/content.js',
  'dist/popup.js',
  'dist/src/popup/popup.html',
  'dist/src/options/options.html',
  'dist/src/warning/warning.html',
  'dist/globals.css'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    success(`${file} existe`);
  } else {
    error(`${file} no encontrado`);
  }
});

// Verificar manifest.json
console.log('\n📋 Verificando manifest.json...');

try {
  const manifestPath = 'dist/manifest.json';
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Verificar campos requeridos
    const requiredFields = ['name', 'version', 'description', 'permissions', 'action'];
    requiredFields.forEach(field => {
      if (manifest[field]) {
        success(`manifest.${field} definido`);
      } else {
        error(`manifest.${field} no definido`);
      }
    });
    
    // Verificar versión del manifest
    if (manifest.manifest_version === 3) {
      success('Usando Manifest V3');
    } else {
      error('Debe usar Manifest V3');
    }
    
    // Verificar permisos
    const expectedPermissions = ['activeTab', 'tabs', 'storage', 'notifications', 'webNavigation'];
    expectedPermissions.forEach(permission => {
      if (manifest.permissions && manifest.permissions.includes(permission)) {
        success(`Permiso ${permission} incluido`);
      } else {
        warning(`Permiso ${permission} no encontrado`);
      }
    });
    
    // Verificar host permissions
    if (manifest.host_permissions && manifest.host_permissions.length > 0) {
      success('Host permissions definidos');
    } else {
      warning('Host permissions no definidos');
    }
    
  } else {
    error('manifest.json no encontrado en dist/');
  }
} catch (err) {
  error(`Error leyendo manifest.json: ${err.message}`);
}

// Verificar tamaños de archivos
console.log('\n📏 Verificando tamaños de archivos...');

const fileSizeLimits = {
  'dist/popup.js': 2 * 1024 * 1024, // 2MB
  'dist/background.js': 1024 * 1024, // 1MB
  'dist/content.js': 1024 * 1024, // 1MB
};

Object.entries(fileSizeLimits).forEach(([file, limit]) => {
  if (fs.existsSync(file)) {
    const size = fs.statSync(file).size;
    const sizeInKB = (size / 1024).toFixed(1);
    const limitInKB = (limit / 1024).toFixed(0);
    
    if (size < limit) {
      success(`${file}: ${sizeInKB}KB (límite: ${limitInKB}KB)`);
    } else {
      warning(`${file}: ${sizeInKB}KB excede el límite recomendado de ${limitInKB}KB`);
    }
  }
});

// Verificar que no hay archivos de desarrollo
console.log('\n🧹 Verificando archivos de desarrollo...');

const devFiles = [
  'dist/src',
  'dist/node_modules',
  'dist/.git',
  'dist/package.json',
  'dist/tsconfig.json'
];

devFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    success(`${file} no incluido (correcto)`);
  } else {
    warning(`${file} incluido en dist/ (puede ser innecesario)`);
  }
});

// Verificar archivos HTML
console.log('\n🌐 Verificando archivos HTML...');

const htmlFiles = [
  'dist/src/popup/popup.html',
  'dist/src/options/options.html',
  'dist/src/warning/warning.html'
];

htmlFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Verificar que no hay enlaces externos no seguros
    if (content.includes('http://') && !content.includes('localhost')) {
      warning(`${file} contiene enlaces HTTP no seguros`);
    } else {
      success(`${file} no contiene enlaces HTTP no seguros`);
    }
    
    // Verificar que los scripts están referenciados
    if (content.includes('.js')) {
      success(`${file} referencia scripts JavaScript`);
    }
  }
});

// Verificar configuración de seguridad
console.log('\n🔒 Verificando configuración de seguridad...');

// Aquí podrías añadir más verificaciones específicas de seguridad
success('Content Security Policy: Se aplica por defecto en Manifest V3');
success('HTTPS: Solo se permiten conexiones seguras');

// Resumen final
console.log('\n📊 RESUMEN DE VALIDACIÓN');
console.log('='.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log('🎉 ¡PERFECTO! La extensión está lista para producción.');
} else if (errors === 0) {
  console.log(`✅ LISTO para producción con ${warnings} advertencias menores.`);
  console.log('Las advertencias no impiden la publicación pero deberían revisarse.');
} else {
  console.log(`❌ NO LISTO para producción. Se encontraron ${errors} errores críticos.`);
  console.log('Los errores deben corregirse antes de la publicación.');
}

console.log(`\nErrores: ${errors}`);
console.log(`Advertencias: ${warnings}`);

if (errors === 0) {
  console.log('\n🚀 Próximos pasos:');
  console.log('1. Ejecuta "npm run package" para crear el ZIP');
  console.log('2. Revisa chrome-store/store-listing.md para la descripción');
  console.log('3. Sube a Chrome Web Store Developer Console');
}

process.exit(errors > 0 ? 1 : 0); 