# Plan de Implementación: Extensión de Detección de Sitios Web Sospechosos

## Descripción del Proyecto

Desarrollar una extensión de navegador para proteger a usuarios no técnicos de sitios web sospechosos en tiempo real. La extensión identificará riesgos como phishing y malware, ofreciendo alertas claras y consejos prácticos con un enfoque en la simplicidad, la accesibilidad y la educación en ciberseguridad.

* **Audiencia Objetivo**: Particulares y pequeñas empresas con conocimientos técnicos limitados.
* **Tecnologías Propuestas**:
  * **Frontend**: HTML5, TypeScript, Vite y ShadCN para los componentes de interfaz.
  * **API de Detección**: Google Safe Browsing API.
  * **APIs de Navegador**: APIs estándar de extensiones (`chrome.tabs`, `chrome.storage`, `chrome.webRequest`, `chrome.notifications`).
  * **Testing**: Jest o un framework similar para pruebas unitarias.
* **Características del MVP**:
    1. **Verificación de URLs en tiempo real**: Integración con Google Safe Browsing para identificar amenazas conocidas.
    2. **Análisis de patrones de URL**: Detección adicional de URLs sospechosas como capa de seguridad.
    3. **Alertas visuales**: Notificaciones y cambio de icono (rojo, amarillo, verde).
    4. **Consejos prácticos**: Recomendaciones accionables según la amenaza.
    5. **Interfaz minimalista**: Interruptor de activación y panel de configuración.
    6. **Compatibilidad**: Soporte inicial para Google Chrome.
* **Buenas Prácticas**:
  * **Desarrollo**: Test-Driven Development (TDD), código limpio, modular y tipado.
  * **Accesibilidad**: Asegurar que la interfaz sea usable por todos (WCAG).
  * **Seguridad**: Privacidad por diseño, minimizando la recolección de datos.
  * **DevOps**: Integración y Despliegue Continuo (CI/CD).
  * **Control de Versiones**: Git con un flujo de trabajo claro.

## Fases del Plan de Implementación

### Fase 1: Fundación y Estructura del Proyecto (1 semana) ✅ COMPLETADA

* [x] **Tarea 1.1**: Configurar el entorno de desarrollo (Node.js, TypeScript, linters, formatters). ✅
* [x] **Tarea 1.2**: Inicializar el repositorio Git, definir la estructura de carpetas (`/src`, `/dist`, `/assets`, `/tests`). ✅
* [x] **Tarea 1.3**: Configurar el compilador de TypeScript (`tsconfig.json`) y el empaquetador (Vite). ✅
* [x] **Tarea 1.4**: Instalar y configurar ShadCN. ✅
* [x] **Tarea 1.5**: Crear el `manifest.json` inicial con permisos básicos. ✅
* [x] **Tarea 1.6**: Configurar el framework de testing (Jest) para trabajar con TypeScript. ✅
* [x] **Tarea 1.7**: Desarrollar la interfaz del popup utilizando componentes de ShadCN. ✅
* [x] **Tarea 1.8**: Escribir tests y la lógica del popup (TypeScript) para gestionar el estado (on/off) en `chrome.storage`. ✅

**Estado de la Fase 1**: Todas las tareas completadas exitosamente. La extensión tiene:

* Entorno de desarrollo completamente configurado con TypeScript, Vite, ESLint, Prettier.
* Estructura de proyecto organizada con carpetas `/src`, `/dist`, `/assets`, `/tests`
* Configuración de build funcional que genera archivos listos para Chrome
* ShadCN integrado con componentes UI funcionales (Switch)
* Manifest.json configurado con permisos necesarios
* Framework de testing Jest configurado y funcionando
* Interfaz de popup desarrollada con React + ShadCN + Tailwind CSS
* Sistema de almacenamiento de estado implementado con chrome.storage
* Extensión cargable y funcional en Chrome con modo oscuro por defecto

### Fase 2: Detección de URL con Google Safe Browsing (1-2 semanas) ✅ COMPLETADA

* [x] **Tarea 2.1**: Obtener una clave de API para Google Safe Browsing y configurar su gestión segura. ✅
* [x] **Tarea 2.2**: Escribir tests para la lógica de integración con la API de Safe Browsing (request, response, error handling). ✅
* [x] **Tarea 2.3**: Implementar el script de fondo (`background.ts`) para verificar URLs con la API en cada navegación. ✅
* [x] **Tarea 2.4**: Escribir tests para la detección de patrones de URL sospechosos como capa adicional (ej. dominios `.zip`, IDN homographs). ✅
* [x] **Tarea 2.5**: Implementar la lógica de detección de patrones de URL. ✅
* [x] **Tarea 2.6**: Implementar el cambio de icono y las notificaciones del sistema basados en la respuesta de la API y el análisis de patrones. ✅

**Estado de la Fase 2**: Todas las tareas completadas exitosamente. La extensión ahora incluye:

* Integración completa con Google Safe Browsing API para verificación de URLs en tiempo real
* Sistema de detección de patrones sospechosos como capa adicional de seguridad:
  * Detección de ataques homográficos (sustitución de caracteres)
  * Identificación de TLDs sospechosos (.zip, .exe, .tk, etc.)
  * Detección de suplantación de subdominios
  * Análisis de URLs excesivamente largas
  * Detección de scripts mixtos en nombres de dominio
* Script de background que monitorea la navegación y verifica URLs automáticamente
* Sistema de caché inteligente para optimizar rendimiento (5 minutos)
* Notificaciones del sistema para sitios peligrosos
* Actualización dinámica del icono de la extensión con badges de estado
* Manejo robusto de errores con fallback a análisis de patrones
* Tests comprehensivos para todas las funcionalidades implementadas

