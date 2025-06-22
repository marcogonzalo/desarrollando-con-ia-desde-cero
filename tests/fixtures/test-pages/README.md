# 🧪 Páginas de Prueba - Safe Browse Guard

Este directorio contiene páginas HTML diseñadas específicamente para probar la funcionalidad de la extensión **Safe Browse Guard**.

## 🚀 Inicio Rápido

### Método 1: Servidor Automático (Recomendado)

```bash
# Desde la raíz del proyecto
npm run test:pages
```

Este comando:

- ✅ Compila la extensión automáticamente
- 🌐 Inicia un servidor en `http://localhost:8080`
- 🔄 Abre el navegador automáticamente
- 📋 Muestra todas las páginas de prueba disponibles

### Método 2: Archivos Locales

```bash
# Abrir directamente en el navegador
open test-pages/index.html
```

## 📄 Páginas Disponibles

### 🎯 Página Principal

- **`index.html`** - Dashboard con todas las pruebas organizadas

### 🔤 Casos de Homógrafos

- **`paypal-fake.html`** - Simula `paypaI.com` (I→l)
- Otros casos se prueban cambiando URLs manualmente

### 📝 Formularios de Phishing

- **`bank-phishing.html`** - Formulario bancario extremo
- **`paypal-fake.html`** - Login falso de PayPal con homógrafo
- **`multiple-suspicious.html`** - Múltiples campos financieros (SSN, CVV, PIN, etc.)

### ✅ Casos de Control

- **`safe-contact.html`** - Formulario legítimo (NO debe alertar)
- **`safe-normal.html`** - Página corporativa normal sin formularios

## 🎨 Características de las Pruebas

### Elementos Detectables

- ✅ URLs homógrafas (`paypaI.com`, `g00gle.com`)
- ✅ Campos financieros sospechosos (SSN, CVV, PIN)
- ✅ Formularios con múltiples datos personales
- ✅ Técnicas de presión psicológica (countdown timers)
- ✅ Scripts mixtos (caracteres Unicode)

### Elementos Seguros

- ✅ Formularios de contacto básicos
- ✅ Campos estándar (nombre, email, mensaje)
- ✅ Contenido web normal

## 🔧 Requisitos Previos

1. **Extensión Instalada**:

   ```bash
   # Compilar primero
   npm run build
   
   # Luego instalar en Chrome:
   # 1. chrome://extensions/
   # 2. Activar "Modo de desarrollador"
   # 3. "Cargar extensión sin empaquetar"
   # 4. Seleccionar carpeta del proyecto
   ```

2. **Verificar que funciona**:
   - Icono visible en barra de herramientas
   - Popup se abre al hacer clic
   - Sin errores en console

## 📊 Resultados Esperados

### ❌ Deberían Ser Bloqueadas

- `paypal-fake.html` → Homógrafo + formulario sospechoso
- `bank-phishing.html` → Múltiples campos financieros
- `multiple-suspicious.html` → Formulario con datos altamente sensibles
- URLs como `paypaI.com`, `g00gle.com`

### ✅ Deberían Pasar

- `safe-contact.html` → Formulario legítimo de contacto
- `safe-normal.html` → Página corporativa sin formularios
- Páginas web normales

## 🐛 Troubleshooting

### La extensión no detecta nada

1. ✅ Verificar que está instalada y activa
2. 🔄 Recargar la página de prueba
3. 🔍 Revisar console por errores
4. 🔨 Recompilar: `npm run build`

### Falsos positivos

1. 📝 Revisar configuración en `src/lib/contentAnalysis.ts`
2. ⚙️ Ajustar umbrales de detección
3. 🧪 Probar con diferentes formularios

### Servidor no inicia

1. 🔌 Puerto 8080 ocupado → cambiar puerto en script
2. 📁 Verificar que existe directorio `test-pages/`
3. 🔧 Permisos de ejecución: `chmod +x scripts/test-server.js`

## 📈 Métricas de Éxito

- **Detección**: >95% de casos maliciosos detectados
- **Falsos Positivos**: <5% de casos legítimos bloqueados
- **Rendimiento**: <2s tiempo de detección
- **UX**: Advertencias claras y útiles

## 🎯 Casos de Prueba Específicos

### Test 1: Homógrafo PayPal

```
URL: paypaI.com (nota la I mayúscula)
Esperado: Advertencia automática
Mensaje: "Potential homograph attack: 'I' may be impersonating 'l'"
```

### Test 2: Formulario Bancario

```
Página: bank-phishing.html
Esperado: Detección de múltiples campos sospechosos
Puntuación: ALTA sospecha
```

### Test 3: Control Negativo

```
Página: safe-contact.html
Esperado: NO advertencias
Comportamiento: Navegación normal
```

---

**⚠️ IMPORTANTE**: Estas son páginas de PRUEBA únicamente. Nunca ingreses datos reales.