### Fase 3: Detección Basada en Contenido y Consejos (1-2 semanas) ✅ COMPLETADA

* [x] **Tarea 3.1**: Escribir tests para la lógica de análisis de contenido del DOM. ✅
* [x] **Tarea 3.2**: Implementar un script de contenido (`content.ts`) que analice elementos básicos de la página (ej. iframes sospechosos, formularios inseguros). ✅
* [x] **Tarea 3.3**: Diseñar e implementar una página de advertencia utilizando componentes de ShadCN. ✅
* [x] **Tarea 3.4**: Implementar la lógica para mostrar consejos prácticos y específicos en la página de advertencia según la amenaza detectada. ✅
* [x] **Tarea 3.5**: Realizar una auditoría de accesibilidad básica en los componentes de la interfaz. ✅

**Estado de la Fase 3**: Todas las tareas completadas exitosamente. La extensión ahora incluye:

* **Análisis completo de contenido DOM** con detección de:
  * Formularios inseguros (HTTP, cross-domain)
  * Scripts maliciosos (eval, ofuscación, dominios sospechosos)
  * iFrames peligrosos (JavaScript protocol, HTTP)
  * Indicadores de phishing (urgencia falsa, premios, amenazas)
  * Campos de formulario sospechosos (SSN, CVV, PIN, datos bancarios)
* **Sistema inteligente de detección de formularios legítimos** que evita falsos positivos
* **Página de advertencia completamente funcional** con:
  * Diseño responsive y accesible (ARIA completo)
  * Puntuación de riesgo visual (0-100)
  * Consejos específicos según tipo de amenaza
  * Detalles técnicos expandibles
  * Navegación con teclado completa
* **Suite completa de tests** con cobertura de todos los casos de uso
* **Páginas de prueba organizadas** en `/tests/fixtures/test-pages/` para validación
* **Servidor de pruebas automático** con puerto dinámico y compilación integrada
* **Auditorías de rendimiento** con puntuación perfecta (100/100 Performance)
* **Corrección de todos los casos críticos** incluyendo homógrafos complejos

### Fase 4: Refinamiento y Preparación del Lanzamiento (1 semana) ✅ COMPLETADA

* [x] **Tarea 4.1**: Desarrollar una página de opciones para configuraciones básicas (ej. activar/desactivar análisis de patrones). ✅
* [x] **Tarea 4.2**: Realizar pruebas de extremo a extremo, optimizando el rendimiento de las llamadas a la API. ✅
* [x] **Tarea 4.3**: Recopilar feedback de un grupo reducido de usuarios de prueba. ✅
* [x] **Tarea 4.4**: Preparar los recursos gráficos y textos para la Chrome Web Store. ✅
* [x] **Tarea 4.5**: Empaquetar la extensión y realizar una prueba de instalación final. ✅

**Estado de la Fase 4**: Todas las tareas completadas exitosamente. La extensión está lista para producción:

* **Página de opciones completa** con configuración granular de todas las funciones
* **Scripts de validación y empaquetado** automatizados para facilitar el despliegue
* **Documentación completa** para Chrome Web Store con descripciones, permisos y capturas
* **Paquete ZIP generado** (`releases/safe-browse-guard-v1.0.0.zip`) listo para subir
* **Validación pasada** con solo 1 advertencia menor (archivos HTML en dist/src)
* **Rendimiento optimizado** con bundles < 1MB y caché inteligente
* **Estructura lista para producción** con todos los permisos justificados

## Despliegue

### Proceso de Despliegue Paso a Paso

#### 1. **Preparación del Release**

```bash
# Ejecutar tests completos
npm test

# Construir para producción
npm run build

# Validar la extensión
npm run validate

# Generar paquete de release
npm run package
```

#### 2. **Documentación Chrome Web Store**

1. Abrir `/chrome-store/store-listing.md`
2. Revisar y actualizar información si es necesario
3. Copiar textos relevantes al Developer Dashboard
4. Verificar que las justificaciones de permisos están actualizadas

#### 3. **Subida a Chrome Web Store**

1. Ir a [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Crear nuevo item o actualizar existente
3. Subir el archivo `.zip` desde `/releases/`
4. Completar información usando `/chrome-store/store-listing.md`
5. Añadir capturas de pantalla (ubicadas en `/assets/images/readme/`)
6. Enviar para revisión

#### 4. **Post-Publicación**

1. Actualizar el `plan-de-implementacion.md` con el estado "PUBLICADA"
2. Crear tag de Git para la versión: `git tag v1.0.0`
3. Archivar el release actual
4. Preparar próxima iteración

### Estrategia de Actualizaciones y Despliegue Continuo

* **Versionado Semántico**: Usar formato `MAJOR.MINOR.PATCH` (ej. 1.0.0 → 1.0.1)
* **CI/CD**: Configurar pipeline automatizado:
  ```yaml
  # Ejemplo GitHub Actions
  - name: Build and Package
    run: |
      npm ci
      npm test
      npm run build
      npm run package
  ```
* **Releases Automáticos**: Generar paquetes automáticamente en cada tag
* **Validación Continua**: Ejecutar `npm run validate` en cada commit

### Gestión de Versiones

#### Para versiones PATCH (1.0.0 → 1.0.1)
- Bug fixes menores
- Actualizaciones de seguridad
- Mejoras de rendimiento

#### Para versiones MINOR (1.0.0 → 1.1.0)
- Nuevas características
- Mejoras de UI/UX
- Nuevos métodos de detección

#### Para versiones MAJOR (1.0.0 → 2.0.0)
- Cambios incompatibles
- Reestructuración completa
- Nuevos permisos requeridos
